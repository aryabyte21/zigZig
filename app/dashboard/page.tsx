import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { JobRecommendations } from "@/components/job-recommendations";
import { PortfolioList } from "@/components/portfolio-list";
import { ChatWidget } from "@/components/chat-widget";
import Link from "next/link";
import { User, FileText, ExternalLink, Plus, Sparkles, Search, Target, MessageSquare } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .single();

  // Get user's portfolios (ordered by creation date, newest first)
  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("*")
    .order("created_at", { ascending: false });

  // Get user's resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .order("updated_at", { ascending: false });

  // Check if user needs onboarding
  const needsOnboarding = !profile?.onboarding_completed && (!portfolios || portfolios.length === 0);

  if (needsOnboarding) {
    return (
      <div className="space-y-8">
        {/* Onboarding Welcome */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="text-black dark:text-white">
              zigZig
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let's create your AI-powered portfolio in just a few minutes. 
            We'll help you build something amazing!
          </p>
        </div>

        {/* Onboarding CTA */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
                <p className="text-muted-foreground">
                  Upload your resume, add your links, and let AI create a stunning portfolio for you.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit mx-auto">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">Upload Resume</p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-fit mx-auto">
                    <ExternalLink className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">Add Links</p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit mx-auto">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">AI Magic</p>
                </div>
              </div>

              <Button asChild size="lg" className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100">
                <Link href="/dashboard/onboarding">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Building My Portfolio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Manage your career profile and showcase your work.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button asChild size="lg" className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100">
            <Link href="/dashboard/onboarding">
              <Sparkles className="mr-2 h-5 w-5" />
              Create New Portfolio
            </Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolios?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {portfolios?.filter(p => p.is_published).length || 0} published
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumes?.filter(r => r.is_public).length || 0} public
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Features</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs text-muted-foreground">
              Avatar generator available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Portfolios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Your Portfolios</h2>
          <Button asChild>
            <Link href="/dashboard/portfolio">
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Link>
          </Button>
        </div>

        <PortfolioList portfolios={portfolios || []} />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-black dark:border-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-black dark:bg-white rounded-lg">
                  <Sparkles className="h-6 w-6 text-white dark:text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">AI Portfolio Generator</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a stunning portfolio with AI in minutes
                  </p>
                </div>
                <Button asChild className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100">
                  <Link href="/dashboard/onboarding">Create</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Update Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep your profile information current
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/profile">Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">AI Avatar Generator</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a Studio Ghibli style avatar
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/profile">Generate</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">AI Job Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Find opportunities with semantic search
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/jobs">Search</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-500 dark:border-blue-400">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">AI Job Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with AI to find your perfect job
                  </p>
                </div>
                <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Link href="/dashboard/jobs-chat">Start Chat</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Job Recommendations</h2>
            <p className="text-muted-foreground">
              AI-powered job matches based on your profile and skills
            </p>
          </div>
        </div>
        <JobRecommendations />
      </div>

      {/* AI Chat Widget */}
      <ChatWidget 
        userProfile={{
          skills: profile?.skills || [],
          experienceLevel: profile?.experience_level || 'mid',
          location: profile?.location,
          remotePreference: profile?.remote_preference || 'flexible',
        }}
      />
    </div>
  );
}
