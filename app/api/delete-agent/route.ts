import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    console.log("=== DELETE AGENT API CALLED ===");
    
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User ID:", user.id);

    // Get the agent from Convex
    const agent = await convex.query(api.agents.getAgentByUser, { userId: user.id });

    if (!agent) {
      return NextResponse.json({ 
        error: "No agent found for this user" 
      }, { status: 404 });
    }

    console.log("Found agent:", agent.agentId);

    // Delete from ElevenLabs (optional - you might want to keep it)
    // For now, just delete from Convex to allow recreation

    // Delete from Convex by setting isActive to false
    await convex.mutation(api.agents.createAgent, {
      userId: user.id,
      portfolioId: agent.portfolioId,
      agentId: agent.agentId,
      voiceId: agent.voiceId,
      agentUrl: agent.agentUrl || "",
      isActive: false,
    });

    console.log("Agent marked as inactive");
    console.log("=== DELETE AGENT COMPLETED ===");

    return NextResponse.json({ 
      message: "Agent deleted successfully. You can now create a new one." 
    });

  } catch (error) {
    console.error("=== AGENT DELETION ERROR ===");
    console.error("Error:", error);
    
    return NextResponse.json({ 
      error: "Failed to delete agent",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

