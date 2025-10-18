import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { searchJobOpportunities } from "./exa";

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ConversationContext {
  portfolioUserId: string;
  visitorId?: string;
  visitorName: string;
  messageHistory: Array<{
    content: string;
    sender: string;
    timestamp: number;
  }>;
  portfolioData?: any;
}

export interface MessageAnalysis {
  category: "hiring" | "networking" | "collaboration" | "spam" | "general";
  priority: number; // 1-5, 5 being highest
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  intent: string;
  suggestedReply?: string;
  shouldAutoReply: boolean;
}

/**
 * Use Gemini 2.5 Flash to categorize and analyze incoming messages
 */
export async function categorizeAndRespond(
  message: string, 
  context: ConversationContext
): Promise<MessageAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
    Analyze this message sent to a professional portfolio owner and provide a comprehensive analysis.
    
    Message: "${message}"
    Sender: ${context.visitorName}
    
    Portfolio Context:
    - Portfolio Owner: ${context.portfolioUserId}
    - Previous Messages: ${context.messageHistory.length}
    
    Recent Conversation:
    ${context.messageHistory.slice(-3).map(msg => `${msg.sender}: ${msg.content}`).join('\n')}
    
    Provide analysis in this JSON format:
    {
      "category": "hiring|networking|collaboration|spam|general",
      "priority": 1-5,
      "sentiment": "positive|neutral|negative", 
      "urgency": "low|medium|high",
      "intent": "brief description of sender's intent",
      "suggestedReply": "professional response suggestion (optional)",
      "shouldAutoReply": boolean,
      "reasoning": "explanation of analysis"
    }
    
    Guidelines:
    - "hiring" for job opportunities, recruitment, interviews
    - "networking" for professional connections, meetups, conferences
    - "collaboration" for project partnerships, freelance work
    - "spam" for promotional content, irrelevant messages
    - "general" for other professional inquiries
    
    Priority scoring:
    - 5: Urgent hiring opportunities, time-sensitive collaborations
    - 4: Interesting networking, good collaboration prospects
    - 3: General professional inquiries
    - 2: Low-priority networking
    - 1: Spam or irrelevant content
    
    Auto-reply suggestions:
    - Only suggest auto-replies for common inquiries
    - Keep responses professional and helpful
    - Don't auto-reply to complex or personal messages
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text().trim();
    
    // Clean JSON response
    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (analysisText.startsWith('```')) {
      analysisText = analysisText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(analysisText);
    
    return {
      category: analysis.category || "general",
      priority: analysis.priority || 3,
      sentiment: analysis.sentiment || "neutral",
      urgency: analysis.urgency || "medium",
      intent: analysis.intent || "General inquiry",
      suggestedReply: analysis.suggestedReply,
      shouldAutoReply: analysis.shouldAutoReply || false,
    };
    
  } catch (error) {
    console.error('Gemini categorization error:', error);
    
    // Fallback analysis
    return {
      category: "general",
      priority: 3,
      sentiment: "neutral",
      urgency: "medium",
      intent: "General inquiry",
      shouldAutoReply: false,
    };
  }
}

/**
 * Generate intelligent auto-reply using conversation context
 */
export async function generateAutoReply(
  message: string,
  context: ConversationContext,
  analysis: MessageAnalysis
): Promise<string | null> {
  if (!analysis.shouldAutoReply) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
    Generate a professional auto-reply for this message to a portfolio owner.
    
    Original Message: "${message}"
    Sender: ${context.visitorName}
    Category: ${analysis.category}
    Intent: ${analysis.intent}
    
    Portfolio Owner Context:
    - This is an automated response system
    - The owner will personally respond later
    - Keep it professional and helpful
    
    Guidelines:
    - Acknowledge the message and intent
    - Set expectations for response time
    - Provide relevant next steps if applicable
    - Keep it concise (2-3 sentences max)
    - Don't make commitments on behalf of the owner
    
    Generate ONLY the reply text, no additional formatting or explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error('Auto-reply generation error:', error);
    return "Thank you for your message! I'll get back to you within 24 hours.";
  }
}

/**
 * Analyze message sentiment using Gemini
 */
export async function analyzeMessageSentiment(message: string): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  emotions: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
    Analyze the sentiment and emotions in this message:
    
    "${message}"
    
    Provide analysis in JSON format:
    {
      "sentiment": "positive|neutral|negative",
      "confidence": 0.0-1.0,
      "emotions": ["array", "of", "detected", "emotions"],
      "reasoning": "brief explanation"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text().trim();
    
    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(analysisText);
    
    return {
      sentiment: analysis.sentiment || "neutral",
      confidence: analysis.confidence || 0.5,
      emotions: analysis.emotions || [],
    };
    
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      sentiment: "neutral",
      confidence: 0.5,
      emotions: [],
    };
  }
}

/**
 * Generate weekly analytics summary using Groq
 */
export async function generateWeeklySummary(userId: string, analyticsData: any): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI analytics assistant that generates insightful weekly summaries for portfolio messaging data. Be concise, actionable, and professional."
        },
        {
          role: "user",
          content: `Generate a weekly summary for this messaging data:
          
          Messages Received: ${analyticsData.messagesReceived}
          Messages Replied: ${analyticsData.messagesReplied}
          Average Response Time: ${analyticsData.avgResponseTime} hours
          Top Categories: ${analyticsData.topCategories.join(', ')}
          Conversion Rate: ${analyticsData.conversionRate}%
          AI Reply Rate: ${analyticsData.aiReplyRate}%
          
          Provide insights on:
          - Performance trends
          - Response efficiency
          - Message quality
          - Actionable recommendations
          
          Keep it under 200 words and professional.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 300,
    });

    return completion.choices[0].message.content || "No summary available.";
    
  } catch (error) {
    console.error('Groq summary generation error:', error);
    return "Weekly summary generation failed. Please check your analytics manually.";
  }
}

/**
 * Find job matches using Exa for smart referrals
 */
export async function findJobMatches(
  userProfile: any, 
  recipientProfile: any
): Promise<Array<{
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reasoning: string;
}>> {
  try {
    // Extract skills and preferences from profiles
    const skills = [
      ...(userProfile.skills || []),
      ...(recipientProfile.skills || [])
    ].slice(0, 10);

    const location = recipientProfile.location || userProfile.location;
    const experienceLevel = recipientProfile.experienceLevel || userProfile.experienceLevel;

    // Search for relevant jobs using Exa
    const jobs = await searchJobOpportunities({
      skills,
      location,
      experienceLevel,
      jobType: "full-time",
      remote: true,
    }, recipientProfile);

    // Score and filter matches
    return jobs.slice(0, 5).map(job => ({
      jobId: job.id,
      title: job.title,
      company: job.company,
      matchScore: job.relevanceScore,
      reasoning: `Matches ${job.skills.slice(0, 3).join(', ')} skills and ${job.experienceLevel} level`,
    }));
    
  } catch (error) {
    console.error('Job matching error:', error);
    return [];
  }
}

/**
 * Generate voice reply using ElevenLabs (placeholder for now)
 */
export async function generateVoiceReply(text: string, voiceId?: string): Promise<{
  audioUrl: string;
  duration: number;
}> {
  // TODO: Implement ElevenLabs integration
  console.log('Voice synthesis requested for:', text);
  
  return {
    audioUrl: "placeholder-audio-url",
    duration: 5000, // 5 seconds
  };
}

/**
 * Transcribe voice message (placeholder for now)
 */
export async function transcribeVoiceMessage(audioUrl: string): Promise<{
  transcription: string;
  language: string;
  confidence: number;
}> {
  // TODO: Implement voice transcription
  console.log('Voice transcription requested for:', audioUrl);
  
  return {
    transcription: "Voice message transcription placeholder",
    language: "en",
    confidence: 0.95,
  };
}

/**
 * Detect spam and filter low-quality messages
 */
export async function detectSpam(message: string, senderInfo: any): Promise<{
  isSpam: boolean;
  confidence: number;
  reasons: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
    Analyze this message for spam or low-quality content:
    
    Message: "${message}"
    Sender: ${senderInfo.name || "Unknown"}
    Email: ${senderInfo.email || "Unknown"}
    
    Check for:
    - Promotional content
    - Irrelevant messages
    - Suspicious patterns
    - Low-quality communication
    - Potential scams
    
    Respond in JSON format:
    {
      "isSpam": boolean,
      "confidence": 0.0-1.0,
      "reasons": ["array", "of", "reasons"],
      "recommendation": "block|flag|allow"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text().trim();
    
    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(analysisText);
    
    return {
      isSpam: analysis.isSpam || false,
      confidence: analysis.confidence || 0.5,
      reasons: analysis.reasons || [],
    };
    
  } catch (error) {
    console.error('Spam detection error:', error);
    return {
      isSpam: false,
      confidence: 0.5,
      reasons: [],
    };
  }
}
