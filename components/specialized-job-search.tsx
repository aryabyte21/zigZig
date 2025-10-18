"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, ExternalLink, MapPin, Calendar, Loader2, Plus, X, Star, 
  DollarSign, Building, Clock, Target, TrendingUp, Users, Globe,
  Briefcase, Award, Heart, Share2, Eye, Zap, Flag
} from "lucide-react";
import { toast } from "sonner";

interface SpecializedJob {
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
  searchSource: string;
  avgRelevanceScore: number;
  topCompanies: string[];
  skillDemand: Record<string, number>;
  locationDistribution: Record<string, number>;
  remotePercentage: number;
}

export function SpecializedJobSearch() {
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [searchType, setSearchType] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<SpecializedJob[]>([]);
  const [insights, setInsights] = useState<SearchInsights | null>(null);
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

  const searchSpecializedJobs = async () => {
    if (skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    if (!searchType) {
      toast.error("Please select a search type");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/search-specialized-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills, searchType, location }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const { jobs, insights: searchInsights, searchSource } = await response.json();
      setJobs(jobs);
      setInsights(searchInsights);
      toast.success(`Found ${jobs.length} jobs from ${searchSource}!`);
    } catch (error) {
      console.error("Specialized job search error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search jobs");
    } finally {
      setIsSearching(false);
    }
  };

  const suggestedSkills = [
    "React", "Node.js", "Python", "JavaScript", "TypeScript", "Go", "Java", "C++",
    "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis",
    "Machine Learning", "Data Science", "DevOps", "Frontend", "Backend", "Full Stack"
  ];

  const searchTypes = [
    {
      id: 'japan',
      name: 'Japan 🇯🇵',
      description: 'Tokyo Dev, Japan Dev, GitHub Jobs',
      icon: <Flag className="h-4 w-4" />,
      color: 'bg-red-50 border-red-200 text-red-800'
    },
    {
      id: 'europe',
      name: 'Europe 🇪🇺',
      description: 'Landing.jobs, Arbeitnow, Relocate.me',
      icon: <Globe className="h-4 w-4" />,
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'hackernews',
      name: 'Hacker News 🟠',
      description: 'Who\'s Hiring threads, visa sponsorship',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    {
      id: 'remote',
      name: 'Remote Work 🌍',
      description: 'RemoteOK, We Work Remotely, Remote.co',
      icon: <Globe className="h-4 w-4" />,
      color: 'bg-green-50 border-green-200 text-green-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Specialized Job Search</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search unique job boards and international platforms for opportunities that traditional job sites miss.
        </p>
      </div>

      {/* Main Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Jobs on Specialized Platforms
          </CardTitle>
          <CardDescription>
            Access unique job boards and international platforms for better opportunities
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
                  {suggestedSkills.slice(0, 8).map((skill) => (
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

          {/* Search Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Search Platform</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchTypes.map((type) => (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    searchType === type.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSearchType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{type.name}</h4>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      {searchType === type.id && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Location Input (for Japan and Europe) */}
          {(searchType === 'japan' || searchType === 'europe') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Location (Optional)</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={searchType === 'japan' ? 'e.g., Tokyo, Osaka' : 'e.g., Berlin, Amsterdam, London'}
              />
            </div>
          )}

          <Button 
            onClick={searchSpecializedJobs} 
            disabled={isSearching || skills.length === 0 || !searchType} 
            className="w-full"
            size="lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching specialized platforms...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Specialized Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Insights */}
      {insights && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <TrendingUp className="h-5 w-5" />
              Search Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {insights.totalJobs}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(insights.avgRelevanceScore * 100)}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Avg Match</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(insights.remotePercentage)}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Remote Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {insights.searchSource}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Source</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Results */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Specialized Job Opportunities</h3>
            <Badge variant="secondary">{jobs.length} results</Badge>
          </div>
          
          <div className="space-y-4">
            {jobs.map((job) => (
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
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 flex-shrink-0 whitespace-nowrap">
                            <Star className="h-3 w-3 mr-1" />
                            Specialized
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm">
                          <Heart className="h-4 w-4" />
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
      {!isSearching && jobs.length === 0 && skills.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Ready to explore specialized platforms?</h3>
            <p className="text-muted-foreground mb-4">
              Select a platform and search for unique opportunities that traditional job sites miss.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
