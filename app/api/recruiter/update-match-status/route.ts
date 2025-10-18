import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, status, jobId, candidateUserId } = await request.json();
    
    if (!matchId || !status) {
      return NextResponse.json({ 
        error: "Match ID and status are required" 
      }, { status: 400 });
    }

    if (!["liked", "passed", "super_liked"].includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status" 
      }, { status: 400 });
    }

    // Update match status in Convex
    await fetchMutation(api.recruiter.updateMatchStatus, {
      matchId: matchId as Id<"candidate_matches">,
      status: status as "liked" | "passed" | "super_liked",
    });

    // Log activity
    if (jobId && candidateUserId) {
      await fetchMutation(api.recruiter.logActivity, {
        userId: user.id,
        jobId,
        action: status,
        candidateUserId,
      });
    }

    // Update job posting counters in Supabase
    if (jobId) {
      const counterField = status === "liked" ? "liked_count" : 
                          status === "passed" ? "passed_count" : 
                          "liked_count"; // super_liked counts as liked

      const { data: currentJob } = await supabase
        .from('job_postings')
        .select('liked_count, passed_count')
        .eq('id', jobId)
        .single();

      if (currentJob) {
        const updates: any = {
          updated_at: new Date().toISOString(),
        };

        if (status === "liked" || status === "super_liked") {
          updates.liked_count = (currentJob.liked_count || 0) + 1;
        } else if (status === "passed") {
          updates.passed_count = (currentJob.passed_count || 0) + 1;
        }

        await supabase
          .from('job_postings')
          .update(updates)
          .eq('id', jobId);
      }
    }

    return NextResponse.json({
      success: true,
      matchId,
      status,
    });

  } catch (error) {
    console.error('Update match status error:', error);
    return NextResponse.json({ 
      error: "Failed to update match status" 
    }, { status: 500 });
  }
}


