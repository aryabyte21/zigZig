"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ExternalLink, MapPin } from "lucide-react";

export interface Job {
  title: string;
  company: string;
  location?: string;
  url: string;
  snippet?: string;
  matchScore?: number;
}

interface JobMatchWidgetProps {
  jobs: Job[];
  onShareJob?: (job: Job) => void;
}

export function JobMatchWidget({ jobs, onShareJob }: JobMatchWidgetProps) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <Card className="my-4 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-blue-900 dark:text-blue-100">
            Relevant Opportunities
          </span>
          <Badge variant="secondary" className="ml-auto">
            {jobs.length} {jobs.length === 1 ? "match" : "matches"}
          </Badge>
        </div>

        <div className="space-y-2">
          {jobs.map((job, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-3 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              onClick={() => {
                if (onShareJob) {
                  onShareJob(job);
                } else {
                  window.open(job.url, "_blank");
                }
              }}
            >
              <div className="flex flex-col items-start text-left flex-1">
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-sm">{job.title}</span>
                  {job.matchScore && job.matchScore > 0.7 && (
                    <Badge variant="default" className="text-xs">
                      High Match
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {job.company}
                </span>
                {job.location && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                {job.snippet && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {job.snippet}
                  </p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
            </Button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Jobs matched based on portfolio skills and conversation context
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

