import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { portfolioId } = await request.json();
    
    if (!portfolioId) {
      return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 });
    }

    // Verify the portfolio belongs to the user
    const { data: targetPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, user_id, title, is_published')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !targetPortfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Use database function to ensure only one portfolio is active
    const { data: result, error: functionError } = await supabase.rpc('activate_portfolio', {
      target_portfolio_id: portfolioId,
      user_id: user.id
    });

    if (functionError || !result?.[0]?.success) {
      const errorMessage = result?.[0]?.message || functionError?.message || "Failed to activate portfolio";
      console.error('Portfolio activation error:', errorMessage);
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 500 });
    }

    // Try to create AI agent if user has voice ID
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ai_voice_id")
        .eq("id", user.id)
        .single();

      if (profile?.ai_voice_id) {
        // Create agent asynchronously (don't block activation)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/create-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ portfolioId }),
        }).catch(err => {
          console.error("Error creating agent (non-blocking):", err);
        });
      }
    } catch (agentError) {
      // Agent creation failure shouldn't block portfolio activation
      console.error("Error checking for voice ID:", agentError);
    }

    return NextResponse.json({ 
      success: true,
      message: "Portfolio activated successfully",
      portfolio: {
        id: targetPortfolio.id,
        title: targetPortfolio.title,
        is_published: true
      }
    });

  } catch (error) {
    console.error('Portfolio activation error:', error);
    return NextResponse.json({ 
      error: "Failed to activate portfolio" 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { portfolioId } = await request.json();
    
    if (!portfolioId) {
      return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 });
    }

    // Use database function to deactivate the portfolio
    const { data: result, error: functionError } = await supabase.rpc('deactivate_portfolio', {
      target_portfolio_id: portfolioId,
      user_id: user.id
    });

    if (functionError || !result?.[0]?.success) {
      const errorMessage = result?.[0]?.message || functionError?.message || "Failed to deactivate portfolio";
      console.error('Portfolio deactivation error:', errorMessage);
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 500 });
    }

    // Get the updated portfolio data
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id, title')
      .eq('id', portfolioId)
      .single();

    return NextResponse.json({ 
      success: true,
      message: "Portfolio deactivated successfully",
      portfolio: {
        id: portfolio?.id,
        title: portfolio?.title,
        is_published: false
      }
    });

  } catch (error) {
    console.error('Portfolio deactivation error:', error);
    return NextResponse.json({ 
      error: "Failed to deactivate portfolio" 
    }, { status: 500 });
  }
}
