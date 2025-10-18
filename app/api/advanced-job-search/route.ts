import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { advancedJobSearch, AdvancedJobSearchConfig, ExaJobResult } from "@/lib/ai/advanced-exa-job-search";
import { PortfolioParser, ParsedPortfolioData } from "@/lib/portfolio-parser";
import { JobSearchFilters } from "@/lib/ai/exa";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      searchQuery,
      searchStrategies = ['neural', 'keyword', 'hybrid'],
      includeFreshJobs = true,
      includeRemoteJobs = true,
      maxResults = 50,
      extractFullContent = true,
      customFilters = {}
    } = body;

    // Get user profile and active portfolio
    const [profileResult, portfoliosResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('portfolios')
        .select('content, title, updated_at, is_published')
        .eq('user_id', user.id)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1)
    ]);

    const profile = profileResult.data;
    const activePortfolio = portfoliosResult.data?.[0];

    if (!profile || !activePortfolio) {
      return NextResponse.json({ 
        error: "Active portfolio required for advanced job search. Please create and activate a portfolio first." 
      }, { status: 404 });
    }

    // Parse portfolio with comprehensive analysis
    let parsedPortfolio: ParsedPortfolioData;
    try {
      parsedPortfolio = PortfolioParser.parsePortfolio(activePortfolio.content);
      console.log('Advanced job search - Portfolio analysis:', {
        skills: parsedPortfolio.skills.all.slice(0, 10),
        experienceLevel: parsedPortfolio.experience.level,
        preferredRoles: parsedPortfolio.preferences.preferredRoles,
        marketProfile: parsedPortfolio.marketProfile.competitiveLevel,
        rarityScore: parsedPortfolio.marketProfile.rarityScore,
      });
    } catch (error) {
      console.error('Portfolio parsing error:', error);
      return NextResponse.json({ 
        error: "Failed to parse portfolio data" 
      }, { status: 500 });
    }

    // Build intelligent search filters based on parsed portfolio
    const filters: JobSearchFilters = {
      skills: parsedPortfolio.skills.all.slice(0, 15), // Top 15 skills
      location: profile.location || parsedPortfolio.location,
      experienceLevel: parsedPortfolio.experience.level,
      jobType: customFilters.jobType || 'full-time',
      remote: includeRemoteJobs || parsedPortfolio.preferences.remotePreference === 'remote',
      industry: parsedPortfolio.experience.industries.slice(0, 3),
      salaryRange: customFilters.salaryRange,
      companySize: parsedPortfolio.preferences.preferredCompanySize?.[0] as any,
      ...customFilters
    };

    // Advanced search configuration
    const searchConfig: AdvancedJobSearchConfig = {
      searchStrategies: searchStrategies as ('neural' | 'keyword' | 'hybrid')[],
      includeFreshJobs,
      includeRemoteJobs,
      targetSpecificBoards: true,
      extractFullContent,
      enableLLMContext: true,
      maxResultsPerStrategy: Math.ceil(maxResults / searchStrategies.length),
    };

    console.log('Executing advanced job search with config:', {
      strategies: searchConfig.searchStrategies,
      filters: { ...filters, skills: filters.skills.slice(0, 5) },
      userExperience: parsedPortfolio.experience.level,
      marketProfile: parsedPortfolio.marketProfile.competitiveLevel
    });

    // Execute advanced multi-strategy job search
    const jobResults = await advancedJobSearch(filters, parsedPortfolio, searchConfig);

    // Convert to enhanced job format for frontend compatibility
    const enhancedJobs = jobResults.map(result => ({
      id: result.id,
      title: result.title,
      url: result.url,
      company: result.extractedJobData.company,
      location: result.extractedJobData.location,
      description: result.text?.substring(0, 500) + (result.text && result.text.length > 500 ? '...' : '') || 'No description available',
      publishedDate: result.publishedDate,
      score: result.relevanceScore,
      relevanceScore: result.relevanceScore,
      salaryRange: result.extractedJobData.salary,
      jobType: result.extractedJobData.jobType,
      experienceLevel: result.extractedJobData.experienceLevel,
      skills: result.extractedJobData.skills,
      benefits: result.extractedJobData.benefits,
      companySize: result.extractedJobData.companySize,
      companyCulture: undefined, // Could be extracted from subpages
      applicationDeadline: result.extractedJobData.applicationDeadline,
      remote: result.extractedJobData.remote,
      hybrid: result.extractedJobData.hybrid,
      recommendationReason: generateAdvancedRecommendationReason(result, parsedPortfolio),
      matchScore: calculateAdvancedMatchScore(result, parsedPortfolio),
      searchStrategy: result.searchStrategy,
      highlights: result.highlights,
      summary: result.summary,
      domain: result.domain,
    }));

    // Store advanced search analytics
    try {
      await supabase
        .from('ai_content')
        .insert({
          user_id: user.id,
          content_type: 'advanced_job_search',
          input_data: { 
            searchStrategies,
            skills: parsedPortfolio.skills.all.slice(0, 10),
            experienceLevel: parsedPortfolio.experience.level,
            location: filters.location,
            portfolioId: activePortfolio.content?.id,
            searchQuery: searchQuery || 'portfolio-based',
            includeFreshJobs,
            includeRemoteJobs,
          },
          output_data: { 
            resultCount: enhancedJobs.length,
            avgRelevanceScore: enhancedJobs.reduce((sum, job) => sum + job.relevanceScore, 0) / enhancedJobs.length,
            strategiesUsed: searchStrategies,
            topDomains: [...new Set(enhancedJobs.map(job => job.domain))].slice(0, 5),
            avgMatchScore: enhancedJobs.reduce((sum, job) => sum + job.matchScore, 0) / enhancedJobs.length,
          },
        });
    } catch (dbError) {
      console.error('Failed to store advanced search analytics:', dbError);
    }

    return NextResponse.json({ 
      jobs: enhancedJobs,
      searchMeta: {
        strategiesUsed: searchStrategies,
        totalResults: enhancedJobs.length,
        avgRelevanceScore: enhancedJobs.reduce((sum, job) => sum + job.relevanceScore, 0) / enhancedJobs.length,
        searchConfig,
        portfolioAnalysis: {
          skillsCount: parsedPortfolio.skills.all.length,
          experienceLevel: parsedPortfolio.experience.level,
          competitiveLevel: parsedPortfolio.marketProfile.competitiveLevel,
          rarityScore: parsedPortfolio.marketProfile.rarityScore,
          marketDemandScore: parsedPortfolio.marketProfile.marketDemandScore,
        }
      },
      userProfile: {
        skills: parsedPortfolio.skills.all.slice(0, 15),
        experienceLevel: parsedPortfolio.experience.level,
        location: parsedPortfolio.location,
        hasPortfolio: true,
        experienceYears: parsedPortfolio.experience.totalYears,
        preferredRoles: parsedPortfolio.preferences.preferredRoles,
        marketProfile: parsedPortfolio.marketProfile,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced job search error:', error);
    return NextResponse.json({ 
      error: "Failed to execute advanced job search",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateAdvancedRecommendationReason(result: ExaJobResult, portfolio: ParsedPortfolioData): string {
  const reasons = [];
  
  // Skill matching with Exa highlights
  if (result.highlights && result.highlights.length > 0) {
    reasons.push(`Highlighted match: "${result.highlights[0].substring(0, 100)}..."`);
  }
  
  // Strategic match based on search strategy
  if (result.searchStrategy === 'neural') {
    reasons.push('Semantic match with your career profile');
  } else if (result.searchStrategy === 'keyword') {
    reasons.push('Exact match for your technical skills');
  } else if (result.searchStrategy === 'hybrid') {
    reasons.push('Comprehensive match combining multiple factors');
  }
  
  // Skill alignment
  const skillMatches = result.extractedJobData.skills.filter(skill => 
    portfolio.skills.all.some(userSkill => 
      skill.toLowerCase().includes(userSkill.toLowerCase()) ||
      userSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  if (skillMatches.length > 0) {
    reasons.push(`Matches ${skillMatches.length} of your skills: ${skillMatches.slice(0, 3).join(', ')}`);
  }
  
  // Experience level alignment
  if (result.extractedJobData.experienceLevel.toLowerCase().includes(portfolio.experience.level.toLowerCase())) {
    reasons.push(`Perfect fit for ${portfolio.experience.level} level`);
  }
  
  // Summary insights from Exa
  if (result.summary && result.summary.length > 50) {
    const summaryInsight = result.summary.substring(0, 150);
    reasons.push(`AI insight: ${summaryInsight}${result.summary.length > 150 ? '...' : ''}`);
  }
  
  // Market rarity bonus
  if (portfolio.marketProfile.rarityScore > 0.7) {
    reasons.push('Great match for your rare skill combination');
  }
  
  return reasons.length > 0 ? reasons.slice(0, 3).join(' • ') : 'Discovered through advanced AI matching';
}

function calculateAdvancedMatchScore(result: ExaJobResult, portfolio: ParsedPortfolioData): number {
  let score = result.relevanceScore;
  
  // Exa-specific bonuses
  if (result.highlightScores && result.highlightScores.length > 0) {
    const avgHighlightScore = result.highlightScores.reduce((a, b) => a + b, 0) / result.highlightScores.length;
    score += avgHighlightScore * 0.2;
  }
  
  // Summary quality bonus
  if (result.summary && result.summary.length > 100) {
    score += 0.1;
  }
  
  // Fresh posting bonus
  const daysOld = (Date.now() - new Date(result.publishedDate).getTime()) / (24 * 60 * 60 * 1000);
  if (daysOld < 7) score += 0.15;
  else if (daysOld < 30) score += 0.1;
  
  // Advanced skill matching
  const skillMatches = result.extractedJobData.skills.filter(skill => 
    portfolio.skills.all.some(userSkill => 
      skill.toLowerCase().includes(userSkill.toLowerCase()) ||
      userSkill.toLowerCase().includes(skill.toLowerCase())
    )
  ).length;
  
  if (portfolio.skills.all.length > 0) {
    score += (skillMatches / portfolio.skills.all.length) * 0.3;
  }
  
  // Market profile bonus
  if (portfolio.marketProfile.marketDemandScore > 0.8 && result.extractedJobData.company.toLowerCase().includes('startup')) {
    score += 0.1; // High-demand profiles match well with startups
  }
  
  return Math.min(score, 1.0);
}

export async function GET() {
  return NextResponse.json({
    message: "Advanced Job Search API",
    description: "POST to this endpoint with search parameters for AI-powered job recommendations",
    requiredAuth: true,
    features: [
      "Multi-strategy search (neural, keyword, hybrid)",
      "Portfolio-based intelligent matching", 
      "Fresh job filtering",
      "Advanced content extraction",
      "Semantic relevance scoring",
      "Company-specific targeting",
      "LLM-ready context formatting"
    ]
  });
}
