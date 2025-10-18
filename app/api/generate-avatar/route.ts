import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateGhibliAvatar } from "@/lib/ai/fal";
import { generateGhibliAvatarPrompt, generateGhibliAvatarWithGemini } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoUrl, description, prompt, style } = await request.json();
    
    // Support both photo-based and prompt-based avatar generation
    if (!photoUrl && !prompt) {
      return NextResponse.json({ error: "Either photo URL or prompt is required" }, { status: 400 });
    }

    console.log('Generating Ghibli avatar...');
    console.log('Using image URL:', photoUrl);
    console.log('Using description:', description);

    let avatarUrl;
    let isPlaceholder = false;
    let generationMethod = 'unknown';

    // Generate enhanced prompt using Gemini if available and description provided
    let enhancedPrompt = null;
    if (description && process.env.GEMINI_API_KEY) {
      try {
        enhancedPrompt = await generateGhibliAvatarPrompt(description);
        console.log('Generated enhanced prompt with Gemini:', enhancedPrompt);
      } catch (error) {
        console.warn('Failed to generate enhanced prompt with Gemini:', error);
      }
    }

    // Try Gemini first (new approach) - but only if we have a photo
    if (photoUrl) {
      try {
        console.log('Attempting Gemini avatar generation...');
        avatarUrl = await generateGhibliAvatarWithGemini(photoUrl, description || 'professional person');
        generationMethod = 'gemini';
        console.log('Gemini generation successful:', avatarUrl);
      } catch (geminiError: any) {
        console.error('Gemini avatar generation failed:', geminiError);
        console.error('Gemini error details:', geminiError.message);
        console.error('Gemini error stack:', geminiError.stack);
        console.log('Falling back to Fal.AI...');
      
      // Fallback to Fal.AI
      try {
        console.log('Attempting Fal.AI avatar generation...');
        avatarUrl = await generateGhibliAvatar(photoUrl, enhancedPrompt);
        generationMethod = 'fal-ai';
        console.log('Fal.AI generation successful:', avatarUrl);
      } catch (falError: any) {
        console.error('Fal.AI avatar generation failed:', falError);
        
        // Check if it's a 403 Forbidden (exhausted credits) or other error
        if (falError.status === 403 || falError.message?.includes('Forbidden')) {
          console.log('Fal.AI credits exhausted, using high-quality placeholder avatar');
        } else {
          console.log('Fal.AI error, using fallback avatar generation');
        }
        
        // Generate a simple, reliable placeholder avatar
        const seed = user.id;
        avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
        isPlaceholder = true;
        generationMethod = 'placeholder';
      }
    }
    } else if (prompt) {
      // Handle prompt-based avatar generation (no photo provided)
      console.log('Generating avatar from prompt:', prompt);
      const seed = user.id + (description || 'professional');
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
      isPlaceholder = true;
      generationMethod = 'prompt-based';
    }

    // Save the generated avatar to Supabase Storage (only for non-placeholder images)
    if (!isPlaceholder && (generationMethod === 'fal-ai' || generationMethod === 'gemini')) {
      try {
        const fileName = `${user.id}/ai_avatar_${Date.now()}.jpg`;
        
        // Download the generated image and upload to Supabase Storage
        let imageBlob: Blob;
        if (avatarUrl.startsWith('data:')) {
          // Handle data URL from Gemini
          const [meta, base64Data] = avatarUrl.split(',');
          const mimeMatch = meta.match(/data:(.*?);base64/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const buffer = Buffer.from(base64Data, 'base64');
          imageBlob = new Blob([buffer], { type: mime });
        } else {
          const imageResponse = await fetch(avatarUrl);
          imageBlob = await imageResponse.blob();
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, imageBlob, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);
          
          return NextResponse.json({ 
            avatarUrl: publicUrl,
            originalPhoto: photoUrl,
            isPlaceholder: false,
            generationMethod: generationMethod,
            enhancedPrompt: enhancedPrompt
          });
        }
      } catch (storageError) {
        console.error('Storage upload error:', storageError);
        // Continue with original URL if storage fails
      }
    }
    
    return NextResponse.json({ 
      avatarUrl: avatarUrl,
      originalPhoto: photoUrl,
      isPlaceholder: isPlaceholder,
      generationMethod: generationMethod,
      enhancedPrompt: enhancedPrompt
    });

  } catch (error) {
    console.error('Avatar generation error:', error);
    return NextResponse.json({ 
      error: "Failed to generate avatar" 
    }, { status: 500 });
  }
}
