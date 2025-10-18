"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface DebugConversationProps {
  conversationId: Id<"conversations">;
  currentUserId: string;
}

export function DebugConversation({ conversationId, currentUserId }: DebugConversationProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const conversationDebug = useQuery(api.messaging.debugConversation, {
    conversationId,
  });

  const updateOwner = useMutation(api.messaging.updateConversationOwner);

  const handleFix = async () => {
    setIsFixing(true);
    try {
      await updateOwner({
        conversationId,
        newPortfolioUserId: currentUserId,
      });
      setIsFixed(true);
      setTimeout(() => setIsFixed(false), 3000);
    } catch (error) {
      console.error("Failed to fix conversation:", error);
    } finally {
      setIsFixing(false);
    }
  };

  if (!conversationDebug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug Conversation</CardTitle>
          <CardDescription>Loading conversation details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const userIdMatch = conversationDebug.portfolioUserId === currentUserId;

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug: Email Not Working?
          {userIdMatch ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              User ID Match
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              User ID Mismatch
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Emails won&apos;t work if user IDs don&apos;t match
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your User ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {currentUserId.substring(0, 20)}...
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conversation Owner:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {conversationDebug.portfolioUserId.substring(0, 20)}...
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Visitor Email:</span>
            <span className="font-mono text-xs">
              {conversationDebug.visitorEmail || "Not set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Magic Token:</span>
            <Badge variant={conversationDebug.hasMagicToken ? "default" : "destructive"}>
              {conversationDebug.hasMagicToken ? "Present" : "Missing"}
            </Badge>
          </div>
        </div>

        {!userIdMatch && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              The conversation owner doesn&apos;t match your user ID. Click below to fix:
            </p>
            <Button 
              onClick={handleFix} 
              disabled={isFixing || isFixed}
              className="w-full"
              variant={isFixed ? "default" : "outline"}
            >
              {isFixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : isFixed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Fixed! Try sending a message now
                </>
              ) : (
                <>
                  🔧 Fix Conversation Owner
                </>
              )}
            </Button>
            {isFixed && (
              <p className="text-xs text-green-600 mt-2 text-center">
                ✅ Conversation owner updated. Emails should now work!
              </p>
            )}
          </div>
        )}

        {userIdMatch && (
          <div className="pt-4 border-t">
            <p className="text-sm text-green-600">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              User IDs match! If emails still don&apos;t work, check:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-5 list-disc">
              <li>RESEND_API_KEY is set in .env.local</li>
              <li>Convex dev server is running with latest code</li>
              <li>Check terminal logs when sending a message</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

