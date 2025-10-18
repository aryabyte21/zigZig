import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import Exa from "exa-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const exa = new Exa(process.env.EXA_API_KEY);

export interface ConversationContext {
  portfolioData: {
    name: string;
    title: string;
    skills: string[];
    experience: string;
    location?: string;
  };
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  visitorInfo?: {
    name: string;
    company?: string;
    email?: string;
  };
}

export interface MessageTriage {
  category: "hiring" | "networking" | "collaboration" | "spam" | "general";
  priority: number; // 1-5
  sentiment: "positive" | "neutral" | "negative";
  intent: string;
  extractedData: {
    company?: string;
    role?: string;
    timeline?: string;
  };
}

export interface AIResponse {
  reply: string;
  shouldAutoReply: boolean;
  suggestedReplies: string[];
  attachments?: any[];
  confidence: number;
}

/**
 * Fast initial triage using Gemini 2.5 Flash
 * Speed: ~50-100ms
 */
export async function categorizeWithGemini(
  message: string,
  context: ConversationContext
): Promise<MessageTriage> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze this professional message and extract structured data.

Message: "${message}"

Portfolio context:
- Name: ${context.portfolioData.name}
- Role: ${context.portfolioData.title}
- Skills: ${context.portfolioData.skills.slice(0, 10).join(", ")}

Visitor info:
- Name: ${context.visitorInfo?.name || "Unknown"}
- Company: ${context.visitorInfo?.company || "Unknown"}

Return ONLY valid JSON in this exact format:
{
  "category": "hiring" | "networking" | "collaboration" | "spam" | "general",
  "priority": 1-5,
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "brief description",
  "extractedData": {
    "company": "if mentioned",
    "role": "if mentioned",
    "timeline": "if mentioned"
  }
}

Rules:
- "hiring" = recruiting/job offer mentions
- "networking" = connection/advice seeking
- "collaboration" = project/partnership proposals
- "spam" = generic/irrelevant messages
- Priority 5 = urgent/high-value, 1 = low priority`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean markdown code blocks
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const triage = JSON.parse(text);
    return triage;
  } catch (error) {
    console.error("Gemini categorization error:", error);
    // Fallback to safe defaults
    return {
      category: "general",
      priority: 3,
      sentiment: "neutral",
      intent: "General inquiry",
      extractedData: {},
    };
  }
}

/**
 * Generate natural conversation response using OpenAI GPT-4
 * Speed: ~500-1000ms
 */
export async function generateReplyWithOpenAI(
  message: string,
  context: ConversationContext,
  triage: MessageTriage
): Promise<AIResponse> {
  try {
    const systemPrompt = `You are a professional assistant helping ${context.portfolioData.name}, a ${context.portfolioData.title}.

Guidelines:
- Be warm, professional, and helpful
- Match the tone of the incoming message
- Keep responses concise (2-3 sentences max)
- For hiring inquiries, express interest and ask for details
- For networking, be open and suggest specific next steps
- For collaboration, show enthusiasm and ask clarifying questions

Context:
- Portfolio owner: ${context.portfolioData.name}
- Their role: ${context.portfolioData.title}
- Their skills: ${context.portfolioData.skills.slice(0, 5).join(", ")}
- Message category: ${triage.category}
- Visitor: ${context.visitorInfo?.name || "Someone"} ${context.visitorInfo?.company ? `from ${context.visitorInfo.company}` : ""}`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...context.conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 200,
    });

    const reply = completion.choices[0].message.content || "";

    // Determine if we should auto-reply
    const shouldAutoReply = triage.category !== "spam" && triage.priority >= 4;

    return {
      reply,
      shouldAutoReply,
      suggestedReplies: [],
      confidence: 0.85,
    };
  } catch (error) {
    console.error("OpenAI generation error:", error);
    return {
      reply: "Thanks for reaching out! I'll get back to you soon.",
      shouldAutoReply: false,
      suggestedReplies: [],
      confidence: 0.5,
    };
  }
}

/**
 * Find relevant jobs using Exa if hiring intent detected
 * Speed: ~300-500ms
 */
export async function findRelevantJobs(
  portfolioData: ConversationContext["portfolioData"],
  message: string
): Promise<any[]> {
  try {
    // Build search query from portfolio skills and message context
    const skills = portfolioData.skills.slice(0, 5).join(" OR ");
    const searchQuery = `${portfolioData.title} jobs ${skills}`;

    const results = await exa.searchAndContents(searchQuery, {
      type: "keyword",
      numResults: 3,
      category: "job listing",
      text: { maxCharacters: 200 },
    });

    return results.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.text,
      company: extractCompanyFromUrl(result.url),
    }));
  } catch (error) {
    console.error("Exa job search error:", error);
    return [];
  }
}

/**
 * Polish message using Groq for quality check
 * Speed: ~50-100ms
 */
export async function polishWithGroq(response: AIResponse): Promise<AIResponse> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional message editor. Improve grammar and clarity while keeping the core message. Return ONLY the improved message, nothing else.",
        },
        {
          role: "user",
          content: response.reply,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 200,
    });

    const polishedReply = completion.choices[0].message.content?.trim() || response.reply;

    return {
      ...response,
      reply: polishedReply,
    };
  } catch (error) {
    console.error("Groq polish error:", error);
    return response;
  }
}

/**
 * Main orchestration function - coordinates all AI services
 */
export async function processIncomingMessage(
  message: string,
  context: ConversationContext
): Promise<{
  triage: MessageTriage;
  response: AIResponse;
  jobs?: any[];
}> {
  // 1. Gemini: Fast initial triage (parallel with OpenAI if needed)
  const triage = await categorizeWithGemini(message, context);

  // 2. OpenAI: Generate natural response
  const response = await generateReplyWithOpenAI(message, context, triage);

  // 3. Exa: Enrich with jobs if hiring intent detected (parallel)
  let jobs: any[] | undefined;
  if (triage.category === "hiring") {
    jobs = await findRelevantJobs(context.portfolioData, message);
    response.attachments = jobs;
  }

  // 4. Groq: Quality check and polish (only if confident reply)
  const polishedResponse = response.confidence > 0.7 
    ? await polishWithGroq(response)
    : response;

  return {
    triage,
    response: polishedResponse,
    jobs,
  };
}

// Helper functions

function extractCompanyFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.split(".")[0];
  } catch {
    return "Company";
  }
}

/**
 * Extract name and company from intro text using AI
 */
export async function extractVisitorInfo(introText: string): Promise<{
  name?: string;
  company?: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Extract name and company from this introduction text.

Text: "${introText}"

Return ONLY valid JSON:
{
  "name": "full name if mentioned",
  "company": "company name if mentioned"
}

If something is not mentioned, omit that field.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Info extraction error:", error);
    return {};
  }
}

