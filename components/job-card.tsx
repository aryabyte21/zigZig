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
    <Card className="hover:border-foreground/20 transition-colors cursor-pointer group">
      <div onClick={handleClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-base truncate">{job.title}</h3>
              </div>
              {job.company && (
                <p className="text-sm text-muted-foreground truncate">{job.company}</p>
              )}
            </div>
            
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete "{job.title}" and all associated matches. This cannot be undone.
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

        <CardContent className="space-y-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/50 rounded">
            <div className="text-center">
              <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
              <div className="text-base font-semibold">{job.total_matches}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <Heart className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
              <div className="text-base font-semibold">{job.liked_count}</div>
              <div className="text-xs text-muted-foreground">Liked</div>
            </div>
            <div className="text-center">
              <Star className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
              <div className="text-base font-semibold">
                {job.liked_count > 0 ? Math.round((job.liked_count / job.total_matches) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Match Rate</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(job.created_at), "MMM d, yyyy")}</span>
            </div>
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {job.status}
            </Badge>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

