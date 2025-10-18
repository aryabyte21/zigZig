import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { searchJobOpportunities, JobSearchFilters } from "@/lib/ai/exa";
import { PortfolioParser, ParsedPortfolioData } from "@/lib/portfolio-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  userProfile?: {
    skills: string[];
    experienceLevel: string;
    location?: string;
    remotePreference?: string;
  };
  conversationHistory: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, userProfile, conversationHistory }: ChatRequest = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user profile and active portfolio data for intelligent matching
    const [profileResult, portfoliosResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('portfolios').select('content, updated_at, is_published').eq('user_id', user.id).eq('is_published', true).order('updated_at', { ascending: false }).limit(1)
    ]);

    const profile = profileResult.data;
    const activePortfolio = portfoliosResult.data?.[0];

    // Parse active portfolio data for enhanced matching
    let parsedPortfolio: ParsedPortfolioData | null = null;
    if (activePortfolio?.content) {
      try {
        console.log('Using active portfolio for job matching:', activePortfolio.updated_at);
        parsedPortfolio = PortfolioParser.parsePortfolio(activePortfolio.content);
        console.log('Parsed portfolio skills:', parsedPortfolio.skills.all.slice(0, 10));
        console.log('Parsed portfolio location:', parsedPortfolio.location);
        console.log('Parsed portfolio experience level:', parsedPortfolio.experience.level);
      } catch (error) {
        console.error('Portfolio parsing error:', error);
      }
    } else {
      console.log('No active portfolio found for user');
    }

    // Use AI to extract job search intent from the message
    const searchIntent = await extractJobSearchIntent(message, parsedPortfolio, conversationHistory);
    
    // Build enhanced search filters with better portfolio integration
    const portfolioSkills = parsedPortfolio?.skills.all || [];
    const combinedSkills = searchIntent.skills?.length > 0 ? 
      [...new Set([...searchIntent.skills, ...portfolioSkills.slice(0, 5)])] : 
      portfolioSkills.slice(0, 8) || userProfile?.skills || ['JavaScript', 'React'];

    const filters: JobSearchFilters = {
      skills: combinedSkills,
      location: searchIntent.location || parsedPortfolio?.location || userProfile?.location,
      experienceLevel: (searchIntent.experienceLevel as any) || parsedPortfolio?.experience.level || (userProfile?.experienceLevel as any) || 'mid',
      jobType: (searchIntent.jobType as any) || 'full-time',
      remote: searchIntent.remote ?? ((parsedPortfolio?.preferences.remotePreference === 'remote') || (userProfile?.remotePreference === 'remote')),
      industry: (searchIntent.industry?.length || 0) > 0 ? searchIntent.industry : parsedPortfolio?.preferences.preferredIndustries,
      companySize: (searchIntent.companySize as any) || parsedPortfolio?.preferences.preferredCompanySize?.[0],
      salaryRange: parsedPortfolio?.preferences.salaryRange,
    };

    // Search for jobs using Exa AI
    const jobs = await searchJobOpportunities(filters, {
      ...profile,
      portfolio: activePortfolio?.content,
      parsedPortfolio
    });

    // Generate AI response with job recommendations
    const aiResponse = await generateJobSearchResponse(
      message, 
      jobs, 
      searchIntent, 
      parsedPortfolio,
      conversationHistory
    );

    // Store conversation in database for learning
    try {
      await supabase
        .from('ai_content')
        .insert({
          user_id: user.id,
          content_type: 'job_search_chat',
          input_data: { message, searchIntent, filters },
          output_data: { 
            response: aiResponse,
            jobCount: jobs.length,
            topSkills: jobs.slice(0, 5).map(job => job.skills).flat(),
          },
        });
    } catch (dbError) {
      console.error('Failed to store chat history:', dbError);
    }

    return NextResponse.json({
      response: aiResponse,
      jobs: jobs.slice(0, 10), // Limit to top 10 jobs
      searchIntent,
      filters,
      userProfile: {
        hasPortfolio: !!parsedPortfolio,
        experienceLevel: parsedPortfolio?.experience.level || 'entry',
        skills: parsedPortfolio?.skills.all || [],
        location: parsedPortfolio?.location,
        remotePreference: parsedPortfolio?.preferences.remotePreference || 'flexible',
      }
    });

  } catch (error) {
    console.error('Job search chat error:', error);
    return NextResponse.json({ 
      error: "Failed to process job search request" 
    }, { status: 500 });
  }
}

async function extractJobSearchIntent(
  message: string, 
  parsedPortfolio: ParsedPortfolioData | null,
  conversationHistory: ChatMessage[]
): Promise<{
  skills: string[];
  location?: string;
  experienceLevel?: string;
  jobType?: string;
  remote?: boolean;
  industry?: string[];
  companySize?: string;
  intent: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const context = `
    User message: "${message}"
    
    User profile context:
    - Skills: ${parsedPortfolio?.skills.all?.join(', ') || 'Not specified'}
    - Experience level: ${parsedPortfolio?.experience.level || 'Not specified'}
    - Location: ${parsedPortfolio?.location || 'Not specified'}
    - Remote preference: ${parsedPortfolio?.preferences.remotePreference || 'flexible'}
    - Preferred industries: ${parsedPortfolio?.preferences.preferredIndustries?.join(', ') || 'Not specified'}
    
    Recent conversation context:
    ${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    
    Analyze this message and extract job search intent. Return ONLY a JSON object with this structure:
    {
      "skills": ["array", "of", "technical", "skills"],
      "location": "city, state or 'remote'",
      "experienceLevel": "entry|mid|senior|lead",
      "jobType": "full-time|part-time|contract|internship",
      "remote": true/false,
      "industry": ["array", "of", "industries"],
      "companySize": "startup|mid-size|enterprise",
      "intent": "brief description of what they're looking for"
    }
    
    Rules:
    - If skills are mentioned, extract them as an array
    - If location is mentioned, use it; otherwise use profile location or null
    - Infer experience level from context (junior, senior, etc.)
    - Default to full-time if not specified
    - Set remote to true if they mention remote work
    - Extract industries if mentioned
    - Be conservative with assumptions - only extract what's clearly stated
    `;

    const result = await model.generateContent(context);
    const response = await result.response;
    let extractedText = response.text().trim();
    
    // Clean the response
    if (extractedText.startsWith('```json')) {
      extractedText = extractedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (extractedText.startsWith('```')) {
      extractedText = extractedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const intent = JSON.parse(extractedText);
    
    // Validate and provide defaults
    return {
      skills: intent.skills || [],
      location: intent.location,
      experienceLevel: intent.experienceLevel || 'mid',
      jobType: intent.jobType || 'full-time',
      remote: intent.remote,
      industry: intent.industry || [],
      companySize: intent.companySize,
      intent: intent.intent || 'Job search request'
    };
    
  } catch (error) {
    console.error('Intent extraction error:', error);
    
    // Fallback to basic keyword extraction
    const messageLower = message.toLowerCase();
    const skills = extractSkillsFromMessage(message);
    const location = extractLocationFromMessage(message);
    const remote = messageLower.includes('remote') || messageLower.includes('work from home');
    
    return {
      skills,
      location,
      experienceLevel: 'mid',
      jobType: 'full-time',
      remote,
      industry: [],
      companySize: undefined,
      intent: 'Job search request'
    };
  }
}

async function generateJobSearchResponse(
  message: string,
  jobs: any[],
  searchIntent: any,
  parsedPortfolio: ParsedPortfolioData | null,
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const context = `
    User asked: "${message}"
    
    Search intent: ${JSON.stringify(searchIntent, null, 2)}
    
    Found ${jobs.length} jobs with these top results:
    ${jobs.slice(0, 5).map((job, i) => `
    ${i + 1}. ${job.title} at ${job.company} (${job.location})
       - Skills: ${job.skills.slice(0, 5).join(', ')}
       - Type: ${job.jobType}, Level: ${job.experienceLevel}
       - Remote: ${job.remote ? 'Yes' : 'No'}
       - Match: ${Math.round(job.relevanceScore * 100)}%
    `).join('\n')}
    
    User profile context:
    - Experience: ${parsedPortfolio?.experience.totalYears || 0} years
    - Skills: ${parsedPortfolio?.skills.all?.slice(0, 10).join(', ') || 'Not specified'}
    - Location: ${parsedPortfolio?.location || 'Not specified'}
    
    Generate a helpful, conversational response that:
    1. Acknowledges what they're looking for
    2. Highlights the best matching jobs
    3. Mentions key skills and requirements
    4. Provides encouragement and next steps
    5. Keeps it concise but informative (2-3 sentences max)
    
    Be friendly, professional, and helpful. Don't repeat the job details since they'll be shown in cards.
    `;

    const result = await model.generateContent(context);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error('Response generation error:', error);
    
    // Fallback response
    if (jobs.length === 0) {
      return "I couldn't find any jobs matching your criteria. Try adjusting your search terms or skills.";
    }
    
    return `I found ${jobs.length} relevant jobs for you! The top matches are ${jobs.slice(0, 3).map(job => `${job.title} at ${job.company}`).join(', ')}. Check out the job cards below for more details.`;
  }
}

function extractSkillsFromMessage(message: string): string[] {
  const commonSkills = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'C++',
    'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis',
    'Machine Learning', 'Data Science', 'DevOps', 'Frontend', 'Backend',
    'Vue', 'Angular', 'Svelte', 'Next.js', 'Express', 'Django', 'Flask',
    'GraphQL', 'REST', 'API', 'Microservices', 'CI/CD', 'Git'
  ];
  
  const messageLower = message.toLowerCase();
  return commonSkills.filter(skill => 
    messageLower.includes(skill.toLowerCase())
  );
}

function extractLocationFromMessage(message: string): string | undefined {
  const locationPatterns = [
    // Specific cities and countries first (more specific matches)
    /(?:in|at|near|from)\s+(Singapore|Hong Kong|Tokyo|London|Berlin|Paris|Sydney|Melbourne|Toronto|Vancouver|Dublin|Amsterdam|Stockholm|Copenhagen|Zurich|Geneva|Tel Aviv|Mumbai|Bangalore|Delhi|Pune)/i,
    // US cities
    /(?:in|at|near|from)\s+(San Francisco|SF|Bay Area|New York|NYC|Los Angeles|LA|Seattle|Boston|Austin|Chicago|Denver|Miami|Dallas|Houston|Phoenix|Portland|Atlanta|Washington DC|DC)/i,
    // General pattern for other locations
    /(?:in|at|near|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    // Remote work
    /(remote|work from home|distributed|anywhere)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return undefined;
}
