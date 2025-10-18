"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  MapPin, 
  Building2, 
  DollarSign, 
  ExternalLink,
  Loader2,
  Sparkles,
  Briefcase,
  Clock,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salaryRange?: { min: number; max: number; currency: string };
  jobType: string;
  experienceLevel: string;
  skills: string[];
  remote: boolean;
  hybrid: boolean;
  relevanceScore: number;
  publishedDate: string;
}

interface SmartJobSearchProps {
  userProfile?: {
    skills: string[];
    experienceLevel: string;
    location?: string;
    remotePreference?: string;
  };
}

export function SmartJobSearch({ userProfile }: SmartJobSearchProps) {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error("Please enter a job search query");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/job-search-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query.trim(),
          userProfile,
          conversationHistory: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      
      if (data.jobs?.length > 0) {
        toast.success(`Found ${data.jobs.length} relevant jobs!`);
      } else {
        toast.error("No jobs found. Try adjusting your search terms.");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search jobs. Please try again.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, userProfile]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const formatSalary = (salaryRange: { min: number; max: number; currency: string }) => {
    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}k`;
      }
      return `$${num.toLocaleString()}`;
    };
    return `${formatNumber(salaryRange.min)} - ${formatNumber(salaryRange.max)}`;
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    if (score >= 0.6) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const SkeletonCard = () => (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Search Interface */}
      <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  AI Job Search
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Powered by your portfolio • Real-time matching
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                What kind of job are you looking for?
              </label>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Full stack engineer jobs in Singapore with React and Node.js experience, remote friendly startups, senior frontend developer positions..."
                className="min-h-[120px] resize-y text-base leading-relaxed"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">Ctrl+Enter</kbd> to search
                </p>
                <Button 
                  onClick={handleSearch} 
                  disabled={!query.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Jobs
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick suggestions */}
            {!hasSearched && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick examples:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Senior React developer remote jobs",
                    "Full stack engineer Singapore fintech",
                    "Python backend developer startup equity",
                    "Frontend lead roles Bay Area"
                  ].map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setQuery(example)}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isLoading ? "Searching..." : `${jobs.length} Jobs Found`}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isLoading ? "Analyzing your portfolio and preferences..." : "Sorted by relevance to your profile"}
                </p>
              </div>
            </div>
          </div>

          {/* Job Results */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            ) : jobs.length > 0 ? (
              // Actual job results
              jobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {job.title}
                          </h4>
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 mt-2">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">{job.company}</span>
                            </div>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{job.location}</span>
                            </div>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">{new Date(job.publishedDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge className={cn("font-medium", getRelevanceColor(job.relevanceScore))}>
                            {Math.round(job.relevanceScore * 100)}% match
                          </Badge>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            asChild
                          >
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Apply
                            </a>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {job.description}
                      </p>
                      
                      {/* Job Details */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="h-7">
                          <Award className="w-3 h-3 mr-1" />
                          {job.experienceLevel}
                        </Badge>
                        <Badge variant="outline" className="h-7">
                          {job.jobType}
                        </Badge>
                        {job.remote && (
                          <Badge variant="outline" className="h-7 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                            Remote
                          </Badge>
                        )}
                        {job.hybrid && (
                          <Badge variant="outline" className="h-7 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            Hybrid
                          </Badge>
                        )}
                        {job.salaryRange && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatSalary(job.salaryRange)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Skills */}
                      {job.skills.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Required Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 8).map((skill) => (
                              <Badge key={skill} variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 8 && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                +{job.skills.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No results
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your search terms or broadening your criteria.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setQuery("");
                      setHasSearched(false);
                    }}
                  >
                    Start New Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
