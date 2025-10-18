"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/job-card";
import { RecruiterJobSelector } from "@/components/recruiter-job-selector";
import { Plus, Briefcase } from "lucide-react";
import { JobPosting } from "@/types/recruiter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job postings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hiring Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your job postings and find the perfect candidates
          </p>
        </div>

        {/* Create New Job Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
            <DialogHeader>
              <DialogTitle>Create Job Posting</DialogTitle>
              <DialogDescription>
                Paste your job description and we'll automatically extract requirements and find matching candidates.
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
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Job Postings Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first job posting to start finding and matching with top candidates.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Your First Job
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
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
