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
    <div className="fixed inset-0 top-16 flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <svg className="h-5 w-5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Inbox</h1>
              <p className="text-xs text-muted-foreground">
                AI-powered conversations
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <InboxDashboard userId={user.id} />
      </div>
    </div>
  );
}
