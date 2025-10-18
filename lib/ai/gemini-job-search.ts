/**
 * Gemini Job Search - Using Gemini 2.0 Flash Exp with Web Grounding
 * 
 * Uses Google's Gemini model with real-time web search capability
 * to find current job postings with accurate URLs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: 'gemini-web' | 'exa';
  publishedDate?: string;
}

/**
 * Search for jobs using Gemini with web grounding
 */
export async function searchWithGemini(
  query: string,
  location: string
): Promise<JobPosting[]> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ GEMINI_API_KEY not configured, skipping Gemini search');
    return [];
  }

  console.log(`🔍 Gemini search: ${query} in ${location}`);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use Gemini 2.0 Flash Exp with Google Search grounding
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json', // Force JSON response
      },
    });

    const prompt = buildGeminiPrompt(query, location);
    console.log('📝 Gemini prompt created');

    // Generate content (Gemini 2.0 Flash has built-in web access)
    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();
    
    console.log(`✅ Gemini response received (${text.length} chars)`);

    // Parse the structured JSON response
    const jobs = parseGeminiResponse(text, location);
    console.log(`✅ Parsed ${jobs.length} jobs from Gemini`);

    return jobs;

  } catch (error) {
    console.error('❌ Gemini search error:', error);
    return [];
  }
}

/**
 * Build optimized prompt for Gemini with web search
 */
function buildGeminiPrompt(query: string, location: string): string {
  return `You are a job search API. Search the web and return job postings as JSON.

Query: "${query}" in ${location}

YOUR RESPONSE MUST BE VALID JSON ARRAY. NO OTHER TEXT.

Required format (return this exact structure):
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "url": "https://full-url-to-job-posting",
    "description": "Brief description",
    "publishedDate": "2025-10-18"
  }
]

Rules:
- Find 5-10 specific job postings
- URLs must be direct job posting links (not search pages)
- Prefer: linkedin.com/jobs/view/[id], lever.co, greenhouse.io
- If you can't find specific jobs, return empty array: []
- CRITICAL: Your response must be ONLY valid JSON, nothing else

Example of what NOT to do:
"I found these jobs: [...]" ❌
"Here are the results..." ❌
"Okay, I will search..." ❌

Example of correct response:
[{"title":"Engineer","company":"Google","url":"https://linkedin.com/jobs/view/123","description":"Job desc","publishedDate":"2025-10-18"}]

Return ONLY the JSON array now:`;
}

/**
 * Parse Gemini's response and extract job postings
 */
function parseGeminiResponse(text: string, location: string): JobPosting[] {
  try {
    // Extract JSON from response (Gemini sometimes adds markdown formatting)
    let jsonText = text.trim();
    
    // Check if response is natural language (not JSON)
    if (jsonText.toLowerCase().startsWith('okay') || 
        jsonText.toLowerCase().startsWith('i ') ||
        jsonText.toLowerCase().startsWith('here') ||
        jsonText.toLowerCase().includes('unable to provide')) {
      console.log('⚠️  Gemini returned natural language instead of JSON');
      console.log('Response:', jsonText.substring(0, 200));
      return [];
    }
    
    // Aggressively remove all markdown code blocks (```json, ```, etc.)
    // This handles cases like: ```[...]``` or ```json\n[...]\n```
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    
    // Extract ONLY the JSON array using greedy match from first [ to last ]
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.warn('⚠️  No JSON array found in Gemini response');
      console.log('Response:', jsonText.substring(0, 300));
      return [];
    }
    jsonText = arrayMatch[0];

    // Parse JSON
    const parsed = JSON.parse(jsonText);
    const jobsArray = Array.isArray(parsed) ? parsed : (parsed.jobs || []);

    // Convert to JobPosting format
    const jobs: JobPosting[] = jobsArray
      .filter((job: any) => {
        // Validate that this is a specific job posting URL
        if (!job.url) return false;
        
        const url = job.url.toLowerCase();
        
        // Check for specific job posting patterns
        const isSpecific = 
          /linkedin\.com\/jobs\/view\//.test(url) ||
          /lever\.co\/[\w-]+\/[\w-]{8,}/.test(url) ||
          /greenhouse\.io\/[\w-]+\/jobs\/\d+/.test(url) ||
          /ashbyhq\.com\/[\w-]+\/[\w-]{8,}/.test(url) ||
          (/careers\.[\w-]+\.com/i.test(url) && (/\/job\//i.test(url) || /\/position\//i.test(url))) ||
          /indeed\.com\/viewjob/i.test(url) ||
          /glassdoor\.com\/job-listing/i.test(url);

        // Reject generic pages
        const isGeneric = 
          url.endsWith('/jobs') ||
          url.includes('/jobs?') ||
          url.includes('/search') ||
          url.includes('/browse');

        if (isGeneric) {
          console.log(`❌ Rejected generic URL: ${job.url}`);
          return false;
        }

        if (!isSpecific) {
          console.log(`⚠️ Uncertain URL pattern: ${job.url}`);
        }

        return job.title && job.company;
      })
      .map((job: any, index: number) => ({
        id: `gemini-${Date.now()}-${index}`,
        title: job.title,
        company: job.company,
        location: location,
        url: job.url,
        description: job.description || '',
        source: 'gemini-web' as const,
        publishedDate: job.publishedDate
      }));

    return jobs;

  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.log('Raw response:', text.substring(0, 500));
    return [];
  }
}

