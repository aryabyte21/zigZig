"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Bot, 
  User, 
  MapPin, 
  Building2, 
  DollarSign, 
  Clock, 
  ExternalLink,
  Loader2,
  Sparkles,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  jobResults?: JobResult[];
  isTyping?: boolean;
}

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salaryRange?: { min: number; max: number; currency: string };
  jobType: string;
  experienceLevel: string;
  skills: string[];
  remote: boolean;
  hybrid: boolean;
  relevanceScore: number;
  publishedDate: string;
}

interface JobSearchChatProps {
  userProfile?: {
    skills: string[];
    experienceLevel: string;
    location?: string;
    remotePreference?: string;
  };
}

export function JobSearchChat({ userProfile }: JobSearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI job search assistant. I can help you find relevant job opportunities based on your skills and preferences. What kind of job are you looking for?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/job-search-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          userProfile,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get job recommendations');
      }

      const data = await response.json();
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        jobResults: data.jobs || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error("Failed to get job recommendations. Please try again.");
      
      // Remove typing indicator and add error message
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== 'typing'),
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, I encountered an error while searching for jobs. Please try again.",
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatSalary = (salaryRange: { min: number; max: number; currency: string }) => {
    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}k`;
      }
      return `$${num.toLocaleString()}`;
    };
    return `${formatNumber(salaryRange.min)} - ${formatNumber(salaryRange.max)}`;
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header - Clean Apple Style */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Job Search</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered matching</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          Live
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/ai-avatar.png" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-[80%] space-y-2",
                message.role === 'user' ? 'order-first' : ''
              )}>
                <div className={cn(
                  "rounded-lg px-4 py-3 text-sm",
                  message.role === 'user' 
                    ? "bg-blue-500 text-white ml-auto" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                )}>
                  {message.isTyping ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching for jobs...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                
                {message.jobResults && message.jobResults.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Briefcase className="w-4 h-4" />
                      <span>Found {message.jobResults.length} relevant jobs</span>
                    </div>
                    
                    <div className="space-y-3 max-w-full">
                      {message.jobResults.slice(0, 5).map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-800 group overflow-hidden">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {job.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <Building2 className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{job.company}</span>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{job.location}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className={cn("text-xs font-medium", getRelevanceColor(job.relevanceScore))}>
                                    {Math.round(job.relevanceScore * 100)}%
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                    asChild
                                  >
                                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Description */}
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {job.description}
                              </p>
                              
                              {/* Meta Info */}
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs h-6">
                                  {job.jobType}
                                </Badge>
                                <Badge variant="outline" className="text-xs h-6">
                                  {job.experienceLevel}
                                </Badge>
                                {job.remote && (
                                  <Badge variant="outline" className="text-xs h-6 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                                    Remote
                                  </Badge>
                                )}
                                {job.hybrid && (
                                  <Badge variant="outline" className="text-xs h-6 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                    Hybrid
                                  </Badge>
                                )}
                                {job.salaryRange && (
                                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{formatSalary(job.salaryRange)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Skills */}
                              {job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {job.skills.slice(0, 4).map((skill) => (
                                    <Badge key={skill} variant="secondary" className="text-xs h-5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.skills.length > 4 && (
                                    <Badge variant="secondary" className="text-xs h-5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                      +{job.skills.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about jobs... (e.g., 'Find React developer jobs in San Francisco')"
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Try: "Find remote React jobs", "Show me senior Python positions", or "What jobs match my skills?"
        </p>
      </div>
    </div>
  );
}
