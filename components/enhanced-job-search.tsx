"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, ExternalLink, MapPin, Calendar, Loader2, Plus, X, Star, 
  DollarSign, Building, Clock, TrendingUp, Target,
  Briefcase, Award, Heart, Share2, Eye
} from "lucide-react";
import { toast } from "sonner";

interface EnhancedJob {
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
}

interface SearchInsights {
  totalJobs: number;
  avgRelevanceScore: number;
  topCompanies: string[];
  skillDemand: Record<string, number>;
  locationDistribution: Record<string, number>;
  salaryInsights: {
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null;
  remotePercentage: number;
}

interface SearchState {
  skills: string[];
  location: string;
  experienceLevel: string;
  jobType: string;
  companySize: string;
  remote: boolean;
  salaryRange: [number, number];
  industry: string[];
  newSkill: string;
  showAdvanced: boolean;
  savedJobs: string[];
  sortBy: 'relevance' | 'salary' | 'date';
}

interface ResultsState {
  isSearching: boolean;
  jobs: EnhancedJob[];
  insights: SearchInsights | null;
}

export function EnhancedJobSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    skills: [],
    location: "",
    experienceLevel: "",
    jobType: "",
    companySize: "",
    remote: false,
    salaryRange: [50000, 200000],
    industry: [],
    newSkill: "",
    showAdvanced: false,
    savedJobs: [],
    sortBy: 'relevance'
  });

  const [resultsState, setResultsState] = useState<ResultsState>({
    isSearching: false,
    jobs: [],
    insights: null
  });

  const addSkill = useCallback(() => {
    if (searchState.newSkill.trim() && !searchState.skills.includes(searchState.newSkill.trim())) {
      setSearchState(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ""
      }));
    }
  }, [searchState.newSkill, searchState.skills]);

  const removeSkill = useCallback((skill: string) => {
    setSearchState(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const searchJobs = useCallback(async () => {
    if (searchState.skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    setResultsState(prev => ({ ...prev, isSearching: true }));
    try {
      const searchParams = {
        skills: searchState.skills,
        location: searchState.location,
        experienceLevel: searchState.experienceLevel || undefined,
        jobType: searchState.jobType || undefined,
        companySize: searchState.companySize || undefined,
        remote: searchState.remote,
        salaryRange: { min: searchState.salaryRange[0], max: searchState.salaryRange[1] },
        industry: searchState.industry.length > 0 ? searchState.industry : undefined,
      };

      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const { jobs, insights: searchInsights } = await response.json();
      setResultsState(prev => ({
        ...prev,
        jobs,
        insights: searchInsights,
        isSearching: false
      }));
      toast.success(`Found ${jobs.length} job opportunities!`);
    } catch (error) {
      console.error("Job search error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search jobs");
      setResultsState(prev => ({ ...prev, isSearching: false }));
    }
  }, [searchState]);

  const toggleSavedJob = useCallback((jobId: string) => {
    setSearchState(prev => ({
      ...prev,
      savedJobs: prev.savedJobs.includes(jobId) 
        ? prev.savedJobs.filter(id => id !== jobId)
        : [...prev.savedJobs, jobId]
    }));
  }, []);

  const sortJobs = (jobs: EnhancedJob[], sortBy: string) => {
    switch (sortBy) {
      case 'salary':
        return [...jobs].sort((a, b) => {
          const aSalary = a.salaryRange ? (a.salaryRange.min + a.salaryRange.max) / 2 : 0;
          const bSalary = b.salaryRange ? (b.salaryRange.min + b.salaryRange.max) / 2 : 0;
          return bSalary - aSalary;
        });
      case 'date':
        return [...jobs].sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      case 'relevance':
      default:
        return [...jobs].sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  };

  const suggestedSkills = [
    "React", "Node.js", "Python", "JavaScript", "TypeScript", "Go", "Java", "C++",
    "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis",
    "Machine Learning", "Data Science", "DevOps", "Frontend", "Backend", "Full Stack"
  ];

  const industries = [
    "Technology", "Finance", "Healthcare", "E-commerce", "Education", 
    "Gaming", "AI/ML", "Cybersecurity", "Blockchain", "SaaS"
  ];

  return (
    <div className="space-y-6">
      {/* Main Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AI-Powered Job Search
          </CardTitle>
          <CardDescription>
            Find your perfect job with intelligent matching powered by Exa.ai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Search</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              {/* Skills Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Your Skills</label>
                <div className="flex gap-2">
                  <Input
                    value={searchState.newSkill}
                    onChange={(e) => setSearchState(prev => ({ ...prev, newSkill: e.target.value }))}
                    placeholder="Add a skill (e.g., React, Python, AWS)"
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={addSkill} disabled={!searchState.newSkill.trim()} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Current Skills */}
                {searchState.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {searchState.skills.map((skill: string) => (
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
                {searchState.skills.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Suggested skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.slice(0, 8).map((skill) => (
                        <Badge 
                          key={skill}
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary transition-colors"
                          onClick={() => setSearchState(prev => ({ ...prev, skills: [skill] }))}
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
                  value={searchState.location}
                  onChange={(e) => setSearchState(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>

              <Button 
                onClick={searchJobs} 
                disabled={resultsState.isSearching || searchState.skills.length === 0} 
                className="w-full"
                size="lg"
              >
                {resultsState.isSearching ? (
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
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Experience Level</label>
                  <Select value={searchState.experienceLevel} onValueChange={(value) => setSearchState(prev => ({ ...prev, experienceLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Type</label>
                  <Select value={searchState.jobType} onValueChange={(value) => setSearchState(prev => ({ ...prev, jobType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Size</label>
                  <Select value={searchState.companySize} onValueChange={(value) => setSearchState(prev => ({ ...prev, companySize: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-50 employees)</SelectItem>
                      <SelectItem value="mid-size">Mid-size (50-500 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (500+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Salary Range</label>
                  <div className="space-y-2">
                    <Slider
                      value={searchState.salaryRange}
                      onValueChange={(value) => setSearchState(prev => ({ ...prev, salaryRange: value as [number, number] }))}
                      max={300000}
                      min={30000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${searchState.salaryRange[0].toLocaleString()}</span>
                      <span>${searchState.salaryRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remote Work */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remote" 
                  checked={searchState.remote} 
                  onCheckedChange={(checked) => setSearchState(prev => ({ ...prev, remote: checked as boolean }))}
                />
                <label htmlFor="remote" className="text-sm font-medium">
                  Remote work only
                </label>
              </div>

              {/* Industry Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Industries (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <Badge
                      key={ind}
                      variant={searchState.industry.includes(ind) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSearchState(prev => ({
                          ...prev,
                          industry: prev.industry.includes(ind) 
                            ? prev.industry.filter((i: string) => i !== ind)
                            : [...prev.industry, ind]
                        }));
                      }}
                    >
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={searchJobs} 
                disabled={resultsState.isSearching || searchState.skills.length === 0} 
                className="w-full"
                size="lg"
              >
                {resultsState.isSearching ? (
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Insights */}
      {resultsState.insights && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <TrendingUp className="h-5 w-5" />
              Search Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {resultsState.insights.totalJobs}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(resultsState.insights.avgRelevanceScore * 100)}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Avg Match</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(resultsState.insights.remotePercentage)}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Remote Jobs</div>
              </div>
            </div>
            
            {resultsState.insights.salaryInsights && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Salary Insights</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">${resultsState.insights.salaryInsights.min.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Min Salary</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">${Math.round(resultsState.insights.salaryInsights.avg).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Avg Salary</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">${resultsState.insights.salaryInsights.max.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Max Salary</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Results */}
      {resultsState.jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Job Opportunities</h3>
            <div className="flex items-center gap-4">
              <Select value={searchState.sortBy} onValueChange={(value: any) => setSearchState(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">{resultsState.jobs.length} results</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            {sortJobs(resultsState.jobs, searchState.sortBy).map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header Section */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h4 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSavedJob(job.id)}
                          className={searchState.savedJobs.includes(job.id) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 ${searchState.savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="overflow-hidden">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words overflow-wrap-anywhere">
                        {job.description.length > 200 ? `${job.description.substring(0, 200)}...` : job.description}
                      </p>
                    </div>
                    
                    {/* Skills */}
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
                    
                    {/* Job Details - Responsive Grid */}
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

                    {/* Benefits */}
                    {job.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.benefits.slice(0, 4).map((benefit) => (
                          <Badge key={benefit} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Bottom Section - Match Score and Actions */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          <span className="text-xs font-medium text-blue-600">
                            {Math.round(job.relevanceScore * 100)}% match
                          </span>
                        </div>
                        <Progress value={job.relevanceScore * 100} className="w-20 h-2 flex-shrink-0" />
                        {job.applicationDeadline && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="hidden sm:inline">Apply by</span>
                            <span className="truncate">{job.applicationDeadline}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!resultsState.isSearching && resultsState.jobs.length === 0 && searchState.skills.length > 0 && (
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
