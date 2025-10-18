import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { searchJobOpportunities, JobSearchFilters } from "@/lib/ai/exa";
import { PortfolioParser, ParsedPortfolioData } from "@/lib/portfolio-parser";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = await request.json();
    
    // Validate required fields
    if (!searchParams.skills || !Array.isArray(searchParams.skills)) {
      return NextResponse.json({ error: "Skills array is required" }, { status: 400 });
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Create cache key for this search
    const cacheKey = JSON.stringify({
      skills: searchParams.skills,
      location: searchParams.location,
      experienceLevel: searchParams.experienceLevel,
      jobType: searchParams.jobType,
      remote: searchParams.remote,
      industry: searchParams.industry
    });
    
    // Check cache first
    try {
      const cachedResults = await convex.query(api.jobs.getCachedResults, {
        userId: user.id,
        searchQuery: cacheKey
      });
      
      if (cachedResults) {
        console.log('Returning cached job results');
        return NextResponse.json({ 
          jobs: cachedResults,
          searchQuery: searchParams,
          insights: generateSearchInsights(cachedResults, searchParams),
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (cacheError) {
      console.log('Cache miss or error:', cacheError);
      // Continue with fresh search
    }

    // Get user profile for personalized matching
    const [profileResult, portfoliosResult] = await Promise.all([
      supabase.from('profiles').select('*').single(),
      supabase.from('portfolios').select('content, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1)
    ]);

    const profile = profileResult.data;
    const latestPortfolio = portfoliosResult.data?.[0];

    // Parse comprehensive portfolio data for intelligent matching
    let parsedPortfolio: ParsedPortfolioData | null = null;
    if (latestPortfolio?.content) {
      try {
        parsedPortfolio = PortfolioParser.parsePortfolio(latestPortfolio.content);
        console.log('Portfolio parsed successfully:', {
          skills: parsedPortfolio.skills.all.length,
          experience: parsedPortfolio.experience.totalYears,
          level: parsedPortfolio.experience.level
        });
      } catch (error) {
        console.error('Portfolio parsing error:', error);
      }
    }

    const userProfile = {
      ...profile,
      portfolio: latestPortfolio?.content,
      parsedPortfolio
    };

    // Build intelligent search filters using parsed portfolio data
    const enhancedSkills = parsedPortfolio 
      ? [...new Set([...searchParams.skills, ...parsedPortfolio.skills.all.slice(0, 10)])]
      : searchParams.skills;

    const filters: JobSearchFilters = {
      skills: enhancedSkills,
      location: searchParams.location || parsedPortfolio?.preferences.remotePreference === 'remote' ? undefined : parsedPortfolio?.location,
      experienceLevel: searchParams.experienceLevel || parsedPortfolio?.experience.level,
      jobType: searchParams.jobType || 'full-time',
      salaryRange: searchParams.salaryRange || parsedPortfolio?.preferences.salaryRange,
      companySize: searchParams.companySize || parsedPortfolio?.preferences.preferredCompanySize?.[0],
      remote: searchParams.remote ?? (parsedPortfolio?.preferences.remotePreference === 'remote'),
      industry: searchParams.industry || parsedPortfolio?.preferences.preferredIndustries,
    };

    // Use enhanced Exa.ai search
    const jobs = await searchJobOpportunities(filters, userProfile);

    // Cache the results in Convex
    try {
      await convex.mutation(api.jobs.cacheJobResults, {
        userId: user.id,
        searchQuery: cacheKey,
        skills: searchParams.skills,
        results: jobs
      });
      
      // Generate personalized recommendations
      await convex.mutation(api.jobs.generateJobRecommendations, {
        userId: user.id,
        jobs: jobs
      });
    } catch (cacheError) {
      console.error('Failed to cache results:', cacheError);
      // Don't fail the request if caching fails
    }

    // Store search history for analytics and recommendations
    try {
      await supabase
        .from('ai_content')
        .insert({
          user_id: user.id,
          content_type: 'job_search',
          input_data: searchParams,
          output_data: { 
            jobCount: jobs.length,
            topSkills: jobs.slice(0, 5).map(job => job.skills).flat(),
            avgSalary: jobs.filter(job => job.salaryRange).reduce((sum, job) => 
              sum + (job.salaryRange!.min + job.salaryRange!.max) / 2, 0) / jobs.filter(job => job.salaryRange).length
          },
        });
    } catch (dbError) {
      console.error('Failed to store search history:', dbError);
      // Don't fail the request if logging fails
    }

    // Generate search insights
    const insights = generateSearchInsights(jobs, filters);

    return NextResponse.json({ 
      jobs,
      searchQuery: searchParams,
      insights,
      userProfile: {
        hasPortfolio: !!userProfile.portfolio,
        experienceLevel: parsedPortfolio?.experience.level || 'entry',
        experienceYears: parsedPortfolio?.experience.totalYears || 0,
        skills: parsedPortfolio?.skills.all || [],
        technicalSkills: parsedPortfolio?.skills.technical || [],
        frameworks: parsedPortfolio?.skills.frameworks || [],
        languages: parsedPortfolio?.skills.languages || [],
        preferredRoles: parsedPortfolio?.preferences.preferredRoles || [],
        preferredIndustries: parsedPortfolio?.preferences.preferredIndustries || [],
        remotePreference: parsedPortfolio?.preferences.remotePreference || 'flexible',
        marketProfile: parsedPortfolio?.marketProfile || null,
        portfolioLastUpdated: portfoliosResult.data?.[0]?.updated_at,
        intelligentMatching: !!parsedPortfolio,
      },
      enhancedFilters: filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json({ 
      error: "Failed to search jobs" 
    }, { status: 500 });
  }
}

function generateSearchInsights(jobs: any[], filters: JobSearchFilters) {
  const insights = {
    totalJobs: jobs.length,
    avgRelevanceScore: jobs.reduce((sum, job) => sum + job.relevanceScore, 0) / jobs.length,
    topCompanies: [...new Set(jobs.map(job => job.company))].slice(0, 5),
    skillDemand: {},
    locationDistribution: {},
    salaryInsights: null as any,
    remotePercentage: 0,
  };

  // Calculate skill demand
  const allSkills = jobs.flatMap(job => job.skills);
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  insights.skillDemand = Object.entries(skillCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .reduce((acc, [skill, count]) => {
      acc[skill] = count as number;
      return acc;
    }, {} as Record<string, number>);

  // Calculate location distribution
  const locationCounts = jobs.reduce((acc, job) => {
    acc[job.location] = (acc[job.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  insights.locationDistribution = locationCounts;

  // Calculate salary insights
  const jobsWithSalary = jobs.filter(job => job.salaryRange);
  if (jobsWithSalary.length > 0) {
    const salaries = jobsWithSalary.map(job => (job.salaryRange.min + job.salaryRange.max) / 2);
    insights.salaryInsights = {
      min: Math.min(...salaries),
      max: Math.max(...salaries),
      avg: salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length,
      count: jobsWithSalary.length
    };
  }

  // Calculate remote percentage
  insights.remotePercentage = (jobs.filter(job => job.remote).length / jobs.length) * 100;

  return insights;
}
