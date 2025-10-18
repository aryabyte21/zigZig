import OpenAI from 'openai';

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  const clientOptions: any = {
    apiKey: process.env.OPENAI_API_KEY,
  };
  if (process.env.OPENAI_ORG_ID) clientOptions.organization = process.env.OPENAI_ORG_ID;
  if (process.env.OPENAI_PROJECT_ID) clientOptions.project = process.env.OPENAI_PROJECT_ID;
  openai = new OpenAI(clientOptions);
}


export async function optimizeResumeTextWithOpenAI(text: string) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and career consultant. Your job is to optimize resume text for better ATS scanning and overall impact."
        },
        {
          role: "user",
          content: `Please optimize this resume text for better ATS scanning and professional impact:

${text}

Please:
1. Improve grammar and clarity
2. Add relevant keywords for ATS systems
3. Quantify achievements where possible
4. Use action verbs
5. Keep the same general structure and length
6. Return only the optimized text`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    throw error;
  }
}

export async function generateGhibliAvatarWithOpenAI(photoUrl: string, description: string, ghibliPrompt: string) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  try {
    console.log('[OpenAI][Avatar] Starting generation');
    console.log('[OpenAI][Avatar] Input:', { photoUrl: !!photoUrl, description, promptLength: ghibliPrompt.length });
    
    // Use provided Studio Ghibli prompt, truncate if needed
    let prompt = ghibliPrompt.trim();
    let wasTruncated = false;
    const MAX = 950;
    
    if (prompt.length > MAX) {
      prompt = prompt.slice(0, MAX);
      wasTruncated = true;
    }
    console.log('[OpenAI][Avatar] Prompt prepared:', { length: prompt.length, truncated: wasTruncated });

    // Prepare the uploaded image as input for image-to-image transformation
    console.log('[OpenAI][Avatar] Downloading source image from:', photoUrl);
    const sourceResponse = await fetch(photoUrl);
    if (!sourceResponse.ok) {
      throw new Error(`Failed to download source image: ${sourceResponse.status} ${sourceResponse.statusText}`);
    }
    const sourceBuffer = await sourceResponse.arrayBuffer();
    
    // Determine correct mime type from URL or content-type header
    const originalContentType = sourceResponse.headers.get('content-type');
    console.log('[OpenAI][Avatar] Original content-type from response:', originalContentType);
    console.log('[OpenAI][Avatar] Photo URL:', photoUrl);
    
    let contentType = originalContentType;
    let fileName = 'source.jpg';
    
    // If content-type is missing or generic, infer from URL
    if (!contentType || contentType === 'application/octet-stream' || !contentType.startsWith('image/')) {
      console.log('[OpenAI][Avatar] Content-type is generic/missing, inferring from URL...');
      const url = photoUrl.toLowerCase();
      if (url.includes('.png') || url.includes('image/png')) {
        contentType = 'image/png';
        fileName = 'source.png';
      } else if (url.includes('.webp')) {
        contentType = 'image/webp';
        fileName = 'source.webp';
      } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('image/jpg') || url.includes('image/jpeg')) {
        contentType = 'image/jpeg';
        fileName = 'source.jpg';
      } else {
        // Default to JPEG for compatibility
        console.log('[OpenAI][Avatar] Could not detect type from URL, defaulting to image/jpeg');
        contentType = 'image/jpeg';
        fileName = 'source.jpg';
      }
    } else {
      // Use content-type to determine file extension
      if (contentType.includes('png')) {
        fileName = 'source.png';
      } else if (contentType.includes('webp')) {
        fileName = 'source.webp';
      } else {
        fileName = 'source.jpg';
      }
    }
    
    console.log('[OpenAI][Avatar] Final mime type before creating file:', contentType);
    
    // Create a proper File object with explicit mime type
    // toFile() from OpenAI SDK doesn't preserve mime type properly, so we create File directly
    const sourceFile = new File([sourceBuffer], fileName, { type: contentType });
    
    console.log('[OpenAI][Avatar] File object created:', { 
      name: sourceFile.name,
      type: sourceFile.type,
      size: sourceFile.size,
      fileName,
      detectedFromUrl: !originalContentType?.startsWith('image/')
    });

    // Use images.edit() for image-to-image transformation
    console.log('[OpenAI][Avatar] Calling images.edit with gpt-image-1...');
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: sourceFile,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });

    console.log('[OpenAI][Avatar] Response received:', {
      created: response.created,
      dataLength: response.data?.length || 0,
      hasUrl: !!response.data?.[0]?.url,
      hasB64: !!(response.data?.[0] as any)?.b64_json
    });

    // Extract URL from response
    const imageUrl = response?.data?.[0]?.url;
    const b64Data = (response?.data?.[0] as any)?.b64_json;
    
    if (!imageUrl && !b64Data) {
      console.error('[OpenAI][Avatar] No image data in response:', JSON.stringify(response, null, 2));
      throw new Error('No image data returned from OpenAI gpt-image-1');
    }

    // Return URL or convert b64 to data URL
    const finalUrl = imageUrl || `data:image/png;base64,${b64Data}`;
    console.log('[OpenAI][Avatar] Success:', { 
      hasUrl: !!imageUrl, 
      hasB64: !!b64Data,
      urlPreview: finalUrl.substring(0, 100) 
    });
    return finalUrl;
  } catch (error: any) {
    console.error('[OpenAI][Avatar] Error:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      stack: error?.stack?.split('\n').slice(0, 3)
    });
    
    // Handle specific OpenAI errors with more context
    if (error.status === 429) {
      throw new Error(`OpenAI rate limit exceeded. Please check your OpenAI billing and usage limits at https://platform.openai.com/usage`);
    } else if (error.status === 401) {
      throw new Error(`OpenAI authentication failed. Please check your OPENAI_API_KEY`);
    } else if (error.status === 402) {
      throw new Error(`OpenAI billing required. Please add credits to your OpenAI account at https://platform.openai.com/billing`);
    } else if (error.status === 400) {
      throw new Error(`OpenAI request invalid: ${error.message}`);
    }
    
    throw new Error(`OpenAI avatar generation failed: ${error.message}`);
  }
}
