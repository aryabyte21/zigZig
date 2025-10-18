import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile to check if onboarding is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .single();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to{" "}
              <span className="text-black dark:text-white">
                zigZig
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Let's create your AI-powered portfolio in just a few steps
            </p>
          </div>

          <OnboardingWizard profile={profile} />
        </div>
      </div>
    </div>
  );
}
