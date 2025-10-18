import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Users, Brain, Palette, FileText, MessageSquare } from "lucide-react";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      {/* Main Hero Section */}
      <div className="flex flex-col gap-8 max-w-4xl text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <Badge variant="secondary" className="text-sm">
            AI-Powered Career Hub
          </Badge>
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
          Build Your{" "}
          <span className="text-black dark:text-white">
            Dream Career
          </span>{" "}
          with AI
        </h1>
        
        <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          zigZig is the ultimate AI-powered, real-time career hub. Generate stunning portfolios, 
          optimize your resume, find dream jobs, and land interviews—all powered by cutting-edge AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/auth/sign-up">
              Start Building Your Career
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
            <Link href="#features">Explore Features</Link>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">10x Faster</div>
            <div className="text-sm text-muted-foreground">Portfolio Creation</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">AI-Powered</div>
            <div className="text-sm text-muted-foreground">Resume Optimization</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">Real-time</div>
            <div className="text-sm text-muted-foreground">Job Matching</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Preview */}
      <div className="w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-8">
          Everything You Need for Your{" "}
          <span className="text-black dark:text-white font-bold">
            Career Success
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="h-6 w-6 text-pink-500" />
                <Badge variant="secondary" className="text-xs">Fal.AI</Badge>
              </div>
              <h3 className="font-semibold mb-2">Ghibli Avatar Generator</h3>
              <p className="text-sm text-muted-foreground">Transform your photo into Studio Ghibli art</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <Badge variant="secondary" className="text-xs">Next.js</Badge>
              </div>
              <h3 className="font-semibold mb-2">Live Portfolio Generation</h3>
              <p className="text-sm text-muted-foreground">AI-generated portfolio sites from your resume</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="h-6 w-6 text-green-500" />
                <Badge variant="secondary" className="text-xs">Groq LLM</Badge>
              </div>
              <h3 className="font-semibold mb-2">SuperDM Outreach</h3>
              <p className="text-sm text-muted-foreground">AI-powered message drafting for networking</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-6 w-6 text-purple-500" />
                <Badge variant="secondary" className="text-xs">AI</Badge>
              </div>
              <h3 className="font-semibold mb-2">Resume Optimization</h3>
              <p className="text-sm text-muted-foreground">ATS-optimized resume and cover letters</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-4xl">
        <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of professionals building their dream careers with zigZig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
