import { Suspense } from "react";
import { ConversationView } from "@/components/conversation-view";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function MagicLinkChatPage({ params }: PageProps) {
  const { token } = await params;

  // Validate token format
  if (!token || !token.startsWith("conv_")) {
    notFound();
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SD</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">SuperDM</h1>
              <p className="text-xs text-muted-foreground">
                Professional messaging made simple
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Now takes full remaining height */}
      <div className="flex-1 overflow-hidden">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <ConversationView token={token} />
        </Suspense>
      </div>
    </div>
  );
}

