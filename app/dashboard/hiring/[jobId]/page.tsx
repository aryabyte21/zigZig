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

      const statusLabels = {
        liked: "liked",
        passed: "passed",
        super_liked: "super liked ⭐",
      };

      toast.success(`Candidate ${statusLabels[newStatus]}!`);
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

  const pendingCount = stats?.pending || 0;
  const likedCount = stats?.liked || 0;
  const superLikedCount = stats?.super_liked || 0;
  const passedCount = stats?.passed || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/hiring')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            {job.company && (
              <p className="text-sm text-muted-foreground">{job.company}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{job.total_matches}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">{likedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{superLikedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{passedCount}</span>
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
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Pending Matches</h3>
                <p className="text-muted-foreground">
                  All candidates have been reviewed!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="liked" className="mt-8">
          {matches && matches.length > 0 ? (
            <RecruiterMatchList matches={matches as CandidateMatch[]} />
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Liked Candidates Yet</h3>
              <p className="text-muted-foreground">
                Candidates you like will appear here.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="super_liked" className="mt-8">
          {matches && matches.length > 0 ? (
            <RecruiterMatchList matches={matches as CandidateMatch[]} />
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Super Liked Candidates Yet</h3>
              <p className="text-muted-foreground">
                Your top candidates will appear here.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="passed" className="mt-8">
          {matches && matches.length > 0 ? (
            <RecruiterMatchList matches={matches as CandidateMatch[]} />
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Passed Candidates</h3>
              <p className="text-muted-foreground">
                Candidates you pass on will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

