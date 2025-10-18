import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { 
  ArrowRight, Sparkles, Zap, Users, Brain, Palette, FileText, MessageSquare,
  Briefcase, Heart, Target, Rocket, Search, Bot, Wand2, TrendingUp,
  Shield, Clock, Star, ThumbsUp, CheckCircle2, PartyPopper
} from "lucide-react";

export function Hero() {
  return (
    <div className="flex flex-col gap-20 items-center pb-16">
      {/* Main Hero Section with Gradient */}
      <div className="flex flex-col gap-8 max-w-5xl text-center relative">
        {/* Animated Background Blur */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
            <Sparkles className="h-8 w-8 text-yellow-500 animate-spin-slow" />
            <Badge variant="secondary" className="text-sm px-4 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
              🚀 AI-Powered Career Platform (No, Seriously)
            </Badge>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 animate-fade-in-up">
            Your Career,
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              But Make It AI
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4 animate-fade-in-up delay-200">
            Stop spending hours on LinkedIn like it's 2010. zigZig uses <span className="font-semibold text-foreground">4 different AIs</span> to build your portfolio, 
            write your messages, match you with jobs, and basically do everything except show up to the interview.
          </p>
          
          <p className="text-sm text-muted-foreground mb-8 animate-fade-in-up delay-300">
            (We're working on that last part 🤖)
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-fade-in-up delay-400">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Link href="/auth/sign-up">
                <Rocket className="mr-2 h-5 w-5" />
                Start Your AI Career Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
              <Link href="#features">
                Show Me The Magic ✨
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Funny Stats Section */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <Zap className="h-10 w-10 text-yellow-500 mx-auto mb-3 animate-bounce" />
              <div className="text-3xl font-black mb-1">10x</div>
              <div className="text-sm text-muted-foreground">Faster Portfolio Creation</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">*than doing it yourself while crying</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <Brain className="h-10 w-10 text-purple-500 mx-auto mb-3 animate-pulse" />
              <div className="text-3xl font-black mb-1">4 AIs</div>
              <div className="text-sm text-muted-foreground">Working for You</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">Gemini, GPT-4, Groq & Exa walk into a bar...</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <Target className="h-10 w-10 text-green-500 mx-auto mb-3 animate-ping" />
              <div className="text-3xl font-black mb-1">Real-time</div>
              <div className="text-sm text-muted-foreground">Job Matching</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">Like Tinder, but for your career</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <PartyPopper className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-black mb-1">∞</div>
              <div className="text-sm text-muted-foreground">Hours Saved</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">Go touch grass instead</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Showcase with Humor */}
      <div id="features" className="w-full max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            What Can This Thing{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Actually Do?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Buckle up. It's a lot. Like, a LOT a lot. 🎢
          </p>
        </div>

        {/* AI Portfolio Generation */}
        <Card className="mb-8 overflow-hidden border-2 border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-500 p-3 rounded-xl">
                <Palette className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold">AI Portfolio Generation</h3>
                  <Badge className="bg-purple-500">Fal.AI</Badge>
                  <Badge className="bg-pink-500">GPT-4</Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  Upload your resume (yes, that crusty PDF from 2019). We'll turn you into a Studio Ghibli character AND build you a portfolio 
                  that makes you look like you actually know what you're doing. ✨
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Ghibli Avatar Generator</div>
                      <div className="text-sm text-muted-foreground">Because boring headshots are so 2023</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Smart Resume Parsing</div>
                      <div className="text-sm text-muted-foreground">PDF, DOCX, stone tablets—we read it all</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">AI Content Enhancement</div>
                      <div className="text-sm text-muted-foreground">Makes you sound smarter than you are 🧠</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Job Search & Recommendations */}
        <Card className="mb-8 overflow-hidden border-2 border-green-500/20 hover:border-green-500/40 transition-all">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-500 p-3 rounded-xl">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold">Intelligent Job Hunting</h3>
                  <Badge className="bg-green-500">Gemini 2.0</Badge>
                  <Badge className="bg-emerald-500">Exa.AI</Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  Forget Indeed. Forget LinkedIn's weird algorithm. Our AI actually understands what you want and finds jobs that don't suck. 
                  Plus, it has <span className="font-semibold">built-in web access</span> so it's basically stalking companies for you. 🕵️
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Semantic Job Search</div>
                      <div className="text-sm text-muted-foreground">Finds jobs you'd actually enjoy (novel concept)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">AI Chat Search</div>
                      <div className="text-sm text-muted-foreground">Talk to it like a friend who knows every job</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Smart Recommendations</div>
                      <div className="text-sm text-muted-foreground">Cached for 5 min so you're not spamming APIs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SuperDM */}
        <Card className="mb-8 overflow-hidden border-2 border-blue-500/20 hover:border-blue-500/40 transition-all">
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 p-3 rounded-xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold">SuperDM: Networking on Steroids</h3>
                  <Badge className="bg-blue-500">Groq</Badge>
                  <Badge className="bg-cyan-500">GPT-4</Badge>
                  <Badge className="bg-purple-500">Magic Links</Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  Real-time chat with AI autocomplete, smart replies, and magic links. It's like if LinkedIn InMail actually worked. 
                  No signups for visitors—just instant connection. Also, we email you when they reply because we're not monsters. 📧
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">AI Message Writing</div>
                      <div className="text-sm text-muted-foreground">Never sound awkward again (hopefully)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Real-Time Presence</div>
                      <div className="text-sm text-muted-foreground">See who's actually online (like it's 2005 AIM)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Magic Conversation Links</div>
                      <div className="text-sm text-muted-foreground">Bookmark your convos forever ♾️</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recruiter Matching */}
        <Card className="mb-8 overflow-hidden border-2 border-orange-500/20 hover:border-orange-500/40 transition-all">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500 p-3 rounded-xl">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold">Tinder for Hiring (We're Serious)</h3>
                  <Badge className="bg-orange-500">Groq AI</Badge>
                  <Badge className="bg-red-500">Real-time</Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  Recruiters paste a job description. Our AI finds candidates. They swipe right (like), left (pass), or up (super like). 
                  It's Tinder but for your career. Minus the disappointment. Maybe. 💝
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">AI Job Parsing</div>
                      <div className="text-sm text-muted-foreground">Extracts requirements like a boss</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Smart Candidate Matching</div>
                      <div className="text-sm text-muted-foreground">0-100% match scores (we do the math)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-semibold">Swipe Interface</div>
                      <div className="text-sm text-muted-foreground">Because clicking buttons is SO 2020</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tech Stack Showcase */}
      <div className="w-full max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">
            Powered By The Dream Team 🏆
          </h2>
          <p className="text-muted-foreground">
            We used literally every cool AI API. Because why not? 🤷‍♂️
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center hover:scale-105 transition-transform bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardContent className="pt-6">
              <Bot className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="font-bold mb-1">Google Gemini</div>
              <Badge variant="secondary" className="text-xs">Categorization</Badge>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 transition-transform bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="pt-6">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-bold mb-1">OpenAI GPT-4</div>
              <Badge variant="secondary" className="text-xs">Smart Replies</Badge>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 transition-transform bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-bold mb-1">Groq (Llama)</div>
              <Badge variant="secondary" className="text-xs">Fast AI</Badge>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 transition-transform bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardContent className="pt-6">
              <Search className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="font-bold mb-1">Exa.ai</div>
              <Badge variant="secondary" className="text-xs">Job Search</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="w-full max-w-6xl">
        <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-2 border-purple-500/20">
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-3xl font-black mb-4">
              "Wait, This Actually Works?" 🤯
            </h3>
            <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Yeah, we were surprised too. Turns out when you combine 4 different AI models, 
              real-time databases, magic links, and way too much caffeine, you get something pretty cool.
            </p>
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">∞</div>
                <div className="text-sm text-muted-foreground">Possibilities</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">4</div>
                <div className="text-sm text-muted-foreground">AI Models</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">1</div>
                <div className="text-sm text-muted-foreground">Platform</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final CTA */}
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden border-4 border-gradient-to-r from-purple-500 to-blue-500">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-1">
            <div className="bg-background p-12 text-center">
              <h3 className="text-4xl font-black mb-6">
                Ready to Let AI Do The Work? 🎯
              </h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Stop manually applying to jobs like it's 1995. Let our army of AIs handle the boring stuff 
                while you focus on being awesome.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button asChild size="lg" className="text-xl px-12 py-7 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href="/auth/sign-up">
                    <Rocket className="mr-2 h-6 w-6" />
                    Start For Free
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-xl px-12 py-7 border-2">
                  <Link href="/auth/login">
                    I Already Have An Account
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required. No BS. Just pure AI-powered career magic. ✨
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fun Footer Disclaimer */}
      <div className="w-full max-w-4xl text-center">
        <p className="text-xs text-muted-foreground">
          * Results may vary. We can't guarantee you'll land your dream job, but we can guarantee your portfolio will look fire. 🔥
          <br />
          ** AIs are trained on public data. They're smart but not psychic. Yet. 🔮
          <br />
          *** If an AI achieves sentience during your session, please email support. We have a protocol for this. 🤖
        </p>
      </div>
    </div>
  );
}
