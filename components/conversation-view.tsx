"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, CheckCheck, Loader2, Bookmark, Sparkles, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface ConversationViewProps {
  token: string;
}

export function ConversationView({ token }: ConversationViewProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch conversation and messages
  const data = useQuery(api.messaging.getConversationByToken, { token });
  const sendMessageMutation = useMutation(api.messaging.sendMessage);
  const markAsReadMutation = useMutation(api.messaging.markAsRead);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.messages]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (data?.conversation) {
      markAsReadMutation({
        conversationId: data.conversation._id,
        userId: data.conversation.visitorId || `visitor_${token}`,
      });
    }
  }, [data?.conversation]);

  // Load smart reply suggestions when there's a new message from the other person
  useEffect(() => {
    const loadSmartReplies = async () => {
      if (!data?.messages || data.messages.length === 0) return;
      
      const lastMessage = data.messages[data.messages.length - 1];
      const isFromOther = lastMessage.senderId !== (data.conversation.visitorId || `visitor_${token}`);
      
      if (isFromOther && !message) {
        setIsLoadingSuggestions(true);
        try {
          // Build full conversation context
          const conversationContext = data.messages.map((msg: any) => ({
            role: msg.senderId === (data.conversation.visitorId || `visitor_${token}`) ? 'user' : 'assistant',
            content: `${msg.senderName}: ${msg.content}`,
            timestamp: new Date(msg._creationTime).toISOString(),
          }));

          const response = await fetch('/api/groq-autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'smart_replies',
              context: {
                conversationHistory: conversationContext,
                visitorName: data.conversation.visitorName,
                portfolioOwnerName: lastMessage.senderName,
                intent: 'professional_reply',
                lastMessage: lastMessage.content,
              },
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            setSuggestions(result.suggestions || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Failed to load suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    };
    
    loadSmartReplies();
  }, [data?.messages, data?.conversation]);

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-20">
        <div className="mb-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Conversation not found</h2>
          <p className="text-muted-foreground">
            This link may have expired or is invalid. Please check your email for the correct link.
          </p>
        </div>
      </div>
    );
  }

  const { conversation, messages } = data;

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation({
        portfolioUserId: conversation.portfolioUserId,
        senderId: conversation.visitorId || `visitor_${token}`,
        senderName: conversation.visitorName,
        content: message,
        conversationId: conversation._id,
        visitorEmail: conversation.visitorEmail,
      });
      setMessage("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Card className="flex-1 flex flex-col shadow-lg m-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Conversation</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Continue your professional conversation with ease
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied! You can return anytime.");
              }}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </Button>
          </div>
        </div>

        {/* Messages - Fixed Scrolling */}
        <div className="flex-1 overflow-y-auto p-6" ref={messagesContainerRef}>
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            
            {messages.map((msg: any, index: number) => {
              const isVisitor = msg.senderId === conversation.visitorId || msg.senderId.startsWith('visitor_');
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
              
              return (
                <div
                  key={msg._id}
                  className={`flex gap-3 ${isVisitor ? "flex-row-reverse" : ""}`}
                >
                  {showAvatar ? (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={isVisitor ? "bg-primary text-primary-foreground" : "bg-muted"}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 flex-shrink-0" />
                  )}

                  <div className={`flex-1 max-w-[70%] ${isVisitor ? "text-right" : ""}`}>
                    {showAvatar && (
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {msg.senderName}
                      </p>
                    )}
                    <div
                      className={`inline-block p-4 rounded-2xl break-words shadow-sm ${
                        isVisitor
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isVisitor ? "justify-end" : ""}`}>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg._creationTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {isVisitor && msg.readAt && (
                        <CheckCheck className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Smart Reply Suggestions */}
        {showSuggestions && suggestions.length > 0 && !message && (
          <div className="px-6 py-3 border-t bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Smart Replies</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-xs"
                  onClick={() => {
                    setMessage(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input Area with AI Autocomplete */}
        <div className="border-t p-4 bg-muted/20 flex-shrink-0">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target.value && showSuggestions) {
                    setShowSuggestions(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply... (Press Enter to send)"
                className="resize-none min-h-[60px] max-h-[200px] pr-10"
                disabled={isSending}
              />
              {message && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                      onClick={async () => {
                        setIsLoadingSuggestions(true);
                        try {
                          const response = await fetch('/api/groq-autocomplete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'autocompletions',
                              messageIntent: 'professional',
                              visitorName: conversation.visitorName,
                              visitorCompany: 'Company',
                              portfolioOwnerName: messages[0]?.senderName || 'Portfolio Owner',
                              currentMessage: message,
                              portfolioContext: {},
                            }),
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            setSuggestions(result.suggestions || []);
                          }
                        } catch (error) {
                          console.error('Failed to load autocomplete:', error);
                        } finally {
                          setIsLoadingSuggestions(false);
                        }
                      }}
                    >
                      {isLoadingSuggestions ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lightbulb className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <Command>
                      <CommandList>
                        <CommandGroup heading="AI Suggestions">
                          {suggestions.map((suggestion, idx) => (
                            <CommandItem
                              key={idx}
                              onSelect={() => {
                                setMessage(suggestion);
                              }}
                              className="cursor-pointer"
                            >
                              <span className="text-sm">{suggestion}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <Button 
              onClick={handleSend} 
              disabled={!message.trim() || isSending}
              size="lg"
              className="px-6"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>Context-aware AI suggestions • Click</span>
            <Lightbulb className="h-3 w-3 text-primary" />
            <span>for smart completions</span>
          </p>
        </div>
      </Card>
    </div>
  );
}

