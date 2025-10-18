"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Briefcase, Calendar, Users, Heart, Star, Trash2, ArrowRight } from "lucide-react";
import { JobPosting } from "@/types/recruiter";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface JobCardProps {
  job: JobPosting;
  onDelete: (jobId: string) => void;
}

export function JobCard({ job, onDelete }: JobCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/hiring/${job.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
      <div onClick={handleClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-lg truncate">{job.title}</h3>
              </div>
              {job.company && (
                <p className="text-sm text-muted-foreground">{job.company}</p>
              )}
            </div>
            
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{job.title}"? This will also delete all associated matches and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(job.id);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{job.total_matches}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold text-green-600">{job.liked_count}</div>
              <div className="text-xs text-muted-foreground">Liked</div>
            </div>
            <div className="text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-bold text-blue-600">
                {job.liked_count > 0 ? Math.round((job.liked_count / job.total_matches) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Match Rate</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {format(new Date(job.created_at), "MMM d, yyyy")}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {job.status}
            </Badge>
          </div>

          {/* Hover Arrow */}
          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium text-primary flex items-center gap-1">
              View Candidates
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

