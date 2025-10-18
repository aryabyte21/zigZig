// In app/api/test-gemini/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY not found in environment variables" 
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different model names
    const modelsToTry = [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash", 
      "gemini-1.0-pro",
      "gemini-pro"
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const testPrompt = "Hello! Please respond with 'Gemini API is working correctly' and nothing else.";
        const result = await model.generateContent(testPrompt);
        const response = await result.response;
        const text = response.text();
        
        return NextResponse.json({
          success: true,
          workingModel: modelName,
          response: text,
          timestamp: new Date().toISOString()
        });
        
      } catch (modelError: any) {
        console.log(`Model ${modelName} failed:`, modelError.message);
        continue; // Try next model
      }
    }
    
    return NextResponse.json({
      success: false,
      error: "No working model found",
      modelsTried: modelsToTry,
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('Gemini test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}