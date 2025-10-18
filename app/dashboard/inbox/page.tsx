import { createClient } from "@/lib/supabase/server";
import { InboxDashboard } from "@/components/inbox-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Clock, Users } from "lucide-react";

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
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SuperDM Inbox</h1>
          <p className="text-muted-foreground">
            Manage your portfolio messages with AI-powered insights and automation.
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">New Messages</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Response Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold">2.4h</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            AI Insights
          </CardTitle>
          <CardDescription>
            Your messaging performance and recommendations powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Top Message Categories</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Hiring (45%)</Badge>
                <Badge variant="secondary">Networking (30%)</Badge>
                <Badge variant="secondary">Collaboration (25%)</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Peak Activity</h4>
              <p className="text-sm text-muted-foreground">
                Most messages received on <strong>Tuesday 2-4 PM</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Recommendations</h4>
              <p className="text-sm text-muted-foreground">
                Enable auto-replies for hiring inquiries to improve response time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Inbox Dashboard */}
      <InboxDashboard userId={user.id} />
    </div>
  );
}
