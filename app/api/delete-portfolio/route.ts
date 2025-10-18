import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Verify the portfolio belongs to the user
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Delete the portfolio
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Portfolio deletion error:', deleteError);
      return NextResponse.json({ 
        error: "Failed to delete portfolio" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Portfolio deleted successfully" 
    });

  } catch (error) {
    console.error('Portfolio deletion error:', error);
    return NextResponse.json({ 
      error: "Failed to delete portfolio" 
    }, { status: 500 });
  }
}
