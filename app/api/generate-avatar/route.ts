import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateGhibliAvatarWithOpenAI } from "@/lib/ai/openai";
import { generateGhibliAvatarWithGemini } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoUrl, description, prompt, style } = await request.json();
    
    if (!photoUrl && !prompt) {
      return NextResponse.json({ error: "Either photo URL or prompt is required" }, { status: 400 });
    }

    let avatarUrl;
    let isPlaceholder = false;
    let generationMethod = 'unknown';

    // Studio Ghibli transformation prompt
    const ghibliPrompt = `# Steps

1. **Analyze the Image**: Examine the original image to understand its composition, color palette, and key elements.
2. **Study Studio Ghibli Style**: Familiarize yourself with the distinctive features of Studio Ghibli's art style, including:
   - Soft, vibrant color palettes
   - Detailed backgrounds with a focus on nature
   - Expressive character designs with large, emotive eyes
   - Use of light and shadow to create depth
3. **Sketch the Transformation**: Create a preliminary sketch that incorporates the Ghibli style elements into the original image.
4. **Apply Color and Texture**: Use soft, vibrant colors typical of Studio Ghibli films. Pay attention to textures that mimic traditional animation techniques.
5. **Refine Details**: Add intricate details to the background and characters, ensuring they align with the Ghibli aesthetic.
6. **Final Adjustments**: Make any necessary adjustments to lighting, contrast, and saturation to achieve a cohesive look.

# Output Format

Provide a digital image file that reflects the transformation of the original image into the Studio Ghibli style. The file should be in a common format such as JPEG or PNG.

# Notes

- Pay special attention to the emotional tone of the image, ensuring it aligns with the whimsical and heartfelt nature of Studio Ghibli films.
- Consider the use of traditional animation techniques, such as hand-drawn lines and watercolor effects, to enhance authenticity.
- Ensure that the transformed image maintains the essence of the original while fully embracing the Ghibli style.`;

    // Try OpenAI first
    if (photoUrl) {
      try {
        console.log('[Avatar] Trying OpenAI gpt-image-1...');
        avatarUrl = await generateGhibliAvatarWithOpenAI(photoUrl, description || 'professional person', ghibliPrompt);
        generationMethod = 'openai';
        console.log('[Avatar] OpenAI success');
      } catch (openaiError: any) {
        console.error('[Avatar] OpenAI failed:', openaiError.message);
        
        // Try Gemini next (if available)
        try {
          if (process.env.GEMINI_API_KEY) {
            console.log('[Avatar] Trying Gemini fallback...');
            avatarUrl = await generateGhibliAvatarWithGemini(photoUrl, description || 'professional person');
            generationMethod = 'gemini';
            console.log('[Avatar] Gemini success');
          }
        } catch (geminiError: any) {
          console.error('[Avatar] Gemini failed:', geminiError.message);
        }

        // If no avatar yet after Gemini, fallback to placeholder
        if (!avatarUrl) {
          console.log('[Avatar] Using placeholder fallback');
          const seed = user.id;
          avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
          isPlaceholder = true;
          generationMethod = 'placeholder';
        }
    }
    } else if (prompt) {
      // Handle prompt-based avatar generation (no photo provided)
      const seed = user.id + (description || 'professional');
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
      isPlaceholder = true;
      generationMethod = 'prompt-based';
    }

    // Save the generated avatar to Supabase Storage (only for non-placeholder images)
    if (!isPlaceholder && avatarUrl && (generationMethod === 'openai' || generationMethod === 'gemini')) {
      try {
        console.log('[Avatar] Saving to Supabase storage...', { method: generationMethod, isDataUrl: avatarUrl.startsWith('data:') });
        const fileName = `${user.id}/ai_avatar_${Date.now()}.jpg`;
        
        // Download the generated image and upload to Supabase Storage
        let imageBlob: Blob;
        if (avatarUrl && avatarUrl.startsWith('data:')) {
          // Handle data URL (if any service returns one)
          const [meta, base64Data] = avatarUrl.split(',');
          const mimeMatch = meta.match(/data:(.*?);base64/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const buffer = Buffer.from(base64Data, 'base64');
          imageBlob = new Blob([buffer], { type: mime });
          console.log('[Avatar] Converted data URL to blob:', { mime, bytes: buffer.length });
        } else if (avatarUrl) {
          // Handle regular URL (from OpenAI DALL-E)
          console.log('[Avatar] Downloading from URL:', avatarUrl.substring(0, 100));
          const imageResponse = await fetch(avatarUrl);
          imageBlob = await imageResponse.blob();
          console.log('[Avatar] Downloaded blob:', { type: imageBlob.type, bytes: imageBlob.size });
        } else {
          throw new Error('No avatarUrl available for storage upload');
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
          
          console.log('[Avatar] Storage upload success:', publicUrl);
          
          return NextResponse.json({ 
            avatarUrl: publicUrl,
            originalPhoto: photoUrl,
            isPlaceholder: false,
            generationMethod: generationMethod
          });
        } else {
          console.error('[Avatar] Storage upload error:', uploadError);
        }
      } catch (storageError) {
        console.error('[Avatar] Storage error:', storageError);
        // Continue with original URL if storage fails
      }
    }
    
    return NextResponse.json({ 
      avatarUrl: avatarUrl,
      originalPhoto: photoUrl,
      isPlaceholder: isPlaceholder,
      generationMethod: generationMethod
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to generate avatar" 
    }, { status: 500 });
  }
}
