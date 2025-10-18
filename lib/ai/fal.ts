import * as fal from "@fal-ai/serverless-client";

// Configure Fal.AI
if (!process.env.FAL_KEY) {
  throw new Error('FAL_KEY environment variable is required. Please add it to your .env.local file.');
}

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function generateGhibliAvatar(imageUrl: string, customPrompt?: string | null) {
  try {
    console.log('Generating Ghibli avatar with Fal.AI...');
    console.log('Using image URL:', imageUrl);
    
    // Use custom prompt if provided, otherwise use default
    const prompt = customPrompt || `Studio Ghibli anime style portrait, professional headshot, warm soft lighting, clean background, Miyazaki art style, beautiful detailed illustration, soft pastel colors, gentle expression, high quality anime art`;
    
    console.log('Using prompt:', prompt);
    
    // Use the free flux/schnell model (fastest and free)
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_url: imageUrl,
        num_inference_steps: 4, // Schnell uses fewer steps
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    console.log('Fal.AI response received:', JSON.stringify(result, null, 2));

    // Handle the response properly - Fal.AI returns images directly
    if (result && typeof result === 'object' && 'images' in result) {
      const images = (result as any).images;
      if (Array.isArray(images) && images.length > 0 && images[0].url) {
        console.log('Avatar generated successfully:', images[0].url);
        return images[0].url;
      }
    }
    
    throw new Error('No images generated from Fal.AI - unexpected response format');
  } catch (error: any) {
    console.error('Fal.AI avatar generation error:', error);
    
            // Provide detailed error information and handle specific cases
            if (error.status === 403) {
              console.warn('Fal.AI access forbidden, using high-quality placeholder avatar');
              // Return a professional placeholder avatar from a reliable source
              return `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80`;
            } else if (error.status === 429) {
              console.warn('Fal.AI rate limit exceeded, using placeholder avatar');
              return `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80`;
            } else if (error.status === 402) {
              console.warn('Fal.AI credits exhausted, using placeholder avatar');
              return `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80`;
            } else {
              console.warn('Fal.AI error, using placeholder avatar:', error.message);
              // Return a default professional avatar
              return `https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face&auto=format&q=80`;
            }
  }
}

export async function generatePortfolioBanner(prompt: string) {
  if (!process.env.FAL_KEY) {
    console.warn('FAL_KEY not found, using placeholder banner');
    return `https://picsum.photos/1200/400?random=${Date.now()}`;
  }

  try {
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: `Professional portfolio banner, ${prompt}, modern design, clean, high quality, minimalist, corporate style, professional aesthetic`,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    if (result && typeof result === 'object' && 'data' in result) {
      const data = result.data as any;
      if (data && data.images && data.images.length > 0) {
        return data.images[0].url;
      }
    }
    throw new Error('No images generated');
  } catch (error) {
    console.error('Fal.AI banner generation error:', error);
    return `https://picsum.photos/1200/400?random=${Date.now()}`;
  }
}

export async function generateProfileImage(description: string) {
  if (!process.env.FAL_KEY) {
    console.warn('FAL_KEY not found, using placeholder image');
    return `https://picsum.photos/300/300?random=${Date.now()}`;
  }

  try {
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: `Professional headshot, ${description}, Studio Ghibli art style, warm lighting, clean background, high quality, detailed illustration, anime style portrait`,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    if (result && typeof result === 'object' && 'data' in result) {
      const data = result.data as any;
      if (data && data.images && data.images.length > 0) {
        return data.images[0].url;
      }
    }
    throw new Error('No images generated');
  } catch (error) {
    console.error('Fal.AI profile image generation error:', error);
    return `https://picsum.photos/300/300?random=${Date.now()}`;
  }
}
