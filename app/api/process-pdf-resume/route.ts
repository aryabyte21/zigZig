import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Convert PDF to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Store the original PDF file in Supabase Storage
    let resumeFileUrl = '';
    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${user.id}/resume_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
        resumeFileUrl = publicUrl;
        console.log('Resume file stored at:', resumeFileUrl);
      }
    } catch (storageError) {
      console.error('Failed to store resume file:', storageError);
      // Continue processing even if file storage fails
    }

    // Process PDF directly with Gemini Vision using the correct model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
    You are an expert resume parser with advanced OCR and text extraction capabilities. Extract ALL information from this PDF resume and return ONLY valid JSON with no additional text or markdown.

    CRITICAL EXTRACTION REQUIREMENTS:
    1. FULL NAME: Extract the EXACT complete name from the very top/header of the resume. Look for:
       - The largest text at the top of the document
       - The first line that contains a person's name (not company names)
       - Names that appear before contact information
       - IGNORE usernames, handles, website names, or company names like "aryaabyte"
       - Extract ONLY the person's actual first and last name (e.g., "John Smith", "Sarah Johnson")
       - If you see something like "aryaabyte" or similar, look for the actual person's name elsewhere
    2. CONTACT INFO: Extract email, phone, location from header/contact section
    3. SOCIAL LINKS: Look for ANY URLs throughout the document, including:
       - LinkedIn profiles (linkedin.com/in/...)
       - GitHub profiles (github.com/...)
       - Personal websites/portfolios
       - Social media links (twitter, instagram, facebook, etc.)
       - Professional platforms (behance, dribbble, medium, etc.)
    4. COMPANY LOGOS: For each company, generate logo URL using multiple fallback services:
       - Primary: https://img.logo.dev/[company-domain].com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ
       - Fallback: https://logo.uplead.com/[company-domain].com
       - Clean company name: remove spaces, special chars, suffixes (Inc, Corp, LLC, Ltd, Technologies, etc.)
       - Convert to lowercase domain format (e.g., "Google LLC" → "google.com")
    5. SCHOOL LOGOS: For each school, generate logo URL using:
       - Primary: https://img.logo.dev/[school-domain].edu?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ
       - Clean school name: remove "University", "College", "Institute", spaces, special chars
       - Convert to lowercase .edu domain (e.g., "Stanford University" → "stanford.edu")
    6. PROFESSIONAL SUMMARY: Create a compelling 2-3 sentence summary based on the person's actual experience and skills. 
       - DO NOT use generic phrases like "Passionate professional with expertise in various domains"
       - Write a specific summary based on their actual work experience, projects, and skills
       - Include specific technologies, roles, or achievements mentioned in the resume
       - Make it personal and tailored to their background
    7. COMPREHENSIVE PARSING: Read every section thoroughly

    LOGO URL GENERATION RULES:
    - Company logos: https://img.logo.dev/[cleanname].com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ
    - University logos: https://img.logo.dev/[cleanname].edu?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ
    - Clean names by removing: spaces, special characters, Inc, Corp, LLC, Ltd, Company, Technologies, University, College, Institute
    - Convert to lowercase
    - Examples:
      * "Google LLC" → "https://img.logo.dev/google.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ"
      * "Microsoft Corporation" → "https://img.logo.dev/microsoft.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ"
      * "Stanford University" → "https://img.logo.dev/stanford.edu?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ"
      * "MIT" → "https://img.logo.dev/mit.edu?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ"

    LINK EXTRACTION PATTERNS TO LOOK FOR:
    - linkedin.com/in/[username]
    - github.com/[username]
    - [username].github.io
    - [domain].com, [domain].dev, [domain].io (personal websites)
    - twitter.com/[username] or x.com/[username]
    - instagram.com/[username]
    - medium.com/@[username]
    - behance.net/[username]
    - dribbble.com/[username]
    - youtube.com/[username]
    - Any other social/professional URLs

    JSON Structure (RETURN ONLY THIS):
    {
      "personalInfo": {
        "name": "EXACT FULL NAME FROM HEADER (e.g., John Smith, NOT aryaabyte)",
        "email": "email@domain.com",
        "phone": "+1234567890",
        "location": "City, State/Country",
        "summary": "Specific professional summary mentioning actual technologies, roles, and achievements from the resume"
      },
      "socialLinks": {
        "linkedin": "https://linkedin.com/in/username",
        "github": "https://github.com/username", 
        "website": "https://personalwebsite.com",
        "twitter": "https://twitter.com/username",
        "instagram": "https://instagram.com/username",
        "facebook": "https://facebook.com/username",
        "youtube": "https://youtube.com/username",
        "medium": "https://medium.com/@username",
        "behance": "https://behance.net/username",
        "dribbble": "https://dribbble.com/username",
        "portfolio": "https://portfolio-site.com",
        "blog": "https://blog-site.com"
      },
      "experience": [
        {
          "title": "Exact Job Title",
          "company": "EXACT COMPANY NAME AS WRITTEN",
          "logoUrl": "https://img.logo.dev/[company-domain].com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
          "duration": "Start Date - End Date",
          "location": "City, State",
          "description": "Detailed job description",
          "technologies": ["Tech1", "Tech2"]
        }
      ],
      "education": [
        {
          "degree": "Exact Degree Name",
          "school": "EXACT UNIVERSITY/COLLEGE NAME",
          "logoUrl": "https://img.logo.dev/[school-domain].edu?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
          "year": "Graduation Year",
          "location": "City, State",
          "gpa": "GPA if mentioned"
        }
      ],
      "skills": ["Skill1", "Skill2", "Skill3"],
      "projects": [
        {
          "name": "Project Name",
          "description": "Project description", 
          "technologies": ["Tech1", "Tech2"],
          "url": "https://project-url.com"
        }
      ],
      "certifications": [
        {
          "name": "Certification Name",
          "issuer": "Issuing Organization",
          "date": "Issue Date"
        }
      ],
      "languages": ["Language1", "Language2"],
      "achievements": ["Achievement1", "Achievement2"]
    }
    `;

    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    let extractedText = response.text();

    // Clean the response
    extractedText = extractedText.trim();
    if (extractedText.startsWith('```json')) {
      extractedText = extractedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (extractedText.startsWith('```')) {
      extractedText = extractedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let resumeData;
    try {
      resumeData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw AI response:', extractedText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Store the processed resume
    const { data: resumeRecord, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_url: resumeFileUrl,
        content: resumeData,
        is_public: false,
      })
      .select()
      .single();

    if (resumeError) {
      console.error('Resume storage error:', resumeError);
      throw new Error('Failed to store resume data');
    }

    // Add resume file URL to the response data
    const responseData = {
      ...resumeData,
      resumeFileUrl: resumeFileUrl,
      originalFileName: file.name
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('PDF processing error:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = "Failed to process PDF resume";
    let statusCode = 500;
    
    if (error.message?.includes('JSON')) {
      errorMessage = "AI response was malformed. Please try again or contact support.";
      statusCode = 422;
    } else if (error.message?.includes('API')) {
      errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
      statusCode = 503;
    } else if (error.message?.includes('size') || error.message?.includes('limit')) {
      errorMessage = "File is too large or corrupted. Please ensure your PDF is under 10MB.";
      statusCode = 413;
    } else if (error.message?.includes('Unauthorized')) {
      errorMessage = "Authentication failed. Please log in again.";
      statusCode = 401;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}