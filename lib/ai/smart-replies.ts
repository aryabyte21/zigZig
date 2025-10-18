import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Message {
  content: string;
  senderId: string;
  senderName: string;
  metadata?: {
    category?: string;
    intent?: string;
  };
}

export interface Conversation {
  messages: Message[];
  portfolioOwnerName: string;
  visitorName: string;
  category?: string;
}

/**
 * Generate 3 contextual quick reply options using OpenAI
 * These appear as chips above the input for fast responses
 */
export async function generateSmartReplies(
  conversation: Conversation,
  lastMessage: Message
): Promise<string[]> {
  try {
    const category = lastMessage.metadata?.category || "general";
    const intent = lastMessage.metadata?.intent || "";

    const prompt = `Generate 3 quick reply options for this professional conversation.

Context:
- Category: ${category}
- Intent: ${intent}
- Last message from ${lastMessage.senderName}: "${lastMessage.content}"
- Conversation between: ${conversation.portfolioOwnerName} and ${conversation.visitorName}

Requirements:
- Professional but friendly tone
- Action-oriented (schedule call, share info, ask question)
- Max 10 words each
- Natural and conversational
- Specific to the context

Format: Return ONLY 3 lines, one reply per line, no numbering or formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    });

    const response = completion.choices[0].message.content || "";
    const replies = response
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.length < 80)
      .slice(0, 3);

    // Fallback if parsing fails
    if (replies.length === 0) {
      return getDefaultReplies(category);
    }

    return replies;
  } catch (error) {
    console.error("Smart replies generation error:", error);
    return getDefaultReplies(lastMessage.metadata?.category || "general");
  }
}

/**
 * Generate smart replies for portfolio owner responses
 */
export async function generateOwnerSmartReplies(
  lastVisitorMessage: string,
  category: string
): Promise<string[]> {
  try {
    const prompt = `Generate 3 quick professional responses to this message:

"${lastVisitorMessage}"

Category: ${category}

Requirements:
- Warm and professional
- Show genuine interest
- Move conversation forward
- Max 12 words each

Return ONLY 3 lines, one reply per line.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 120,
    });

    const response = completion.choices[0].message.content || "";
    const replies = response
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    return replies.length > 0 ? replies : getDefaultReplies(category);
  } catch (error) {
    console.error("Owner smart replies error:", error);
    return getDefaultReplies(category);
  }
}

/**
 * Fallback replies based on conversation category
 */
function getDefaultReplies(category: string): string[] {
  const defaults: Record<string, string[]> = {
    hiring: [
      "I'd love to hear more about the role",
      "When would be a good time to chat?",
      "Could you share the job description?",
    ],
    networking: [
      "I'd be happy to connect!",
      "What would you like to know?",
      "Let's schedule a quick call",
    ],
    collaboration: [
      "Tell me more about your project",
      "I'm interested, let's discuss details",
      "What's the timeline you're working with?",
    ],
    general: [
      "Thanks for reaching out!",
      "I'd be happy to help",
      "Let's chat about this",
    ],
  };

  return defaults[category] || defaults.general;
}

/**
 * Generate contextual follow-up suggestions
 */
export async function generateFollowUpSuggestions(
  conversationHistory: Message[],
  portfolioOwnerName: string
): Promise<string[]> {
  try {
    // Get last few messages for context
    const recentMessages = conversationHistory.slice(-5).map(
      (msg) => `${msg.senderName}: ${msg.content}`
    );

    const prompt = `Based on this conversation, suggest 3 natural follow-up actions for ${portfolioOwnerName}:

${recentMessages.join("\n")}

Suggestions should be:
- Specific and actionable
- Professional but friendly
- Move the conversation forward
- Max 12 words each

Return ONLY 3 lines, one suggestion per line.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const response = completion.choices[0].message.content || "";
    const suggestions = response
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    return suggestions.length > 0 ? suggestions : [
      "Schedule a follow-up call",
      "Share more details about your experience",
      "Ask about next steps",
    ];
  } catch (error) {
    console.error("Follow-up suggestions error:", error);
    return [
      "Schedule a follow-up call",
      "Share more details about your experience",
      "Ask about next steps",
    ];
  }
}

