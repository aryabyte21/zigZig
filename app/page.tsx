"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    // Clear any existing Supabase session on landing page
    const supabase = createClient();
    supabase.auth.signOut({ scope: 'local' }).catch(() => {
      // Ignore errors, we just want to ensure no session exists
    });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-background via-background to-purple-500/5">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Enhanced Navigation */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 bg-background/80 backdrop-blur-lg sticky top-0 z-50 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 transition-all">
                ⚡ zigZig
              </Link>
              <div className="hidden md:flex items-center gap-4 text-sm">
                <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <div className="flex gap-2 items-center">
                <ThemeSwitcher />
                <Button asChild size="sm" variant={"ghost"}>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col gap-20 max-w-7xl p-5 w-full">
          <Hero />
        </div>

        {/* Enhanced Footer */}
        <footer className="w-full border-t bg-gradient-to-t from-purple-500/5 to-background">
          <div className="max-w-7xl mx-auto px-5 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  ⚡ zigZig
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  The AI-powered career platform that actually works. 
                  Build portfolios, find jobs, and network—all in one place.
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Link href="/auth/sign-up">Start Free</Link>
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                  <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                  <li><Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Pricing</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Powered By</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      Google Gemini 2.0
                    </a>
                  </li>
                  <li>
                    <a href="https://groq.com/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      Groq (Llama)
                    </a>
                  </li>
                  <li>
                    <a href="https://exa.ai/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      Exa.ai
                    </a>
                  </li>
                  <li>
                    <a href="https://fal.ai/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      Fal.ai
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-muted-foreground">
                Built with{" "}
                <a href="https://nextjs.org/" target="_blank" className="font-bold hover:underline" rel="noreferrer">
                  Next.js
                </a>
                {" "}•{" "}
                <a href="https://supabase.com/" target="_blank" className="font-bold hover:underline" rel="noreferrer">
                  Supabase
                </a>
                {" "}•{" "}
                <a href="https://convex.dev/" target="_blank" className="font-bold hover:underline" rel="noreferrer">
                  Convex
                </a>
                {" "}•{" "}
                <a href="https://ui.shadcn.com/" target="_blank" className="font-bold hover:underline" rel="noreferrer">
                  shadcn/ui
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                © 2025 zigZig. Made with 🤖 and ☕
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
