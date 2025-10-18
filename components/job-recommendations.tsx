"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ExternalLink, MapPin, Calendar, Building, DollarSign, 
  Target, Star, Heart, Share2, Eye, Loader2, RefreshCw,
  Briefcase, Award, Clock, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface JobRecommendation {
  id: string;
  title: string;
  url: string;
  company: string;
  location: string;
  description: string;
  publishedDate: string;
  score: number;
  relevanceScore: number;
  salaryRange?: { min: number; max: number; currency: string };
  jobType: string;
  experienceLevel: string;
  skills: string[];
  benefits: string[];
  companySize?: string;
  companyCulture?: string;
  applicationDeadline?: string;
  remote: boolean;
  hybrid: boolean;
  recommendationReason: string;
  matchScore: number;
}

interface UserProfile {
  skills: string[];
  experienceLevel: string;
  location?: string;
  hasPortfolio: boolean;
  experienceYears: number;
}

// Cache configuration
const CACHE_KEY = 'job_recommendations_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  recommendations: JobRecommendation[];
  userProfile: UserProfile;
  timestamp: number;
}

export function JobRecommendations() {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Check if cached data is still valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Load from cache
  const loadFromCache = (): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        if (isCacheValid(data.timestamp)) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  };

  // Save to cache
  const saveToCache = (recommendations: JobRecommendation[], userProfile: UserProfile): void => {
    try {
      const cacheData: CachedData = {
        recommendations,
        userProfile,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/job-recommendations");
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Please complete your profile and create a portfolio to get job recommendations");
          return;
        }
        throw new Error("Failed to fetch recommendations");
      }

      const { recommendations, userProfile } = await response.json();
      setRecommendations(recommendations);
      setUserProfile(userProfile);
      setLastFetch(Date.now());
      
      // Save to cache
      if (recommendations.length > 0 && userProfile) {
        saveToCache(recommendations, userProfile);
      }
      
      if (recommendations.length === 0) {
        toast.info("No job recommendations found. Try updating your skills or location preferences.");
      } else {
        toast.success(`Found ${recommendations.length} personalized job recommendations!`);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to load job recommendations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try to load from cache first
    const cachedData = loadFromCache();
    if (cachedData) {
      setRecommendations(cachedData.recommendations);
      setUserProfile(cachedData.userProfile);
      setLastFetch(cachedData.timestamp);
      setIsLoading(false);
    } else {
      fetchRecommendations();
    }
  }, [fetchRecommendations]);

  const toggleSavedJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Finding your perfect matches...</h3>
          <p className="text-muted-foreground">
            Our AI is analyzing your profile to find the best job opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile?.hasPortfolio) {
    return (
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Complete Your Profile</h3>
          <p className="text-muted-foreground mb-4">
            Create a portfolio to get personalized job recommendations based on your skills and experience.
          </p>
          <Button asChild>
            <a href="/dashboard/onboarding">Create Portfolio</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No recommendations found</h3>
          <p className="text-muted-foreground mb-4">
            Try updating your skills or location preferences to get better matches.
          </p>
          <Button onClick={fetchRecommendations} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          <p className="text-muted-foreground">
            {recommendations.length} jobs matched to your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch > 0 && (
            <div className="text-xs text-muted-foreground">
              {isCacheValid(lastFetch) ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Cached ({Math.round((CACHE_DURATION - (Date.now() - lastFetch)) / 1000 / 60)}m left)
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Cache expired
                </span>
              )}
            </div>
          )}
          <Button 
            onClick={fetchRecommendations} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Profile Summary */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userProfile.skills.length}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userProfile.experienceYears}+
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Years Exp</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userProfile.experienceLevel}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Level</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {userProfile.location || 'Any Location'}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Preferred Location</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Recommendations */}
      <div className="grid gap-4">
        {recommendations.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 overflow-hidden space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="font-semibold text-lg mb-1 group-hover:text-green-600 transition-colors truncate">
                        {job.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1 min-w-0 max-w-full overflow-hidden">
                          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-muted-foreground truncate max-w-[200px]">{job.company}</span>
                        </div>
                        {job.companySize && (
                          <Badge variant="outline" className="text-xs flex-shrink-0 whitespace-nowrap">
                            {job.companySize}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 flex-shrink-0 whitespace-nowrap">
                          <Star className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSavedJob(job.id)}
                        className={savedJobs.includes(job.id) ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words overflow-wrap-anywhere">
                      {job.description.length > 200 ? `${job.description.substring(0, 200)}...` : job.description}
                    </p>
                  </div>

                  {/* Recommendation Reason */}
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Why this job matches you:
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm text-green-700 dark:text-green-300 break-words overflow-wrap-anywhere">
                        {job.recommendationReason.length > 150 ? `${job.recommendationReason.substring(0, 150)}...` : job.recommendationReason}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-xs text-muted-foreground overflow-hidden">
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className={`truncate max-w-[120px] ${job.remote ? "text-green-600 font-medium" : ""}`} title={`${job.location}${job.remote ? " (Remote)" : ""}${job.hybrid ? " (Hybrid)" : ""}`}>
                        {job.location}
                        {job.remote && " (Remote)"}
                        {job.hybrid && " (Hybrid)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <Briefcase className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[100px]" title={job.jobType}>{job.jobType}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <Award className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[100px]" title={job.experienceLevel}>{job.experienceLevel}</span>
                    </div>
                    {job.salaryRange && (
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <DollarSign className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]" title={`$${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}`}>
                          ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[100px]" title={new Date(job.publishedDate).toLocaleDateString()}>
                        {new Date(job.publishedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {job.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.benefits.slice(0, 4).map((benefit) => (
                        <Badge key={benefit} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-green-600">
                          {Math.round(job.matchScore * 100)}% match
                        </span>
                      </div>
                      <Progress value={job.matchScore * 100} className="w-20 h-2 flex-shrink-0" />
                      {job.applicationDeadline && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="hidden sm:inline">Apply by</span>
                          <span className="truncate">{job.applicationDeadline}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Apply Now</span>
                          <span className="sm:hidden">Apply</span>
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
