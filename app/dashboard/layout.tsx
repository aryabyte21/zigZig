import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SimpleDashboardNav } from "@/components/simple-dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleDashboardNav user={{
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      }} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
