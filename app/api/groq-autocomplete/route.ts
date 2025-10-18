import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { type, ...params } = await request.json();

    switch (type) {
      case 'autocompletions':
        return await handleAutocompletions(params);
      case 'companySuggestions':
        return await handleCompanySuggestions(params);
      case 'messageTemplate':
        return await handleMessageTemplate(params);
      case 'messageQuality':
        return await handleMessageQuality(params);
      case 'smart_replies':
        return await handleSmartReplies(params);
      default:
        return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleAutocompletions(params: any) {
  const { messageIntent, visitorName, visitorCompany, portfolioOwnerName, currentMessage, portfolioContext } = params;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that helps professionals write effective messages. Generate 3 smart autocomplete suggestions for the current message based on the context.

Rules:
- Keep suggestions professional and relevant
- Make them specific to the intent and context
- Each suggestion should be 10-30 words
- Focus on value proposition and clear next steps
- Return only the suggestions, one per line`
      },
      {
        role: "user",
        content: `Context:
Intent: ${messageIntent}
Sender: ${visitorName} from ${visitorCompany}
Recipient: ${portfolioOwnerName}
Current message: "${currentMessage}"
Portfolio skills: ${portfolioContext?.skills?.join(', ') || 'Not available'}

Generate 3 autocomplete suggestions that would naturally continue or improve this message.`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 200,
  });

  const suggestions = completion.choices[0].message.content
    ?.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 3) || [];

  return NextResponse.json({ suggestions });
}

async function handleCompanySuggestions(params: any) {
  const { partialCompany } = params;

  if (partialCompany.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a company name autocomplete assistant. Given a partial company name, suggest 5 real, well-known companies that match. Return only company names, one per line."
      },
      {
        role: "user",
        content: `Partial company name: "${partialCompany}"`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_tokens: 100,
  });

  const suggestions = completion.choices[0].message.content
    ?.split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 5) || [];

  return NextResponse.json({ suggestions });
}

async function handleMessageTemplate(params: any) {
  const { intent, visitorCompany, portfolioOwnerName, portfolioContext } = params;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Generate a professional message template for the given intent. Make it personalized and specific. Include placeholders in [brackets] for customization.`
      },
      {
        role: "user",
        content: `Intent: ${intent}
Company: ${visitorCompany || '[Company]'}
Recipient: ${portfolioOwnerName || '[Name]'}
Skills context: ${portfolioContext?.skills?.join(', ') || 'Not available'}

Generate a professional message template (2-3 sentences max).`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    max_tokens: 150,
  });

  const template = completion.choices[0].message.content?.trim() || '';
  return NextResponse.json({ template });
}

async function handleMessageQuality(params: any) {
  const { message, intent } = params;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Analyze the quality of a professional message and provide improvement suggestions. Return a JSON object with:
{
  "score": 1-10,
  "suggestions": ["suggestion1", "suggestion2"],
  "improvements": ["improvement1", "improvement2"]
}`
      },
      {
        role: "user",
        content: `Message: "${message}"
Intent: ${intent}

Analyze this message for professionalism, clarity, and effectiveness.`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_tokens: 300,
  });

  const response = completion.choices[0].message.content?.trim();
  if (response) {
    try {
      const analysis = JSON.parse(response);
      return NextResponse.json(analysis);
    } catch {
      // Fallback if JSON parsing fails
      return NextResponse.json({
        score: 7,
        suggestions: ["Be more specific about your goals"],
        improvements: ["Add a clear call to action"]
      });
    }
  }

  return NextResponse.json({
    score: 5,
    suggestions: [],
    improvements: []
  });
}

async function handleSmartReplies(params: any) {
  const { conversationHistory, visitorName, portfolioOwnerName, intent, lastMessage } = params.context || {};

  // Build conversation context for AI
  let conversationContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    // Use last 10 messages for context (to stay within token limits)
    const recentMessages = conversationHistory.slice(-10);
    conversationContext = recentMessages
      .map((msg: any) => `${msg.content}`)
      .join('\n');
  } else if (lastMessage) {
    conversationContext = `Previous message: "${lastMessage}"`;
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI assistant helping ${visitorName || 'a professional'} reply to ${portfolioOwnerName || 'someone'} in a professional networking conversation. 

Generate 3 smart, contextually appropriate reply suggestions based on the full conversation history. Each reply should be:
- Professional yet personable
- Contextually relevant to the entire conversation
- Action-oriented when appropriate
- Concise (8-20 words)
- Natural and conversational
- Appropriate for continuing the professional relationship

Analyze the conversation tone, topics discussed, and relationship stage to provide relevant suggestions.

Return only the 3 suggestions, one per line, without numbers or bullets.`
      },
      {
        role: "user",
        content: `Conversation context:
${conversationContext}

Visitor: ${visitorName || 'Professional Contact'}
Portfolio Owner: ${portfolioOwnerName || 'Contact'}
Intent: ${intent || 'professional_reply'}

Based on this conversation, generate 3 contextually appropriate reply options that would naturally continue this professional dialogue.`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 200,
  });

  const suggestions = completion.choices[0].message.content
    ?.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
    .slice(0, 3) || [];

  return NextResponse.json({ suggestions });
}
