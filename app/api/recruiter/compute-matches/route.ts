import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { PortfolioParser, ParsedPortfolioData } from "@/lib/portfolio-parser";
import { JobRequirements, MatchDetails } from "@/types/recruiter";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface CandidateScore {
  candidateUserId: string;
  portfolioId: string;
  matchScore: number;
  matchReasons: string[];
  matchDetails: MatchDetails;
}

async function scoreCandidate(
  jobReqs: JobRequirements,
  candidateData: ParsedPortfolioData
): Promise<CandidateScore | null> {
  try {
    const scoringPrompt = `Score this candidate against the job requirements. Return ONLY valid JSON.

Job Requirements:
- Title: ${jobReqs.title}
- Required Skills: ${jobReqs.required_skills.join(', ')}
- Nice-to-Have Skills: ${jobReqs.nice_to_have_skills.join(', ')}
- Min Experience: ${jobReqs.min_experience_years} years
- Experience Level: ${jobReqs.experience_level}
- Industries: ${jobReqs.industries.join(', ')}
- Location: ${jobReqs.location}
- Remote OK: ${jobReqs.remote_ok}

Candidate Profile:
- Name: ${candidateData.name}
- Title: ${candidateData.title}
- Location: ${candidateData.location}
- Skills: ${candidateData.skills.all.join(', ')}
- Experience: ${candidateData.experience.totalYears} years (${candidateData.experience.level})
- Industries: ${candidateData.experience.industries.join(', ')}

Return JSON format:
{
  "matchScore": number (0-100),
  "matchReasons": ["reason 1", "reason 2", "reason 3"],
  "skills_match": {
    "matched_required": ["skill1", "skill2"],
    "matched_nice_to_have": ["skill1"],
    "missing_required": ["skill1"],
    "score": number (0-100)
  },
  "experience_match": {
    "years": ${candidateData.experience.totalYears},
    "level": "${candidateData.experience.level}",
    "is_match": boolean,
    "score": number (0-100)
  },
  "industry_match": {
    "matched_industries": ["industry1"],
    "score": number (0-100)
  },
  "location_match": {
    "is_match": boolean,
    "score": number (0-100)
  }
}

Scoring guidelines:
- Skills Match (40%): Coverage of required and nice-to-have skills
- Experience (30%): Years and level alignment
- Industry (15%): Relevant industry experience
- Location (10%): Location/remote match
- Give bonus points for strong matches`;

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

    for (const model of models) {
      try {
        const response = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert technical recruiter. Score candidates objectively and return only valid JSON."
            },
            {
              role: "user",
              content: scoringPrompt
            }
          ],
          model: model,
          temperature: 0.2,
          max_tokens: 1000,
        });

        const content = response.choices[0].message.content;
        if (!content) continue;

        // Clean and parse JSON
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        cleanContent = cleanContent.replace(/^[`"']+|[`"']+$/g, '');

        const scoreData = JSON.parse(cleanContent);
        
        return {
          candidateUserId: '', // Will be set by caller
          portfolioId: '', // Will be set by caller
          matchScore: scoreData.matchScore,
          matchReasons: scoreData.matchReasons || [],
          matchDetails: {
            skills_match: scoreData.skills_match,
            experience_match: scoreData.experience_match,
            industry_match: scoreData.industry_match,
            location_match: scoreData.location_match,
            overall_score: scoreData.matchScore,
          },
        };
      } catch (error) {
        console.error(`Scoring error with model ${model}:`, error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Score candidate error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Fetch job posting
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobId)
      .eq('recruiter_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobReqs: JobRequirements = job.extracted_requirements;

    // Fetch all active portfolios
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('id, user_id, content, slug')
      .eq('is_published', true);

    if (portfoliosError || !portfolios) {
      return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
    }

    console.log(`Found ${portfolios.length} active portfolios`);

    // Delete existing matches for this job (for re-matching)
    await fetchMutation(api.recruiter.deleteJobMatches, { jobId });

    // Process portfolios in batches
    const BATCH_SIZE = 10;
    const allMatches: Array<any> = [];

    for (let i = 0; i < portfolios.length; i += BATCH_SIZE) {
      const batch = portfolios.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(portfolios.length / BATCH_SIZE)}`);

      const batchPromises = batch.map(async (portfolio) => {
        try {
          // Check if portfolio is cached in Convex
          let cachedPortfolio = await fetchQuery(api.recruiter.getCachedPortfolio, {
            userId: portfolio.user_id,
          });

          let parsedData: ParsedPortfolioData;

          if (cachedPortfolio && cachedPortfolio.isActive) {
            parsedData = cachedPortfolio.parsedData;
          } else {
            // Parse portfolio data
            parsedData = PortfolioParser.parsePortfolio(portfolio.content);
            
            // Cache in Convex
            await fetchMutation(api.recruiter.cachePortfolio, {
              userId: portfolio.user_id,
              portfolioId: portfolio.id,
              parsedData: parsedData,
              isActive: true,
            });
          }

          // Score candidate
          const score = await scoreCandidate(jobReqs, parsedData);
          
          if (score && score.matchScore >= 20) { // Only include matches above 20%
            // Extract companies from experience
            const companies = parsedData.experience.roles
              .map(role => role.company)
              .filter(Boolean)
              .slice(0, 5);

            // Get highest education degree
            const highestDegree = parsedData.education.degrees[0]?.degree || null;

            return {
              jobId: jobId,
              candidateUserId: portfolio.user_id,
              portfolioId: portfolio.id,
              matchScore: score.matchScore,
              matchReasons: score.matchReasons,
              matchDetails: {
                ...score.matchDetails,
                // Include candidate profile data for UI display
                candidate_name: parsedData.name,
                candidate_title: parsedData.title,
                candidate_location: parsedData.location,
                candidate_avatar: portfolio.content?.avatar || portfolio.content?.avatar_url,
                candidate_skills: parsedData.skills.all.slice(0, 12),
                candidate_experience_years: parsedData.experience.totalYears,
                candidate_portfolio_slug: portfolio.slug,
                candidate_github: parsedData.contact.github || null,
                candidate_linkedin: parsedData.contact.linkedin || null,
                candidate_companies: companies,
                candidate_education: highestDegree,
              },
            };
          }

          return null;
        } catch (error) {
          console.error(`Error processing portfolio ${portfolio.id}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validMatches = batchResults.filter(m => m !== null);
      allMatches.push(...validMatches);

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < portfolios.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Generated ${allMatches.length} matches`);

    // Store matches in Convex
    if (allMatches.length > 0) {
      await fetchMutation(api.recruiter.createMatches, {
        matches: allMatches,
      });
    }

    // Update job posting stats
    await supabase
      .from('job_postings')
      .update({
        total_matches: allMatches.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      total_matches: allMatches.length,
      job_id: jobId,
    });

  } catch (error) {
    console.error('Compute matches error:', error);
    return NextResponse.json({ 
      error: "Failed to compute matches" 
    }, { status: 500 });
  }
}

