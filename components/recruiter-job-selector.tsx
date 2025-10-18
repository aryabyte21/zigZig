"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Briefcase, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { JobPosting } from "@/types/recruiter";
import { toast } from "sonner";

interface RecruiterJobSelectorProps {
  jobs: JobPosting[];
  selectedJobId: string | null;
  onJobSelect: (jobId: string) => void;
  onJobCreated: (job: JobPosting) => void;
  onJobDeleted?: (jobId: string) => void;
  isCreateOnly?: boolean; // When true, only show create form
}

export function RecruiterJobSelector({
  jobs,
  selectedJobId,
  onJobSelect,
  onJobCreated,
  onJobDeleted,
  isCreateOnly = false,
}: RecruiterJobSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
  });

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const handleCreateJob = async () => {
    if (!formData.description.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setIsProcessing(true);

    try {
      // Parse job description
      const parseResponse = await fetch("/api/recruiter/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!parseResponse.ok) {
        throw new Error("Failed to parse job");
      }

      const { job } = await parseResponse.json();
      toast.success("Job created successfully!");

      // Compute matches
      toast.info("Finding matching candidates...");
      
      const matchResponse = await fetch("/api/recruiter/compute-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!matchResponse.ok) {
        throw new Error("Failed to compute matches");
      }

      const { total_matches } = await matchResponse.json();
      toast.success(`Found ${total_matches} matching candidates!`);

      // Reset form and close dialog
      setFormData({ title: "", company: "", description: "" });
      setIsDialogOpen(false);
      
      // Notify parent
      onJobCreated(job);
      if (!isCreateOnly) {
        onJobSelect(job.id);
      }

    } catch (error) {
      console.error("Create job error:", error);
      toast.error("Failed to create job");
    } finally {
      setIsProcessing(false);
    }
  };

  // If create only mode, just show the form
  if (isCreateOnly) {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="job-title">Job Title (Optional)</Label>
          <Input
            id="job-title"
            placeholder="e.g., Senior Full-Stack Engineer"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company Name (Optional)</Label>
          <Input
            id="company"
            placeholder="e.g., Acme Inc."
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            placeholder="Paste your full job description here..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Include details about required skills, experience level, location, and responsibilities.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleCreateJob} disabled={isProcessing} size="lg" className="w-full">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create & Find Matches
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="job-select" className="text-sm font-medium mb-2 block">
            Select Job Posting
          </Label>
          <Select value={selectedJobId || ""} onValueChange={onJobSelect}>
            <SelectTrigger id="job-select" className="w-full">
              <SelectValue placeholder="Select a job posting..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.title}</span>
                    {job.company && (
                      <span className="text-muted-foreground">• {job.company}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
              {jobs.length === 0 && (
                <SelectItem value="none" disabled>
                  No job postings yet
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Create New Job Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="mt-6">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
            <DialogHeader>
              <DialogTitle>Create Job Posting</DialogTitle>
              <DialogDescription>
                Paste your job description and we'll automatically extract requirements and find matching candidates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title (Optional)</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Senior Full-Stack Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name (Optional)</Label>
                <Input
                  id="company"
                  placeholder="e.g., Acme Inc."
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Paste your full job description here..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Include details about required skills, experience level, location, and responsibilities.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateJob} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create & Find Matches
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Job Info */}
      {selectedJob && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedJob.title}</h3>
              {selectedJob.company && (
                <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="font-medium">
                  {selectedJob.total_matches} matches
                </span>
                <span className="text-muted-foreground">
                  {selectedJob.liked_count} liked • {selectedJob.passed_count} passed
                </span>
              </div>
            </div>

            {/* Delete Job Button */}
            {onJobDeleted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{selectedJob.title}"? This will also delete all associated matches and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onJobDeleted(selectedJob.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


