import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ 
        error: "ElevenLabs API key not configured"
      }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { portfolioId } = await request.json();

    if (!portfolioId) {
      return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 });
    }

    // Get portfolio data
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", portfolioId)
      .eq("user_id", user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ 
        error: "Portfolio not found" 
      }, { status: 404 });
    }

    // Get user's voice ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_voice_id")
      .eq("id", user.id)
      .single();

    const voiceId = profile?.ai_voice_id;

    if (!voiceId) {
      return NextResponse.json({ 
        error: "Voice ID not found. Please complete voice recording first."
      }, { status: 400 });
    }

    // Extract portfolio content
    const content = portfolio.content || {};
    const name = content.name || "Professional";
    const title = content.title || "Professional";
    const about = content.about || "";
    const experience = content.experience || [];
    const projects = content.projects || [];
    const skills = content.skills || [];
    const education = content.education || [];

    const contact = content.contact || {};

    // Build comprehensive knowledge base with rich context
    const knowledgeBase = `
# Professional Profile: ${name}

## Current Role & Expertise
${title}

${about}

## Core Skills & Technologies
${skills.length > 0 ? skills.join(" • ") : "Diverse technical skill set"}

## Professional Experience

${experience.length > 0 ? experience.map((exp: any, idx: number) => `
### ${idx + 1}. ${exp.title} at ${exp.company}
**Duration:** ${exp.duration}
${exp.location ? `**Location:** ${exp.location}` : ''}

**Responsibilities & Impact:**
${exp.description}
`).join("\n") : "Extensive professional background"}

## Featured Projects & Achievements

${projects.length > 0 ? projects.map((proj: any, idx: number) => `
### ${idx + 1}. ${proj.name}
${proj.description}

**Tech Stack:** ${proj.technologies?.join(", ") || "Modern technologies"}
${proj.url ? `**Link:** ${proj.url}` : ''}
`).join("\n") : "Strong portfolio of successful projects"}

## Educational Background
${education.length > 0 ? education.map((edu: any) => `
- **${edu.degree}** from ${edu.school} (${edu.year})
`).join("\n") : "Solid educational foundation"}

## Professional Highlights
- ${experience.length}+ professional role${experience.length !== 1 ? 's' : ''} showcasing career growth
- ${projects.length} successfully delivered project${projects.length !== 1 ? 's' : ''}
- Expertise in ${skills.slice(0, 3).join(", ")}${skills.length > 3 ? ` and ${skills.length - 3}+ more technologies` : ''}

## Contact Information
${contact.linkedin ? `LinkedIn: ${contact.linkedin}` : ''}
${contact.github ? `GitHub: ${contact.github}` : ''}
${contact.website ? `Website: ${contact.website}` : ''}
${contact.location ? `Location: ${contact.location}` : ''}

---

**Assistant Guidelines:** Engage professionally and enthusiastically. Highlight ${name}'s achievements, technical depth, and career progression. When asked about specific technologies or experiences, provide concrete examples from the information above. Encourage serious recruiters to reach out through the provided contact methods.
`.trim();

    const systemPrompt = `You are ${name}'s AI-powered portfolio assistant, speaking in their voice. Your role is to help recruiters and potential collaborators learn about ${name}'s professional background, skills, and achievements.

Key Principles:
- Be professional, enthusiastic, and personable
- Provide specific details from the knowledge base below
- Highlight relevant achievements and technical expertise
- Encourage meaningful connections and opportunities
- If asked about information not in the knowledge base, politely acknowledge and focus on what you know

${knowledgeBase}`;

    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
              llm: 'gemini-2.0-flash',
            },
            first_message: `Hi! I'm ${name}'s AI assistant. Ask me anything about ${name}'s experience!`,
            language: 'en',
          },
          asr: {
            quality: 'high',
          },
          tts: {
            voice_id: voiceId,
          },
        },
        platform_settings: {
          widget: {
            enabled: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Agent creation failed: ${error}`);
    }

    const agentResult = await response.json();
    const agentId = agentResult.agent_id;
    const dashboardUrl = `https://elevenlabs.io/app/conversational-ai`;
    const publicUrl = agentResult.public_url || agentResult.share_url || agentResult.widget_url;
    const agentUrl = publicUrl || dashboardUrl;
    
    await convex.mutation(api.agents.createAgent, {
      userId: user.id,
      portfolioId: portfolioId,
      agentId: agentId,
      voiceId: voiceId,
      agentUrl: agentUrl,
    });

    return NextResponse.json({ 
      agentId,
      agentUrl: agentUrl,
      publicUrl: publicUrl || null,
      dashboardUrl: dashboardUrl,
      message: "AI agent created successfully" 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to create agent",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

