import { EnhancedJobSearch } from "@/components/enhanced-job-search";
import { SpecializedJobSearch } from "@/components/specialized-job-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Search, Brain, Zap, Globe, Target } from "lucide-react";

export default function JobsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Search className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Job Search</h1>
            <p className="text-muted-foreground">
              Find your next opportunity with AI-powered semantic search
            </p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-sm">AI-Powered</h3>
                  <p className="text-xs text-muted-foreground">Semantic job matching</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-sm">Real-time</h3>
                  <p className="text-xs text-muted-foreground">Latest opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-sm">Smart Matching</h3>
                  <p className="text-xs text-muted-foreground">Relevance scoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Job Search Tabs */}
      <Tabs defaultValue="enhanced" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Enhanced Search
          </TabsTrigger>
          <TabsTrigger value="specialized" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Specialized Platforms
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedJobSearch />
        </TabsContent>
        
        <TabsContent value="specialized" className="space-y-6">
          <SpecializedJobSearch />
        </TabsContent>
      </Tabs>

      {/* How it Works */}
      <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            How AI Job Search Works
          </CardTitle>
          <CardDescription>
            Our AI-powered job search uses advanced semantic understanding to find the most relevant opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold">Add Your Skills</h4>
              <p className="text-sm text-muted-foreground">
                Input your technical skills and expertise areas
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Our AI semantically matches your skills to job descriptions
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-green-600">3</span>
              </div>
              <h4 className="font-semibold">Get Results</h4>
              <p className="text-sm text-muted-foreground">
                Receive ranked job opportunities with relevance scores
              </p>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <Badge variant="secondary" className="text-xs">
              Powered by Exa.ai • Real-time job data • Semantic search technology
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Specialized Platforms Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Specialized Job Platforms
          </CardTitle>
          <CardDescription>
            Access unique job boards and international platforms for opportunities that traditional sites miss
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-red-600">🇯🇵</span>
              </div>
              <h4 className="font-semibold text-sm">Japan Dev</h4>
              <p className="text-xs text-muted-foreground">
                Tokyo Dev, Japan Dev, GitHub Jobs
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-blue-600">🇪🇺</span>
              </div>
              <h4 className="font-semibold text-sm">Europe</h4>
              <p className="text-xs text-muted-foreground">
                Landing.jobs, Arbeitnow, Relocate.me
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-orange-600">🟠</span>
              </div>
              <h4 className="font-semibold text-sm">Hacker News</h4>
              <p className="text-xs text-muted-foreground">
                Who's Hiring threads, visa sponsorship
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit mx-auto">
                <span className="text-lg font-bold text-green-600">🌍</span>
              </div>
              <h4 className="font-semibold text-sm">Remote Work</h4>
              <p className="text-xs text-muted-foreground">
                RemoteOK, We Work Remotely, Remote.co
              </p>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <Badge variant="secondary" className="text-xs">
              Based on tech-jobs-with-relocation guide • International opportunities • Visa sponsorship
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
