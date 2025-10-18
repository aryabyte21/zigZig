import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { 
  searchJapanJobs, 
  searchEuropeJobs, 
  searchHackerNewsJobs, 
  searchRemoteJobs,
  EnhancedJob 
} from "@/lib/ai/exa";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skills, searchType, location } = await request.json();
    
    // Validate required fields
    if (!skills || !Array.isArray(skills)) {
      return NextResponse.json({ error: "Skills array is required" }, { status: 400 });
    }

    if (!searchType) {
      return NextResponse.json({ error: "Search type is required" }, { status: 400 });
    }

    let jobs: EnhancedJob[] = [];
    let searchSource = '';

    // Route to specialized search functions based on type
    switch (searchType) {
      case 'japan':
        jobs = await searchJapanJobs(skills, location);
        searchSource = 'Japan Dev, Tokyo Dev, GitHub Jobs';
        break;
        
      case 'europe':
        jobs = await searchEuropeJobs(skills, location);
        searchSource = 'Landing.jobs, Arbeitnow, Relocate.me, European job boards';
        break;
        
      case 'hackernews':
        jobs = await searchHackerNewsJobs(skills);
        searchSource = 'Hacker News "Who\'s Hiring" threads';
        break;
        
      case 'remote':
        jobs = await searchRemoteJobs(skills);
        searchSource = 'RemoteOK, We Work Remotely, Remote.co, FlexJobs';
        break;
        
      default:
        return NextResponse.json({ error: "Invalid search type" }, { status: 400 });
    }

    // Store search history for analytics
    try {
      await supabase
        .from('ai_content')
        .insert({
          user_id: user.id,
          content_type: 'specialized_job_search',
          input_data: { skills, searchType, location },
          output_data: { 
            jobCount: jobs.length,
            searchSource,
            avgRelevanceScore: jobs.reduce((sum, job) => sum + job.relevanceScore, 0) / jobs.length
          },
        });
    } catch (dbError) {
      console.error('Failed to store search history:', dbError);
    }

    // Generate search insights
    const insights = {
      totalJobs: jobs.length,
      searchSource,
      avgRelevanceScore: jobs.reduce((sum, job) => sum + job.relevanceScore, 0) / jobs.length,
      topCompanies: [...new Set(jobs.map(job => job.company))].slice(0, 5),
      skillDemand: {},
      locationDistribution: {},
      remotePercentage: (jobs.filter(job => job.remote).length / jobs.length) * 100,
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

    return NextResponse.json({ 
      jobs,
      searchType,
      searchSource,
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Specialized job search error:', error);
    return NextResponse.json({ 
      error: "Failed to search specialized jobs" 
    }, { status: 500 });
  }
}
