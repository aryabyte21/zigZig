"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, MapPin, Calendar, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Job {
  title: string;
  url: string;
  publishedDate?: string;
  text: string;
  score?: number;
  company: string;
  location: string;
}

export function JobSearch() {
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const searchJobs = async () => {
    if (skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills, location }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const { jobs } = await response.json();
      setJobs(jobs);
      toast.success(`Found ${jobs.length} job opportunities!`);
    } catch (error) {
      console.error("Job search error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search jobs");
    } finally {
      setIsSearching(false);
    }
  };

  const suggestedSkills = [
    "React", "Node.js", "Python", "JavaScript", "TypeScript", 
    "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AI-Powered Job Search
          </CardTitle>
          <CardDescription>
            Find relevant job opportunities using AI semantic search powered by Exa.ai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skills Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Your Skills</label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g., React, Python, AWS)"
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={addSkill} disabled={!newSkill.trim()} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Current Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill} <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Skills */}
            {skills.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Suggested skills:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill) => (
                    <Badge 
                      key={skill}
                      variant="outline" 
                      className="cursor-pointer hover:bg-secondary transition-colors"
                      onClick={() => setSkills([skill])}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Location (Optional)</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA or Remote"
            />
          </div>

          <Button 
            onClick={searchJobs} 
            disabled={isSearching || skills.length === 0} 
            className="w-full"
            size="lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching with AI...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Job Results */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Job Opportunities</h3>
            <Badge variant="secondary">{jobs.length} results</Badge>
          </div>
          
          <div className="grid gap-4">
            {jobs.map((job, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 overflow-hidden space-y-3">
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-lg mb-1 truncate">{job.title}</h4>
                        <p className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">{job.company}</p>
                      </div>
                      
                      <div className="overflow-hidden">
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words overflow-wrap-anywhere">
                          {job.text.length > 300 ? `${job.text.substring(0, 300)}...` : job.text}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground overflow-hidden">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]" title={job.location}>{job.location}</span>
                        </div>
                        {job.publishedDate && (
                          <div className="flex items-center gap-1 min-w-0">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{new Date(job.publishedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {job.score && (
                          <Badge variant="outline" className="text-xs flex-shrink-0 whitespace-nowrap">
                            {Math.round(job.score * 100)}% match
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button asChild size="sm" className="shrink-0">
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Apply
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && jobs.length === 0 && skills.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Ready to find your next opportunity?</h3>
            <p className="text-muted-foreground mb-4">
              Click "Search Jobs" to find positions that match your skills using AI-powered semantic search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
