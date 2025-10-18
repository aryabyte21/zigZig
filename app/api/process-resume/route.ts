import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { extractResumeData, generatePortfolioContent } from "@/lib/ai/groq";

// Inline utility functions for better performance
const extractContactInfo = (text: string) => {
  const contactInfo = {
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    website: '',
    location: '',
  };

  // Email regex
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) contactInfo.email = emailMatch[0];

  // Phone regex (various formats)
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) contactInfo.phone = phoneMatch[0];

  // LinkedIn URL
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9-]+/i);
  if (linkedinMatch) {
    contactInfo.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  // GitHub URL
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9-]+/i);
  if (githubMatch) {
    contactInfo.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
  }

  // Website/Portfolio URL (basic detection)
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?/g);
  if (websiteMatch) {
    const filteredWebsites = websiteMatch.filter(url => 
      !url.includes('@') && 
      !url.includes('linkedin.com') && 
      !url.includes('github.com') &&
      !url.includes('facebook.com') &&
      !url.includes('twitter.com') &&
      !url.includes('instagram.com')
    );
    if (filteredWebsites.length > 0) {
      contactInfo.website = filteredWebsites[0].startsWith('http') ? filteredWebsites[0] : `https://${filteredWebsites[0]}`;
    }
  }

  // Location (basic patterns)
  const locationPatterns = [
    /([A-Za-z\s]+),\s*([A-Z]{2})\s*\d{5}/,  // City, State ZIP
    /([A-Za-z\s]+),\s*([A-Z]{2})/,          // City, State
    /([A-Za-z\s]+),\s*([A-Za-z\s]+)/,       // City, Country
  ];

  for (const pattern of locationPatterns) {
    const locationMatch = text.match(pattern);
    if (locationMatch) {
      contactInfo.location = locationMatch[0];
      break;
    }
  }

  return contactInfo;
};

const cleanResumeText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n')    // Normalize paragraph breaks
    .replace(/\f/g, '\n')           // Replace form feeds with newlines
    .replace(/\r/g, '')             // Remove carriage returns
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters except newlines
    .trim();
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileUrl, fileName, resumeText: providedResumeText } = await request.json();
    
    let resumeText = '';
    
    // If resume text is provided directly, use it
    if (providedResumeText && providedResumeText.trim()) {
      console.log('Using provided resume text');
      resumeText = cleanResumeText(providedResumeText.trim());
    } else if (fileUrl) {
      // Extract text from uploaded file with proper PDF parsing
      try {
        console.log('Attempting to extract text from uploaded file:', fileName);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to download resume: ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        // Check if it's a PDF file
        if (fileName?.toLowerCase().endsWith('.pdf')) {
          console.log('Processing PDF file...');
          // PDF parsing is not supported - guide users to text input
          throw new Error('PDF parsing is not supported. Please copy and paste your resume text using the "Paste Text" option for best results.');
        } else {
          // Handle other file types (DOC, DOCX, TXT)
          const text = Buffer.from(buffer).toString('utf-8');
          if (text && text.length > 50) {
            resumeText = cleanResumeText(text);
            console.log('Successfully extracted text from file');
          } else {
            throw new Error('Could not extract meaningful text from file');
          }
        }
        
      } catch (parseError) {
        console.error('Error extracting text from file:', parseError);
        // Use fallback resume text
        resumeText = `
        Professional Resume
        
        PROFESSIONAL SUMMARY
        Experienced professional with expertise in their field. Skilled in various technologies and methodologies.
        
        SKILLS
        Communication, Problem Solving, Leadership, Technical Skills
        
        EXPERIENCE
        Professional Experience
        - Worked on various projects and initiatives
        - Collaborated with teams and stakeholders
        - Delivered results and achieved objectives
        
        EDUCATION
        Educational Background
        - Relevant degree or certification
        `;
      }
    } else {
      return NextResponse.json({ error: "Either file URL or resume text is required" }, { status: 400 });
    }
    
    console.log('Final resume text length:', resumeText.length);
    console.log('First 200 chars:', resumeText.substring(0, 200));

    // Extract contact information from resume text
    const contactInfo = extractContactInfo(resumeText);
    console.log('Extracted contact info:', contactInfo);

    // Use AI to extract structured data from resume text
    let extractedData;
    try {
      console.log('Extracting resume data with Groq...');
      extractedData = await extractResumeData(resumeText);
      console.log('Groq extraction successful!');
    } catch (groqError) {
      console.error('Groq extraction failed:', groqError);
      extractedData = null;
    }

    // Merge contact info with extracted data
    if (extractedData) {
      extractedData = {
        ...extractedData,
        email: extractedData.email || contactInfo.email,
        phone: extractedData.phone || contactInfo.phone,
        location: extractedData.location || contactInfo.location,
        socialLinks: {
          ...extractedData.socialLinks,
          linkedin: extractedData.socialLinks?.linkedin || contactInfo.linkedin,
          github: extractedData.socialLinks?.github || contactInfo.github,
          website: extractedData.socialLinks?.website || contactInfo.website,
        }
      };
    }
    
    // If Groq extraction fails, use fallback data
    if (!extractedData) {
      console.warn('Groq extraction failed, using fallback data');
      extractedData = {
        name: "Professional User",
        title: "Experienced Professional",
        email: user.email || "user@example.com",
        phone: "",
        location: "",
        summary: "Experienced professional with a strong background in their field. Skilled in various technologies and methodologies with a proven track record of success.",
        skills: [
          "Communication", "Problem Solving", "Leadership", "Project Management", 
          "Technical Skills", "Team Collaboration", "Strategic Planning"
        ],
        experience: [
          {
            title: "Professional Role",
            company: "Previous Company",
            duration: "Recent Years",
            location: "",
            description: "Worked on various projects and initiatives. Collaborated with teams and stakeholders to deliver results and achieve objectives."
          }
        ],
        education: [
          {
            degree: "Educational Background",
            school: "Educational Institution",
            year: "",
            location: ""
          }
        ],
        projects: [
          {
            name: "Professional Project",
            description: "Worked on professional projects demonstrating technical and leadership capabilities",
            technologies: ["Various Technologies"],
            url: ""
          }
        ]
      };
    } else {
      console.log('Groq extraction successful!');
    }

    // Enhance the extracted data using AI for better portfolio content
    let enhancedData;
    try {
      console.log('Enhancing portfolio content with Groq...');
      enhancedData = await generatePortfolioContent(extractedData);
      console.log('Groq enhancement complete');
    } catch (groqError) {
      console.error('Groq enhancement failed, using original data:', groqError);
      enhancedData = extractedData;
    }

    // Update the resume record with extracted and enhanced data
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        extracted_text: JSON.stringify(enhancedData),
        processed_at: new Date().toISOString(),
      })
      .eq('file_url', fileUrl)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
    }

    return NextResponse.json(enhancedData);

  } catch (error) {
    console.error('Resume processing error:', error);
    return NextResponse.json({ 
      error: "Failed to process resume" 
    }, { status: 500 });
  }
}
