"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceAgentStatus {
  hasVoiceId: boolean;
  voiceId: string | null;
  hasPortfolio: boolean;
  portfolios: Array<{
    id: string;
    title: string;
    isPublished: boolean;
    slug: string;
    url: string | null;
  }>;
  hasAgent: boolean;
  agent: {
    agentId: string;
    agentUrl: string;
    isActive: boolean;
    conversationCount: number;
  }   | null;
}

function DeleteAgentButton({ onSuccess }: { onSuccess: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the agent? You can recreate it afterwards.")) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting agent...");

    try {
      const response = await fetch("/api/delete-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete agent");
      }

      toast.success("Agent deleted! You can now create a new one.", { id: toastId });
      
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (error: any) {
      console.error("Agent deletion error:", error);
      toast.error(`Failed to delete: ${error.message}`, { id: toastId, duration: 5000 });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={isDeleting}
      size="sm"
      variant="destructive"
    >
      {isDeleting ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-3 w-3" />
          Delete & Recreate
        </>
      )}
    </Button>
  );
}

function CreateAgentButton({ portfolioId, onSuccess }: { portfolioId?: string; onSuccess: () => void }) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!portfolioId) {
      toast.error("No published portfolio found");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating your AI agent...");

    try {
      console.log("Creating agent for portfolio:", portfolioId);
      
      const response = await fetch("/api/create-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Agent creation failed:", data);
        throw new Error(data.error || data.details || "Failed to create agent");
      }

      console.log("Agent created successfully:", data);
      toast.success("🎉 AI Agent created successfully!", { id: toastId });
      
      // Refresh status after a short delay
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (error: any) {
      console.error("Agent creation error:", error);
      toast.error(
        <div>
          <div className="font-semibold">Failed to create AI agent</div>
          <div className="text-xs mt-1">{error.message}</div>
          <div className="text-xs text-muted-foreground mt-1">Check console (F12) for details</div>
        </div>,
        { id: toastId, duration: 5000 }
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={isCreating}
      size="sm"
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-3 w-3" />
          Create AI Agent Now
        </>
      )}
    </Button>
  );
}

export function VoiceAgentDebug() {
  const [status, setStatus] = useState<VoiceAgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/voice-agent-status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        toast.error("Failed to load status");
      }
    } catch (error) {
      console.error("Error loading status:", error);
      toast.error("Error loading status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading AI Voice Assistant status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const hasIssues = !status.hasVoiceId || !status.hasAgent;
  
  // Auto-expand if there are issues
  const shouldShow = isExpanded || hasIssues;

  return (
    <Card className={`${hasIssues ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' : 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            AI Voice Assistant Status
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStatus}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {shouldShow ? "Hide" : "Show"} Details
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {hasIssues 
            ? "⚠️ Setup incomplete - follow the steps below" 
            : "✅ All set! Your AI assistant is ready"
          }
        </CardDescription>
      </CardHeader>

      {shouldShow && (
        <CardContent className="space-y-4">
          {/* Voice Recording Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div className="flex items-center gap-3">
              {status.hasVoiceId ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="font-medium">Voice Recording</div>
                <div className="text-xs text-muted-foreground">
                  {status.hasVoiceId 
                    ? `Voice ID: ${status.voiceId?.substring(0, 20)}...` 
                    : "No voice samples recorded yet"
                  }
                </div>
              </div>
            </div>
            {!status.hasVoiceId && (
              <Button asChild size="sm">
                <a href="/dashboard/onboarding">
                  Record Voice
                </a>
              </Button>
            )}
          </div>

          {/* Portfolio Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div className="flex items-center gap-3">
              {status.hasPortfolio ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="font-medium">Portfolio</div>
                <div className="text-xs text-muted-foreground">
                  {status.portfolios.length} portfolio{status.portfolios.length !== 1 ? 's' : ''} created
                </div>
              </div>
            </div>
            {!status.hasPortfolio && (
              <Button asChild size="sm">
                <a href="/dashboard/onboarding">
                  Create Portfolio
                </a>
              </Button>
            )}
          </div>

          {/* Published Portfolio Status */}
          {status.portfolios.length > 0 && (
            <div className="space-y-2 pl-8">
              {status.portfolios.map((portfolio) => (
                <div key={portfolio.id} className="flex items-center justify-between text-sm p-2 rounded bg-background/30">
                  <div className="flex items-center gap-2">
                    {portfolio.isPublished ? (
                      <Badge variant="default" className="bg-green-600">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    <span>{portfolio.title}</span>
                  </div>
                  {portfolio.url && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={portfolio.url} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AI Agent Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div className="flex items-center gap-3">
              {status.hasAgent ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="font-medium">AI Agent</div>
                <div className="text-xs text-muted-foreground">
                  {status.hasAgent 
                    ? `Active - ${status.agent?.conversationCount || 0} conversations` 
                    : "Agent not created yet"
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status.hasAgent && status.agent?.agentUrl && (
                <>
                  <Button asChild size="sm" variant="outline">
                    <a href={status.agent.agentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Test AI
                    </a>
                  </Button>
                  <DeleteAgentButton onSuccess={loadStatus} />
                </>
              )}
              {!status.hasAgent && status.hasVoiceId && status.portfolios.some(p => p.isPublished) && (
                <CreateAgentButton 
                  portfolioId={status.portfolios.find(p => p.isPublished)?.id} 
                  onSuccess={loadStatus}
                />
              )}
            </div>
          </div>

          {/* Instructions */}
          {hasIssues && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
              <div className="font-medium text-sm mb-2">📋 Setup Steps:</div>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                {!status.hasVoiceId && (
                  <li>Record your voice samples in onboarding (3 recordings)</li>
                )}
                {!status.hasPortfolio && (
                  <li>Complete your portfolio creation</li>
                )}
                {status.hasPortfolio && !status.portfolios.some(p => p.isPublished) && (
                  <li>Activate/publish your portfolio</li>
                )}
                {status.hasVoiceId && status.portfolios.some(p => p.isPublished) && !status.hasAgent && (
                  <li>Wait a few seconds for AI agent to be created automatically</li>
                )}
              </ol>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

