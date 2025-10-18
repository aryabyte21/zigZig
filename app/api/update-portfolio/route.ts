import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { portfolioId, title, description, is_published } = await request.json();
    
    if (!portfolioId) {
      return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify the portfolio belongs to the user
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, user_id, content')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPortfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Update the portfolio
    const { data: portfolio, error: updateError } = await supabase
      .from('portfolios')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        is_published: is_published ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Portfolio update error:', updateError);
      return NextResponse.json({ 
        error: "Failed to update portfolio" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      portfolio,
      message: "Portfolio updated successfully" 
    });

  } catch (error) {
    console.error('Portfolio update error:', error);
    return NextResponse.json({ 
      error: "Failed to update portfolio" 
    }, { status: 500 });
  }
}
