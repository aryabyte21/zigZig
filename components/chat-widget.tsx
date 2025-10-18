"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  X, 
  Sparkles, 
  Send,
  Loader2,
  Bot,
  User,
  ExternalLink
} from "lucide-react";
import { JobSearchChat } from "@/components/job-search-chat";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  userProfile?: {
    skills: string[];
    experienceLevel: string;
    location?: string;
    remotePreference?: string;
  };
  className?: string;
}

export function ChatWidget({ userProfile, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </Button>
      ) : (
        <Card className={cn(
          "w-96 shadow-2xl border-0 bg-white dark:bg-gray-900",
          isMinimized ? "h-16" : "h-[500px]"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Job Search</CardTitle>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Live
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0"
                >
                  {isMinimized ? <MessageSquare className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <CardContent className="p-0 h-[calc(100%-4rem)]">
              <JobSearchChat userProfile={userProfile} />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

// Compact chat interface for the widget
export function CompactJobSearchChat({ userProfile }: { userProfile?: any }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant' as const,
      content: "Hi! I can help you find jobs. What are you looking for?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/job-search-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          userProfile,
          conversationHistory: messages.slice(-3),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date(),
        jobResults: data.jobs?.slice(0, 3) || [],
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            
            <div className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              message.role === 'user' 
                ? "bg-blue-500 text-white" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            )}>
              {message.content}
            </div>
            
            {message.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Searching...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about jobs..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
