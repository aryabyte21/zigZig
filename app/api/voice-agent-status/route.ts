import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check voice ID in profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_voice_id")
      .eq("id", user.id)
      .single();

    // Get portfolios
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, title, is_published, slug")
      .eq("user_id", user.id);

    // Check Convex for agents
    const agents = await convex.query(api.agents.getAgentByUser, { userId: user.id });
    
    const status = {
      hasVoiceId: !!profile?.ai_voice_id,
      voiceId: profile?.ai_voice_id || null,
      hasPortfolio: (portfolios?.length || 0) > 0,
      portfolios: portfolios?.map(p => ({
        id: p.id,
        title: p.title,
        isPublished: p.is_published,
        slug: p.slug,
        url: p.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portfolio/${p.slug}` : null
      })) || [],
      hasAgent: !!agents,
      agent: agents ? {
        agentId: agents.agentId,
        agentUrl: agents.agentUrl,
        isActive: agents.isActive,
        conversationCount: agents.conversationCount
      } : null,
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error("Voice agent status error:", error);
    return NextResponse.json({ 
      error: "Failed to get status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

