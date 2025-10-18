"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, Sparkles, X, Volume2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface TalkToAIButtonProps {
  portfolioId: string;
}

export function TalkToAIButton({ portfolioId }: TalkToAIButtonProps) {
  const agent = useQuery(api.agents.getAgentByPortfolio, { portfolioId });
  const [isPulsing, setIsPulsing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Check for recent activity (last 5 minutes)
  useEffect(() => {
    if (agent?.lastConversationAt) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setIsPulsing(agent.lastConversationAt > fiveMinutesAgo);
    }
  }, [agent?.lastConversationAt]);

  // Load and initialize ElevenLabs widget
  useEffect(() => {
    if (isOpen && agent?.agentId) {
      console.log("Loading ElevenLabs widget for agent:", agent.agentId);
      
      // Load script if not already loaded
      if (!scriptLoadedRef.current) {
        const script = document.createElement('script');
        script.src = 'https://elevenlabs.io/convai-widget/index.js';
        script.async = true;
        script.onload = () => {
          console.log("ElevenLabs widget script loaded");
          scriptLoadedRef.current = true;
          setIsLoading(false);
        };
        script.onerror = () => {
          console.error("Failed to load ElevenLabs widget script");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        setIsLoading(false);
      }

      // Cleanup: Remove widget element when dialog closes
      return () => {
        if (widgetContainerRef.current) {
          const widget = widgetContainerRef.current.querySelector('elevenlabs-convai');
          if (widget) {
            widget.remove();
          }
        }
      };
    }
  }, [isOpen, agent?.agentId]);

  // Re-initialize widget when it becomes visible
  useEffect(() => {
    if (isOpen && !isLoading && agent?.agentId && widgetContainerRef.current) {
      const existingWidget = widgetContainerRef.current.querySelector('elevenlabs-convai');
      if (!existingWidget) {
        console.log("Creating widget element for agent:", agent.agentId);
        const widgetElement = document.createElement('elevenlabs-convai');
        widgetElement.setAttribute('agent-id', agent.agentId);
        widgetContainerRef.current.appendChild(widgetElement);
      }
    }
  }, [isOpen, isLoading, agent?.agentId]);

  if (!agent || !agent.isActive) {
    return null;
  }

  const conversationCount = agent.conversationCount || 0;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Stats badge */}
        {conversationCount > 0 && (
          <Badge 
            variant="secondary" 
            className="bg-background/95 backdrop-blur-sm shadow-lg border border-purple-500/20"
          >
            <Sparkles className="h-3 w-3 mr-1.5 text-purple-600" />
            <span className="text-xs font-medium">
              {conversationCount} chat{conversationCount !== 1 ? "s" : ""} this week
            </span>
          </Badge>
        )}

        {/* Main button with better visual hierarchy */}
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={`
            h-16 px-8 gap-3 shadow-2xl rounded-full
            bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 
            hover:from-purple-700 hover:via-purple-800 hover:to-pink-700
            hover:scale-105
            text-white font-semibold text-base
            transition-all duration-300 ease-out
            border-2 border-white/20
            ${isPulsing ? "animate-pulse" : ""}
          `}
        >
          <div className="relative flex items-center justify-center">
            <Mic className="h-6 w-6" />
            {isPulsing && (
              <>
                <div className="absolute inset-0 h-6 w-6 flex items-center justify-center">
                  <div className="h-8 w-8 bg-white/30 rounded-full animate-ping" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </>
            )}
          </div>
          <span className="tracking-wide">Talk to My AI</span>
          <Volume2 className="h-5 w-5 ml-1" />
        </Button>

        {/* Live indicator */}
        {isPulsing && (
          <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/30 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-green-500/20">
            <div className="relative flex items-center justify-center">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <div className="absolute h-3 w-3 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
            <span>Someone's chatting now!</span>
          </div>
        )}
      </div>

      {/* AI Widget Dialog - Full Screen */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          {/* Custom Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Portfolio Assistant
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Volume2 className="h-3 w-3" />
                  <span>Powered by ElevenLabs • Speaking in my voice</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 rounded-full hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Widget Container */}
          <div className="flex-1 w-full overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              {/* ElevenLabs Widget */}
              <div 
                ref={widgetContainerRef}
                className="w-full h-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                style={{ minHeight: '600px' }}
              />
              
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto" />
                      <Mic className="h-6 w-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        Loading AI Assistant...
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Initializing voice interface
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Footer */}
          <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-t">
            <p className="text-xs text-center text-muted-foreground">
              💡 <strong>Tip:</strong> Click the microphone icon in the widget to start speaking, or type your message
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

