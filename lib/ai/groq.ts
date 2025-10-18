import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generatePortfolioContent(resumeData: any) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }

  // Use the actual working Groq models from their API
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "groq/compound", "groq/compound-mini"];
  
  for (const model of models) {
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a professional portfolio writer. Create compelling, engaging content for a professional portfolio based on resume data. Make it sound professional but approachable. Enhance the descriptions to be more impactful while keeping them accurate. 

IMPORTANT: Return ONLY valid JSON with no additional text, markdown, or explanations. The JSON should have the exact same structure as the input but with enhanced content.`
          },
          {
            role: "user",
            content: `Enhance this resume data for a professional portfolio: ${JSON.stringify(resumeData)}`
          }
        ],
        model: model,
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = response.choices[0].message.content;
      if (!content) continue;

      try {
        // Clean the content before parsing
        let cleanContent = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Remove any leading/trailing backticks or quotes
        cleanContent = cleanContent.replace(/^[`"']+|[`"']+$/g, '');
        
        return JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse Groq response:', parseError);
        console.error('Raw content:', content);
        continue;
      }
    } catch (error: any) {
      console.error(`Groq API error with model ${model}:`, error);
      // If it's a model deprecation error, try the next model
      if (error?.message?.includes('decommissioned') || error?.message?.includes('does not exist')) {
        continue;
      }
      // For other errors, throw
      throw error;
    }
  }
  
  throw new Error('All Groq models failed or are unavailable');
}

export async function optimizeResumeText(text: string) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }

  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "groq/compound", "groq/compound-mini"];
  
  for (const model of models) {
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a resume optimization expert. Improve this resume text to be more ATS-friendly and impactful while keeping it accurate. Make it more compelling and professional.`
          },
          {
            role: "user",
            content: text
          }
        ],
        model: model,
        temperature: 0.2,
        max_tokens: 1024,
      });

      return response.choices[0].message.content || text;
    } catch (error: any) {
      console.error(`Groq optimization error with model ${model}:`, error);
      if (error?.message?.includes('decommissioned') || error?.message?.includes('does not exist')) {
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('All Groq models failed or are unavailable');
}

export async function extractResumeData(resumeText: string) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }

  console.log('Starting Groq extraction with text length:', resumeText.length);
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "groq/compound", "groq/compound-mini"];
  
  for (const model of models) {
    try {
      console.log(`Trying Groq extraction model: ${model}`);
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a resume parser. Extract structured information from the resume text and return ONLY valid JSON with no additional text or markdown. Use this exact format:
            {
              "name": "Full Name",
              "title": "Professional Title",
              "email": "email@example.com",
              "phone": "phone number",
              "location": "City, State",
              "summary": "Professional summary",
              "skills": ["skill1", "skill2", ...],
              "experience": [
                {
                  "title": "Job Title",
                  "company": "Company Name",
                  "duration": "Start - End",
                  "location": "City, State",
                  "description": "Job description"
                }
              ],
              "education": [
                {
                  "degree": "Degree Name",
                  "school": "School Name",
                  "year": "Year",
                  "location": "City, State"
                }
              ],
              "projects": [
                {
                  "name": "Project Name",
                  "description": "Project description",
                  "technologies": ["tech1", "tech2"],
                  "url": "project url if available"
                }
              ]
            }`
          },
          {
            role: "user",
            content: resumeText
          }
        ],
        model: model,
        temperature: 0.1,
        max_tokens: 2048,
      });

      const content = response.choices[0].message.content;
      if (!content) continue;

      try {
        // Clean the content before parsing
        let cleanContent = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Remove any leading/trailing backticks or quotes
        cleanContent = cleanContent.replace(/^[`"']+|[`"']+$/g, '');
        
        return JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse Groq response:', parseError);
        console.error('Raw content:', content);
        continue;
      }
    } catch (error: any) {
      console.error(`Groq extraction error with model ${model}:`, error);
      if (error?.message?.includes('decommissioned') || error?.message?.includes('does not exist')) {
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('All Groq models failed or are unavailable');
}

