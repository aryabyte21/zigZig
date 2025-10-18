"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/job-card";
import { RecruiterJobSelector } from "@/components/recruiter-job-selector";
import { Plus, Briefcase } from "lucide-react";
import { JobPosting } from "@/types/recruiter";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Wrapper component to fetch stats from Convex for each job
function JobCardWithStats({ job, onDelete }: { job: JobPosting; onDelete: (jobId: string) => void }) {
  const stats = useQuery(api.recruiter.getRecruiterStats, { jobId: job.id });
  
  // Enrich job with stats from Convex
  const enrichedJob = {
    ...job,
    liked_count: stats?.liked_count || 0,
    super_liked_count: stats?.super_liked_count || 0,
  };
  
  return <JobCard job={enrichedJob} onDelete={onDelete} />;
}

export default function HiringPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('recruiter_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate jobs by ID to fix duplicate key error
      const uniqueJobs = Array.from(
        new Map((data || []).map(job => [job.id, job])).values()
      );

      setJobs(uniqueJobs);
    } catch (error) {
      console.error('Load jobs error:', error);
      toast.error("Failed to load job postings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobCreated = (job: JobPosting) => {
    // Add new job to the start of the list without reloading
    setJobs(prev => {
      // Check if job already exists
      const exists = prev.some(j => j.id === job.id);
      if (exists) return prev;
      return [job, ...prev];
    });
    setIsDialogOpen(false);
    toast.success("Job created! Click to start matching.");
  };

  const handleJobDeleted = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== jobId));
      toast.success("Job posting deleted");
    } catch (error) {
      console.error('Delete job error:', error);
      toast.error("Failed to delete job posting");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Job Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/50 rounded">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="text-center">
                      <Skeleton className="h-3.5 w-3.5 mx-auto mb-0.5" />
                      <Skeleton className="h-5 w-8 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hiring Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your job postings and find candidates
          </p>
        </div>

        {/* Create New Job Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
            <DialogHeader>
              <DialogTitle>Create Job Posting</DialogTitle>
              <DialogDescription>
                Paste your job description to extract requirements and find matching candidates.
              </DialogDescription>
            </DialogHeader>
            <RecruiterJobSelector
              jobs={jobs}
              selectedJobId={null}
              onJobSelect={() => {}}
              onJobCreated={handleJobCreated}
              onJobDeleted={handleJobDeleted}
              isCreateOnly
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No job postings</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Create your first job posting to find matching candidates
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Job
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCardWithStats
              key={job.id}
              job={job}
              onDelete={handleJobDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
