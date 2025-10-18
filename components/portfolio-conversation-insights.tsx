"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, TrendingUp, Clock, Users } from "lucide-react";
import { useMemo } from "react";

interface ConversationInsightsProps {
  userId: string;
}

export function PortfolioConversationInsights({ userId }: ConversationInsightsProps) {
  const agent = useQuery(api.agents.getAgentByUser, { userId });
  const conversations = useQuery(api.agents.getConversationsByUser, { userId });
  const stats = useQuery(api.agents.getConversationStats, { userId });

  // Generate insights from conversations
  const insights = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return {
        popularTopics: [],
        avgDuration: 0,
        totalConversations: 0,
      };
    }

    const totalConversations = conversations.length;
    const avgDuration = conversations.reduce((acc, c) => acc + c.duration, 0) / totalConversations;

    // Extract common keywords from summaries
    const allText = conversations
      .filter(c => c.summary)
      .map(c => c.summary!)
      .join(" ")
      .toLowerCase();

    const keywords = [
      "experience",
      "skills",
      "projects",
      "education",
      "technologies",
      "achievements",
      "background",
      "portfolio",
    ];

    const popularTopics = keywords
      .map(keyword => ({
        topic: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        count: (allText.match(new RegExp(keyword, "g")) || []).length,
      }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      popularTopics,
      avgDuration: Math.round(avgDuration),
      totalConversations,
    };
  }, [conversations]);

  if (!agent || !agent.isActive) {
    return null;
  }

  const hasConversations = (conversations?.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Conversation Insights</CardTitle>
            <CardDescription>
              Track how recruiters interact with your AI assistant
            </CardDescription>
          </div>
          {hasConversations && (
            <Badge variant="secondary">
              {stats?.totalConversations || 0} Total
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasConversations ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>This Week</span>
                </div>
                <div className="text-2xl font-bold">{stats?.weeklyConversations || 0}</div>
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Avg Duration</span>
                </div>
                <div className="text-2xl font-bold">{insights.avgDuration}s</div>
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3 w-3" />
                  <span>Visitors</span>
                </div>
                <div className="text-2xl font-bold">{insights.totalConversations}</div>
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Engagement</span>
                </div>
                <div className="text-2xl font-bold">
                  {insights.totalConversations > 10 ? "High" : insights.totalConversations > 5 ? "Medium" : "Low"}
                </div>
              </div>
            </div>

            <Separator />

            {/* Popular Topics */}
            {insights.popularTopics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Most Discussed Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {insights.popularTopics.map((topic) => (
                    <Badge key={topic.topic} variant="outline">
                      {topic.topic}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({topic.count})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {insights.popularTopics.length > 0 && <Separator />}

            {/* Recent Conversations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Recent Conversations</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>All Conversations</DialogTitle>
                      <DialogDescription>
                        Complete conversation history with your AI assistant
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-4">
                        {conversations?.map((conv) => (
                          <div key={conv._id} className="p-4 rounded-lg border bg-muted/50">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                {new Date(conv.timestamp).toLocaleDateString()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {conv.duration}s
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                              {conv.summary || "Conversation about portfolio and experience"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {conversations?.slice(0, 3).map((conv) => (
                  <div key={conv._id} className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">{conv.duration}s</span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {conv.summary || "Conversation about portfolio and experience"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
            <h3 className="font-semibold mb-1">No Conversations Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your AI assistant is ready. Share your portfolio to start getting conversations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

