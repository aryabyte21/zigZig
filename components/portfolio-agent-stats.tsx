"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mic, MessageSquare, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PortfolioAgentStatsProps {
  userId: string;
}

export function PortfolioAgentStats({ userId }: PortfolioAgentStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const agent = useQuery(api.agents.getAgentByUser, { userId });
  const stats = useQuery(api.agents.getConversationStats, { userId });
  const recentConversations = useQuery(api.agents.getConversationsByUser, { userId, limit: 5 });

  if (!agent || !agent.isActive) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5" />
          AI Voice Assistant
        </CardTitle>
        <CardDescription>
          Your AI is talking to recruiters 24/7
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg border bg-muted/50">
            <div className="text-2xl font-bold">
              {stats?.totalConversations || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total Talks
            </div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-muted/50">
            <div className="text-2xl font-bold">
              {stats?.weeklyConversations || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              This Week
            </div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-muted/50">
            <div className="text-2xl font-bold">
              {stats?.avgDuration ? formatDuration(stats.avgDuration) : "0s"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg Duration
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1" size="sm">
                <MessageSquare className="mr-2 h-3 w-3" />
                View Conversations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Recent Conversations</DialogTitle>
                <DialogDescription>
                  See who's been talking to your AI assistant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {recentConversations && recentConversations.length > 0 ? (
                  recentConversations.map((conv) => (
                    <div key={conv._id} className="p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {conv.visitorInfo?.name || "Anonymous"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(conv.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Duration: {formatDuration(conv.duration)}
                          </p>
                          {conv.summary && (
                            <p className="text-sm">{conv.summary}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {agent.agentUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(agent.agentUrl, "_blank")}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              Test AI
            </Button>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          AI Assistant is active
        </div>
      </CardContent>
    </Card>
  );
}

