import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PortfolioList } from "@/components/portfolio-list";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function PortfolioPage() {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  // Get user's portfolios (ordered by creation date, newest first) - SECURITY FIX: Filter by user_id
  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("id,title,description,slug,is_published,updated_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Builder</h1>
          <p className="text-muted-foreground">
            Create and manage your professional portfolios. Only one portfolio can be active (publicly visible) at a time.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Create New Portfolio
          </Link>
        </Button>
      </div>

      <PortfolioList portfolios={portfolios || []} />
    </div>
  );
}
