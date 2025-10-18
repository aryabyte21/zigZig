import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface MessageContext {
  senderName: string;
  senderCompany?: string;
  recipientName: string;
  intent: string;
}

export interface EnhancementResult {
  enhanced: string;
  improvements: string[];
  confidence: number;
}

/**
 * Enhance a message draft using OpenAI before sending
 * Fixes grammar, improves clarity, maintains voice
 */
export async function enhanceMessage(
  draft: string,
  intent: string,
  context: MessageContext
): Promise<EnhancementResult> {
  try {
    const prompt = `Enhance this ${intent} message while keeping the core meaning and sender's voice.

Draft: "${draft}"

Context:
- From: ${context.senderName}${context.senderCompany ? ` (${context.senderCompany})` : ""}
- To: ${context.recipientName}
- Purpose: ${intent}

Instructions:
1. Fix any grammar or spelling errors
2. Add professional polish without being overly formal
3. Keep the authentic voice - don't make it sound robotic
4. Ensure it's concise and clear
5. Maintain the original tone (friendly, professional, casual, etc.)

Return ONLY valid JSON in this format:
{
  "enhanced": "the improved message",
  "improvements": ["list of specific improvements made"],
  "confidence": 0.0-1.0 (how confident you are in the enhancement)
}

If the original message is already good, return it with minimal changes.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a professional writing assistant. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content || "{}";
    const result = JSON.parse(response);

    return {
      enhanced: result.enhanced || draft,
      improvements: result.improvements || [],
      confidence: result.confidence || 0.7,
    };
  } catch (error) {
    console.error("Message enhancement error:", error);
    // Return original if enhancement fails
    return {
      enhanced: draft,
      improvements: [],
      confidence: 0,
    };
  }
}

/**
 * Quick grammar and spelling check without changing tone
 */
export async function quickGrammarCheck(text: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Fix only grammar and spelling errors. Do not change the tone, style, or meaning. Return ONLY the corrected text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return completion.choices[0].message.content?.trim() || text;
  } catch (error) {
    console.error("Grammar check error:", error);
    return text;
  }
}

/**
 * Suggest improvements to make a message more effective
 */
export async function suggestImprovements(
  message: string,
  intent: string
): Promise<string[]> {
  try {
    const prompt = `Analyze this ${intent} message and suggest 3 specific improvements:

"${message}"

Focus on:
- Clarity and conciseness
- Professional tone
- Call-to-action clarity
- Personalization opportunities

Return ONLY 3 short suggestions, one per line, max 15 words each.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a professional writing coach. Provide concise, actionable suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 150,
    });

    const response = completion.choices[0].message.content || "";
    const suggestions = response
      .split("\n")
      .map((line: string) => line.trim().replace(/^\d+\.\s*/, ""))
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    return suggestions.length > 0
      ? suggestions
      : ["Be more specific", "Add a clear next step", "Personalize the greeting"];
  } catch (error) {
    console.error("Improvement suggestions error:", error);
    return ["Be more specific", "Add a clear next step", "Personalize the greeting"];
  }
}

/**
 * Rewrite message in different tones
 */
export async function rewriteInTone(
  message: string,
  targetTone: "casual" | "formal" | "friendly" | "urgent"
): Promise<string> {
  try {
    const toneDescriptions = {
      casual: "relaxed and conversational, like talking to a friend",
      formal: "professional and polished, suitable for executives",
      friendly: "warm and personable, showing genuine interest",
      urgent: "direct and time-sensitive, conveying importance",
    };

    const prompt = `Rewrite this message in a ${targetTone} tone - ${toneDescriptions[targetTone]}:

"${message}"

Keep the core meaning but adjust the language and style. Return ONLY the rewritten message.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a professional writing assistant. Rewrite messages in different tones while preserving meaning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0].message.content?.trim() || message;
  } catch (error) {
    console.error("Tone rewrite error:", error);
    return message;
  }
}

