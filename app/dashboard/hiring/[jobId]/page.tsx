"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecruiterCardStack } from "@/components/recruiter-card-stack";
import { RecruiterMatchList } from "@/components/recruiter-match-list";
import { ArrowLeft, Users, Heart, Star, X, TrendingUp } from "lucide-react";
import { JobPosting, CandidateMatch } from "@/types/recruiter";
import { toast } from "sonner";

export default function JobMatchingPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const supabase = createClient();

  // Live data from Convex (useQuery provides automatic live updates)
  const matches = useQuery(
    api.recruiter.getCandidateMatches,
    jobId ? { jobId, status: activeTab as "pending" | "liked" | "passed" | "super_liked" } : "skip"
  );

  const stats = useQuery(
    api.recruiter.getRecruiterStats,
    jobId ? { jobId } : "skip"
  );

  const updateMatchStatus = useMutation(api.recruiter.updateMatchStatus);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Load job error:', error);
      toast.error("Failed to load job posting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (matchId: string, direction: "left" | "right" | "up") => {
    try {
      const match = matches?.find((m: CandidateMatch) => m._id === matchId);
      if (!match) return;

      let newStatus: "liked" | "passed" | "super_liked";
      if (direction === "right") {
        newStatus = "liked";
      } else if (direction === "left") {
        newStatus = "passed";
      } else {
        newStatus = "super_liked";
      }

      await updateMatchStatus({
        matchId: match._id,
        status: newStatus,
        jobId: jobId,
        candidateUserId: match.candidateUserId,
      });

      // Don't show toast here - CardStack already handles it
    } catch (error) {
      console.error("Swipe error:", error);
      toast.error("Failed to update match status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <p className="text-muted-foreground">Job not found</p>
          <Button onClick={() => router.push('/dashboard/hiring')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = stats?.pending_count || 0;
  const likedCount = stats?.liked_count || 0;
  const superLikedCount = stats?.super_liked_count || 0;
  const passedCount = stats?.passed_count || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/hiring')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{job.title}</h1>
            {job.company && (
              <p className="text-sm text-muted-foreground">{job.company}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{job.total_matches}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{likedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{superLikedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{passedCount}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="liked" className="relative">
            Liked
            {likedCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                {likedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="super_liked" className="relative">
            Super Liked
            {superLikedCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                {superLikedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="passed">
            Passed
            {passedCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                {passedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-8">
          <div className="flex justify-center">
            {matches && matches.length > 0 ? (
              <RecruiterCardStack
                matches={matches as CandidateMatch[]}
                onSwipe={handleSwipe}
              />
            ) : (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">No pending matches</h3>
                <p className="text-sm text-muted-foreground">
                  All candidates have been reviewed
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="liked" className="mt-8">
          {matches && matches.length > 0 ? (
            <RecruiterMatchList 
              matches={matches as CandidateMatch[]} 
              title="Liked Candidates"
              emptyMessage="No liked candidates yet"
            />
          ) : (
            <div className="text-center py-16">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No liked candidates</h3>
              <p className="text-sm text-muted-foreground">
                Candidates you like will appear here
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="super_liked" className="mt-8">
          {matches && matches.length > 0 ? (
          <RecruiterMatchList 
          matches={matches as CandidateMatch[]} 
          title="Liked Candidates"
          emptyMessage="No liked candidates yet"
        />          ) : (
            <div className="text-center py-16">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No super liked candidates</h3>
              <p className="text-sm text-muted-foreground">
                Your top candidates will appear here
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="passed" className="mt-8">
          {matches && matches.length > 0 ? (
          <RecruiterMatchList 
          matches={matches as CandidateMatch[]} 
          title="Liked Candidates"
          emptyMessage="No liked candidates yet"
        />          ) : (
            <div className="text-center py-16">
              <X className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No passed candidates</h3>
              <p className="text-sm text-muted-foreground">
                Candidates you pass on will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

