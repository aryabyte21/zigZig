import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeData, links, photo, aiAvatar } = await request.json();
    
    // Extract resume file URL if available
    const resumeFileUrl = resumeData?.resumeFileUrl || null;
    
    console.log('Portfolio generation request received:');
    console.log('resumeData:', JSON.stringify(resumeData, null, 2));
    console.log('links:', links);
    console.log('photo:', photo);
    console.log('aiAvatar:', aiAvatar);

    // Generate portfolio content using Gemini AI
    let enhancedContent = resumeData;
    
    if (resumeData) {
      try {
        console.log('Enhancing portfolio content with Gemini...');
        console.log('Input resumeData:', JSON.stringify(resumeData, null, 2));
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        
        const prompt = `
        You are a professional portfolio writer. Transform this resume data into compelling, engaging portfolio content. 
        
        CRITICAL REQUIREMENTS:
        1. Use the EXACT name from personalInfo.name - do NOT use generic names
        2. Create a specific, compelling summary based on actual experience and skills
        3. DO NOT use generic phrases like "Passionate professional with expertise in various domains"
        4. Write content that reflects the person's actual background and achievements
        5. Keep the same data structure but enhance the content quality
        
        Input resume data:
        ${JSON.stringify(resumeData, null, 2)}
        
        Return ONLY valid JSON with the same structure but enhanced content. Make the summary specific and compelling based on their actual experience.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let enhancedText = response.text();
        
        // Clean the response
        enhancedText = enhancedText.trim();
        if (enhancedText.startsWith('```json')) {
          enhancedText = enhancedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (enhancedText.startsWith('```')) {
          enhancedText = enhancedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        enhancedContent = JSON.parse(enhancedText);
        console.log('Gemini enhancement successful!');
        console.log('Enhanced content:', JSON.stringify(enhancedContent, null, 2));
        
      } catch (aiError) {
        console.error('Gemini enhancement error:', aiError);
        // Continue with original data if AI fails
        enhancedContent = resumeData;
        console.log('Using original resume data due to AI error');
      }
    }

    // Generate fallback avatar if none provided
    let finalAvatar = aiAvatar || photo;
    if (!finalAvatar) {
      // Generate a simple fallback avatar using DiceBear
      const name = enhancedContent?.personalInfo?.name || enhancedContent?.name || user.email?.split('@')[0] || 'Professional';
      finalAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
    }

    // Create portfolio structure with proper data mapping
    const portfolioContent = {
      name: enhancedContent?.personalInfo?.name || enhancedContent?.name || user.email?.split('@')[0] || 'Professional',
      title: enhancedContent?.personalInfo?.title || enhancedContent?.title || 'Professional',
      about: enhancedContent?.personalInfo?.summary || enhancedContent?.summary || enhancedContent?.about || 'Professional with diverse experience and skills.',
      contact: {
        email: enhancedContent?.personalInfo?.email || enhancedContent?.email || user.email,
        phone: enhancedContent?.personalInfo?.phone || enhancedContent?.phone || '',
        location: enhancedContent?.personalInfo?.location || enhancedContent?.location || '',
        linkedin: links?.linkedin || enhancedContent?.socialLinks?.linkedin || '',
        github: links?.github || enhancedContent?.socialLinks?.github || '',
        twitter: links?.twitter || enhancedContent?.socialLinks?.twitter || '',
        website: links?.website || enhancedContent?.socialLinks?.website || '',
        calendly: links?.calendly || enhancedContent?.socialLinks?.calendly || '',
      },
      experience: enhancedContent?.experience || [],
      projects: enhancedContent?.projects || [],
      skills: enhancedContent?.skills || [],
      education: enhancedContent?.education || [],
      avatar: finalAvatar,
      originalPhoto: photo || '',
      resumeFileUrl: resumeFileUrl,
    };
    
    console.log('Final portfolio content:');
    console.log('portfolioContent.avatar:', portfolioContent.avatar);
    console.log('portfolioContent.originalPhoto:', portfolioContent.originalPhoto);
    console.log('portfolioContent.resumeFileUrl:', portfolioContent.resumeFileUrl);
    

    // First, ensure the user profile exists (required for foreign key constraint)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: portfolioContent.name,
        bio: portfolioContent.about,
        avatar_url: portfolioContent.avatar,
        linkedin_url: portfolioContent.contact.linkedin,
        github_url: portfolioContent.contact.github,
        phone: portfolioContent.contact.phone,
        location: portfolioContent.contact.location,
        social_links: {
          linkedin: portfolioContent.contact.linkedin || '',
          github: portfolioContent.contact.github || '',
          website: portfolioContent.contact.website || '',
          calendly: portfolioContent.contact.calendly || '',
        },
        onboarding_completed: true,
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json({ 
        error: "Failed to create user profile" 
      }, { status: 500 });
    }

    // Generate unique slug with retry logic to handle race conditions
    const baseSlug = (enhancedContent?.personalInfo?.name || enhancedContent?.name || user.email?.split('@')[0] || 'portfolio')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // First, deactivate any existing active portfolios
    await supabase
      .from('portfolios')
      .update({ is_published: false })
      .eq('user_id', user.id)
      .eq('is_published', true);

    // Try to create portfolio with unique slug, retrying if duplicate
    let portfolio;
    let portfolioError;
    let counter = 0;
    const maxRetries = 10;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const slug = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
      
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          title: `${portfolioContent.name}'s Portfolio`,
          description: `Professional portfolio of ${portfolioContent.name}`,
          slug: slug,
          content: portfolioContent,
          is_published: true, // Always set new portfolio as active
        })
        .select()
        .single();

      // Check if we hit a duplicate slug error
      if (error && error.code === '23505' && error.message.includes('portfolios_slug_key')) {
        console.log(`Slug '${slug}' already exists, trying with counter ${counter + 1}`);
        counter++;
        continue;
      }

      // Either success or a different error
      portfolio = data;
      portfolioError = error;
      break;
    }

    if (portfolioError) {
      console.error('Portfolio creation error:', portfolioError);
      return NextResponse.json({ 
        error: "Failed to create portfolio" 
      }, { status: 500 });
    }

    if (!portfolio) {
      console.error('Portfolio creation failed: max retries reached');
      return NextResponse.json({ 
        error: "Failed to create portfolio with unique slug" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      portfolioId: portfolio.id,
      slug: portfolio.slug,
      portfolioUrl: `/portfolio/${portfolio.slug}`,
      dashboardUrl: `/dashboard/portfolio`,
      isActive: true,
      message: "Portfolio created and activated! It's now live and visible to the public.",
    });

  } catch (error) {
    console.error('Portfolio generation error:', error);
    return NextResponse.json({ 
      error: "Failed to generate portfolio" 
    }, { status: 500 });
  }
}
