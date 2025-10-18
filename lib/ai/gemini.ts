import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function generateGhibliAvatarPrompt(description: string) {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
Create a detailed prompt for generating a Studio Ghibli-style avatar based on this description: "${description}"

The prompt should be optimized for AI image generation and include:
- Studio Ghibli art style characteristics
- Professional headshot composition
- Warm, soft lighting
- Clean background
- Miyazaki-inspired details
- Beautiful, detailed illustration style

Return only the prompt text, no additional formatting or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini prompt generation error:', error);
    throw error;
  }
}

export async function optimizeResumeTextWithGemini(text: string) {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
You are a resume optimization expert. Improve this resume text to be more ATS-friendly and impactful while keeping it accurate. Make it more compelling and professional.

Resume text:
${text}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini optimization error:', error);
    throw error;
  }
}

export async function generateGhibliAvatarWithGemini(photoUrl: string, description: string) {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    // Use the image generation model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    const prompt = `
Create a Studio Ghibli-style professional avatar based on this description: "${description}"

Style requirements:
- Studio Ghibli anime art style (Miyazaki-inspired)
- Professional headshot composition
- Warm, soft lighting
- Clean, elegant background
- Beautiful, detailed illustration
- Soft pastel colors
- Gentle, professional expression
- High quality anime art style

Transform the person into a Studio Ghibli character while maintaining their professional appearance.
`;

    // Download the input image and convert to base64 bytes as required by inlineData
    const inputImageResp = await fetch(photoUrl);
    if (!inputImageResp.ok) {
      throw new Error(`Failed to download input image: ${inputImageResp.status}`);
    }
    const inputArrayBuffer = await inputImageResp.arrayBuffer();
    const inputBase64 = Buffer.from(inputArrayBuffer).toString('base64');
    // Try to infer mime type from headers; default to image/jpeg
    const contentType = inputImageResp.headers.get('content-type') || 'image/jpeg';

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: contentType,
          data: inputBase64,
        },
      },
    ]);

    const response = await result.response;
    // Find generated image bytes in parts
    const parts = (response as any)?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType) {
        // Return as data URL for easy downstream handling
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    // Some responses may return text; bubble up an error if no image found
    throw new Error('No image data returned by Gemini image model');
  } catch (error) {
    console.error('Gemini image generation error:', error);
    throw error;
  }
}
