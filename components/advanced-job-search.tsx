"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ExternalLink, MapPin, Calendar, Building, DollarSign, 
  Target, Star, Heart, Share2, Eye, Loader2, RefreshCw,
  Briefcase, Award, Clock, TrendingUp, Zap, Brain, Search,
  BarChart3, Lightbulb, Sparkles, Filter, Settings
} from "lucide-react";
import { toast } from "sonner";

interface AdvancedJobResult {
  id: string;
  title: string;
  url: string;
  company: string;
  location: string;
  description: string;
  publishedDate: string;
  relevanceScore: number;
  matchScore: number;
  salaryRange?: { min: number; max: number; currency: string };
  jobType: string;
  experienceLevel: string;
  skills: string[];
  benefits: string[];
  companySize?: string;
  applicationDeadline?: string;
  remote: boolean;
  hybrid: boolean;
  recommendationReason: string;
  searchStrategy: string;
  highlights?: string[];
  summary?: string;
  domain: string;
}

interface SearchMeta {
  strategiesUsed: string[];
  totalResults: number;
  avgRelevanceScore: number;
  portfolioAnalysis: {
    skillsCount: number;
    experienceLevel: string;
    competitiveLevel: string;
    rarityScore: number;
    marketDemandScore: number;
  };
}

interface SearchConfig {
  searchStrategies: string[];
  includeFreshJobs: boolean;
  includeRemoteJobs: boolean;
  maxResults: number;
  extractFullContent: boolean;
  customFilters: any;
}

export function AdvancedJobSearch() {
  const [jobs, setJobs] = useState<AdvancedJobResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    searchStrategies: ['neural', 'keyword', 'hybrid'],
    includeFreshJobs: true,
    includeRemoteJobs: true,
    maxResults: 50,
    extractFullContent: true,
    customFilters: {}
  });

  const executeAdvancedSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/advanced-job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchConfig),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please log in to use advanced job search");
          return;
        }
        if (response.status === 404) {
          toast.error("Please create and activate a portfolio to use advanced job search");
          return;
        }
        throw new Error("Search failed");
      }

      const data = await response.json();
      setJobs(data.jobs);
      setSearchMeta(data.searchMeta);
      
      toast.success(`Found ${data.jobs.length} advanced job matches using ${data.searchMeta.strategiesUsed.join(', ')} strategies!`);
    } catch (error) {
      console.error("Advanced search error:", error);
      toast.error("Failed to execute advanced job search");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSavedJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const toggleStrategy = (strategy: string) => {
    setSearchConfig(prev => ({
      ...prev,
      searchStrategies: prev.searchStrategies.includes(strategy)
        ? prev.searchStrategies.filter(s => s !== strategy)
        : [...prev.searchStrategies, strategy]
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 animate-pulse text-blue-600 mr-2" />
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="font-semibold mb-2">Advanced AI Job Search in Progress...</h3>
          <p className="text-muted-foreground mb-4">
            Using multiple AI strategies to find your perfect matches
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Neural semantic search
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Keyword precision matching
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Hybrid intelligence analysis
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Search Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <CardTitle>Advanced AI Job Search</CardTitle>
          </div>
          <CardDescription>
            Leverage multiple AI strategies and comprehensive portfolio analysis for intelligent job matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="strategies" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="strategies">Search Strategies</TabsTrigger>
              <TabsTrigger value="filters">Smart Filters</TabsTrigger>
              <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="strategies" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer transition-all ${searchConfig.searchStrategies.includes('neural') ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}`} 
                      onClick={() => toggleStrategy('neural')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Neural Search</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Semantic understanding of career intent and professional context
                    </p>
                    <Badge variant={searchConfig.searchStrategies.includes('neural') ? 'default' : 'outline'} className="mt-2">
                      {searchConfig.searchStrategies.includes('neural') ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer transition-all ${searchConfig.searchStrategies.includes('keyword') ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}
                      onClick={() => toggleStrategy('keyword')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Keyword Search</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Precise matching for specific technical skills and requirements
                    </p>
                    <Badge variant={searchConfig.searchStrategies.includes('keyword') ? 'default' : 'outline'} className="mt-2">
                      {searchConfig.searchStrategies.includes('keyword') ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer transition-all ${searchConfig.searchStrategies.includes('hybrid') ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20' : ''}`}
                      onClick={() => toggleStrategy('hybrid')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">Hybrid Intelligence</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Multi-query approach targeting different job categories and contexts
                    </p>
                    <Badge variant={searchConfig.searchStrategies.includes('hybrid') ? 'default' : 'outline'} className="mt-2">
                      {searchConfig.searchStrategies.includes('hybrid') ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="fresh-jobs">Fresh Job Postings</Label>
                    <p className="text-sm text-muted-foreground">Only jobs posted in the last 30 days</p>
                  </div>
                  <Switch
                    id="fresh-jobs"
                    checked={searchConfig.includeFreshJobs}
                    onCheckedChange={(checked) => setSearchConfig(prev => ({ ...prev, includeFreshJobs: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remote-jobs">Include Remote Jobs</Label>
                    <p className="text-sm text-muted-foreground">Include remote and distributed positions</p>
                  </div>
                  <Switch
                    id="remote-jobs"
                    checked={searchConfig.includeRemoteJobs}
                    onCheckedChange={(checked) => setSearchConfig(prev => ({ ...prev, includeRemoteJobs: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="full-content">Full Content Extraction</Label>
                    <p className="text-sm text-muted-foreground">Extract complete job descriptions and highlights</p>
                  </div>
                  <Switch
                    id="full-content"
                    checked={searchConfig.extractFullContent}
                    onCheckedChange={(checked) => setSearchConfig(prev => ({ ...prev, extractFullContent: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="max-results">Maximum Results: {searchConfig.maxResults}</Label>
                  <input
                    type="range"
                    id="max-results"
                    min="10"
                    max="100"
                    step="10"
                    value={searchConfig.maxResults}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                    className="w-full mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {searchConfig.searchStrategies.length} strategies selected
            </div>
            <Button 
              onClick={executeAdvancedSearch} 
              disabled={searchConfig.searchStrategies.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Zap className="mr-2 h-4 w-4" />
              Execute Advanced Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Analytics */}
      {searchMeta && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {searchMeta.totalResults}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Total Results</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {Math.round(searchMeta.avgRelevanceScore * 100)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Avg Relevance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {searchMeta.portfolioAnalysis.skillsCount}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Skills Analyzed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {Math.round(searchMeta.portfolioAnalysis.rarityScore * 100)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Rarity Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {searchMeta.portfolioAnalysis.competitiveLevel}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Level</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Results */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Advanced AI Job Matches</h2>
            <Badge variant="outline" className="px-3 py-1">
              {jobs.length} intelligent matches found
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
                job.searchStrategy === 'neural' ? 'border-l-blue-500' :
                job.searchStrategy === 'keyword' ? 'border-l-green-500' :
                'border-l-purple-500'
              } overflow-hidden`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 overflow-hidden space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg truncate">
                              {job.title}
                            </h4>
                            <Badge variant="secondary" className={`text-xs flex-shrink-0 ${
                              job.searchStrategy === 'neural' ? 'bg-blue-100 text-blue-800' :
                              job.searchStrategy === 'keyword' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {job.searchStrategy === 'neural' ? <Brain className="h-3 w-3 mr-1" /> :
                               job.searchStrategy === 'keyword' ? <Search className="h-3 w-3 mr-1" /> :
                               <Sparkles className="h-3 w-3 mr-1" />}
                              {job.searchStrategy}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-1 min-w-0 max-w-full overflow-hidden">
                              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-muted-foreground truncate max-w-[200px]">{job.company}</span>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {job.domain}
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

                      {/* Advanced Highlights */}
                      {job.highlights && job.highlights.length > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              AI Highlights:
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 break-words">
                            "{job.highlights[0].substring(0, 150)}..."
                          </p>
                        </div>
                      )}

                      {/* Recommendation Reason */}
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Why this matches you:
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm text-green-700 dark:text-green-300 break-words overflow-wrap-anywhere">
                            {job.recommendationReason}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 6).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-foreground overflow-hidden">
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className={`truncate max-w-[120px] ${job.remote ? "text-green-600 font-medium" : ""}`}>
                            {job.location}
                            {job.remote && " (Remote)"}
                            {job.hybrid && " (Hybrid)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                          <Briefcase className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{job.jobType}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                          <Award className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{job.experienceLevel}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">
                            {new Date(job.publishedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-blue-600">
                              {Math.round(job.relevanceScore * 100)}% relevance
                            </span>
                          </div>
                          <Progress value={job.relevanceScore * 100} className="w-20 h-2 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-green-600">
                              {Math.round(job.matchScore * 100)}% match
                            </span>
                          </div>
                          <Progress value={job.matchScore * 100} className="w-20 h-2 flex-shrink-0" />
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <Button asChild size="sm" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Apply Now</span>
                              <span className="sm:hidden">Apply</span>
                            </a>
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
      )}
      
      {jobs.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Ready for Advanced AI Job Search</h3>
            <p className="text-muted-foreground mb-4">
              Configure your search strategies above and click "Execute Advanced Search" to find your perfect matches.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
