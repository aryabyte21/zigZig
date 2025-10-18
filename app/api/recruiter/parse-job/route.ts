import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { JobRequirements } from "@/types/recruiter";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, title, company } = await request.json();
    
    if (!description?.trim()) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Extract requirements using Groq
    const extractionPrompt = `Extract structured job requirements from this job description. Return ONLY valid JSON with no additional text or markdown.

Job Description:
${description}

Required JSON format:
{
  "title": "extracted job title",
  "required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "min_experience_years": number,
  "experience_level": "entry" | "mid" | "senior" | "lead" | "executive",
  "industries": ["industry1", "industry2"],
  "location": "location or remote",
  "remote_ok": true | false,
  "company_size": "startup | mid-size | enterprise",
  "salary_range": { "min": number, "max": number } (optional if mentioned)
}`;

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    let extractedRequirements: JobRequirements | null = null;

    for (const model of models) {
      try {
        const response = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a job requirement extraction expert. Extract structured information from job descriptions and return only valid JSON."
            },
            {
              role: "user",
              content: extractionPrompt
            }
          ],
          model: model,
          temperature: 0.1,
          max_tokens: 1500,
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

        extractedRequirements = JSON.parse(cleanContent);
        break;
      } catch (error) {
        console.error(`Groq extraction error with model ${model}:`, error);
        continue;
      }
    }

    if (!extractedRequirements) {
      return NextResponse.json({ 
        error: "Failed to extract job requirements" 
      }, { status: 500 });
    }

    // Use provided title/company or extracted ones
    const finalTitle = title?.trim() || extractedRequirements.title;
    const finalCompany = company?.trim() || null;

    // Store in Supabase
    const { data: jobPosting, error: insertError } = await supabase
      .from('job_postings')
      .insert({
        recruiter_id: user.id,
        title: finalTitle,
        company: finalCompany,
        description: description.trim(),
        extracted_requirements: extractedRequirements,
        status: 'active',
        total_matches: 0,
        viewed_count: 0,
        liked_count: 0,
        passed_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Job posting insert error:', insertError);
      return NextResponse.json({ 
        error: "Failed to create job posting" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      job: jobPosting,
      extracted_requirements: extractedRequirements,
    });

  } catch (error) {
    console.error('Parse job error:', error);
    return NextResponse.json({ 
      error: "Failed to parse job description" 
    }, { status: 500 });
  }
}


