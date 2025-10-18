import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { searchJobOpportunities, JobSearchFilters } from "@/lib/ai/exa";
import { PortfolioParser } from "@/lib/portfolio-parser";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and latest portfolio
    const [profileResult, portfoliosResult] = await Promise.all([
      supabase.from('profiles').select('*').single(),
      supabase.from('portfolios').select('content').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1)
    ]);

    const profile = profileResult.data;
    const portfolio = portfoliosResult.data?.[0]?.content;

    if (!profile || !portfolio) {
      return NextResponse.json({ 
        error: "User profile or portfolio not found. Please complete your profile first." 
      }, { status: 404 });
    }

    // Extract skills and experience from portfolio
    const skills = portfolio.skills || [];
    const experience = portfolio.experience || [];
    const projects = portfolio.projects || [];
    
    // Calculate experience level based on portfolio data
    const experienceYears = Math.min(experience.length * 1.5, 10);
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' = 'entry';
    if (experienceYears >= 8) experienceLevel = 'lead';
    else if (experienceYears >= 5) experienceLevel = 'senior';
    else if (experienceYears >= 2) experienceLevel = 'mid';

    // Build intelligent search filters based on user profile
    const filters: JobSearchFilters = {
      skills: skills.slice(0, 10), // Top 10 skills
      location: profile.location || undefined,
      experienceLevel,
      jobType: 'full-time',
      remote: true, // Default to include remote options
      industry: extractIndustriesFromProfile(portfolio),
    };

    // Get user's search history to understand preferences
    const { data: searchHistory } = await supabase
      .from('ai_content')
      .select('input_data, output_data')
      .eq('user_id', user.id)
      .eq('content_type', 'job_search')
      .order('created_at', { ascending: false })
      .limit(5);

    // Enhance filters based on search history
    if (searchHistory && searchHistory.length > 0) {
      const recentSearches = searchHistory.map(search => search.input_data);
      const preferredLocations = recentSearches
        .filter(search => search.location)
        .map(search => search.location);
      
      if (preferredLocations.length > 0) {
        filters.location = preferredLocations[0]; // Use most recent location preference
      }

      // Check if user prefers remote work
      const remoteSearches = recentSearches.filter(search => search.remote);
      if (remoteSearches.length > recentSearches.length * 0.5) {
        filters.remote = true;
      }
    }

    // Parse portfolio with enhanced context for better job matching
    let parsedPortfolio = null;
    if (portfolio) {
      try {
        parsedPortfolio = PortfolioParser.parsePortfolio(portfolio);
        console.log('Enhanced portfolio parsing for job recommendations:', {
          skills: parsedPortfolio.skills.all.slice(0, 10),
          experienceLevel: parsedPortfolio.experience.level,
          preferredRoles: parsedPortfolio.preferences.preferredRoles,
          location: parsedPortfolio.location
        });
      } catch (error) {
        console.error('Portfolio parsing error:', error);
      }
    }

    // Choose between advanced and standard search based on query parameter
    const useAdvanced = request.nextUrl.searchParams.get('advanced') === 'true';
    
    let jobs;
    if (useAdvanced && parsedPortfolio) {
      // Use advanced multi-strategy search
      const { advancedJobSearch } = await import("@/lib/ai/advanced-exa-job-search");
      const advancedResults = await advancedJobSearch(filters, parsedPortfolio, {
        searchStrategies: ['neural', 'hybrid'],
        includeFreshJobs: true,
        includeRemoteJobs: true,
        targetSpecificBoards: true,
        extractFullContent: true,
        enableLLMContext: false, // Keep false for compatibility
        maxResultsPerStrategy: 15,
      });
      
      // Convert advanced results to standard format
      jobs = advancedResults.map(result => ({
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
        applicationDeadline: result.extractedJobData.applicationDeadline,
        remote: result.extractedJobData.remote,
        hybrid: result.extractedJobData.hybrid,
      }));
    } else {
      // Use standard search for backward compatibility
      jobs = await searchJobOpportunities(filters, { profile, portfolio, parsedPortfolio });
    }

    // Filter and rank recommendations
    const recommendations = jobs
      .filter(job => job.relevanceScore > 0.3) // Only show relevant jobs
      .slice(0, 10) // Top 10 recommendations
      .map(job => ({
        ...job,
        recommendationReason: generateRecommendationReason(job, portfolio),
        matchScore: calculateMatchScore(job, portfolio),
      }));

    // Store recommendation generation for analytics
    try {
      await supabase
        .from('ai_content')
        .insert({
          user_id: user.id,
          content_type: 'job_recommendations',
          input_data: { 
            skills: skills.slice(0, 10),
            experienceLevel,
            location: profile.location,
            portfolioId: portfoliosResult.data?.[0]?.content?.id
          },
          output_data: { 
            recommendationCount: recommendations.length,
            avgMatchScore: recommendations.reduce((sum, job) => sum + job.matchScore, 0) / recommendations.length
          },
        });
    } catch (dbError) {
      console.error('Failed to store recommendation analytics:', dbError);
    }

    return NextResponse.json({ 
      recommendations,
      userProfile: {
        skills: skills.slice(0, 10),
        experienceLevel,
        location: profile.location,
        hasPortfolio: true,
        experienceYears: Math.round(experienceYears),
      },
      filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Job recommendations error:', error);
    return NextResponse.json({ 
      error: "Failed to generate job recommendations" 
    }, { status: 500 });
  }
}

function extractIndustriesFromProfile(portfolio: any): string[] {
  const industries: string[] = [];
  
  // Extract from experience
  if (portfolio.experience) {
    portfolio.experience.forEach((exp: any) => {
      const company = exp.company?.toLowerCase() || '';
      if (company.includes('tech') || company.includes('software')) industries.push('Technology');
      if (company.includes('bank') || company.includes('finance')) industries.push('Finance');
      if (company.includes('health') || company.includes('medical')) industries.push('Healthcare');
      if (company.includes('education') || company.includes('university')) industries.push('Education');
    });
  }

  // Extract from projects
  if (portfolio.projects) {
    portfolio.projects.forEach((project: any) => {
      const description = project.description?.toLowerCase() || '';
      if (description.includes('ai') || description.includes('ml') || description.includes('machine learning')) {
        industries.push('AI/ML');
      }
      if (description.includes('blockchain') || description.includes('crypto')) {
        industries.push('Blockchain');
      }
      if (description.includes('security') || description.includes('cyber')) {
        industries.push('Cybersecurity');
      }
    });
  }

  return [...new Set(industries)]; // Remove duplicates
}

function generateRecommendationReason(job: any, portfolio: any): string {
  const reasons = [];
  
  // Skill matches
  const skillMatches = job.skills.filter((skill: string) => 
    portfolio.skills?.some((userSkill: string) => 
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );
  
  if (skillMatches.length > 0) {
    reasons.push(`Matches your skills: ${skillMatches.slice(0, 3).join(', ')}`);
  }

  // Experience level match
  if (job.experienceLevel && portfolio.experience) {
    const userExperienceYears = Math.min(portfolio.experience.length * 1.5, 10);
    if (userExperienceYears >= 5 && job.experienceLevel.toLowerCase().includes('senior')) {
      reasons.push('Matches your senior-level experience');
    } else if (userExperienceYears >= 2 && job.experienceLevel.toLowerCase().includes('mid')) {
      reasons.push('Matches your mid-level experience');
    }
  }

  // Remote work preference
  if (job.remote) {
    reasons.push('Offers remote work flexibility');
  }

  // Company size preference (if we can infer from portfolio)
  if (job.companySize && portfolio.experience) {
    const hasStartupExperience = portfolio.experience.some((exp: any) => 
      exp.company?.toLowerCase().includes('startup') || 
      exp.company?.toLowerCase().includes('early-stage')
    );
    
    if (hasStartupExperience && job.companySize.toLowerCase().includes('startup')) {
      reasons.push('Matches your startup experience');
    }
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Good match based on your profile';
}

function calculateMatchScore(job: any, portfolio: any): number {
  let score = job.relevanceScore;
  
  // Boost for skill matches
  const skillMatches = job.skills.filter((skill: string) => 
    portfolio.skills?.some((userSkill: string) => 
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  ).length;
  
  if (portfolio.skills && portfolio.skills.length > 0) {
    score += (skillMatches / portfolio.skills.length) * 0.3;
  }

  // Boost for experience level match
  const userExperienceYears = Math.min((portfolio.experience?.length || 0) * 1.5, 10);
  if (userExperienceYears >= 5 && job.experienceLevel.toLowerCase().includes('senior')) {
    score += 0.2;
  } else if (userExperienceYears >= 2 && job.experienceLevel.toLowerCase().includes('mid')) {
    score += 0.2;
  }

  // Boost for remote work
  if (job.remote) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}
