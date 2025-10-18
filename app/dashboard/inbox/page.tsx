import { createClient } from "@/lib/supabase/server";
import { InboxDashboard } from "@/components/inbox-dashboard";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">Please log in to access your inbox.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-muted-foreground">Manage your SuperDM conversations</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <InboxDashboard userId={user.id} />
      </div>
    </div>
  );
}
