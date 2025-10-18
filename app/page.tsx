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
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="text-2xl font-bold text-gray-900 dark:text-white">
                zigZig
              </Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <div className="flex gap-2">
                <Button asChild size="sm" variant={"outline"}>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant={"default"}>
                  <Link href="/auth/sign-up">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          {hasEnvVars && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to build your career?</h2>
              <p className="text-muted-foreground">
                Sign up to access your dashboard and start creating your portfolio.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/sign-up">
                  <Button size="lg">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
            {" "}•{" "}
            <a
              href="https://nextjs.org/"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Next.js
            </a>
            {" "}•{" "}
            <a
              href="https://ui.shadcn.com/"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              shadcn/ui
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
