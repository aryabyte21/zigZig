"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, Lightbulb, Bot } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface InboxReplyInputProps {
  conversationId: Id<"conversations">;
  userId: string;
  onMessageSent?: () => void;
}

export function InboxReplyInput({ conversationId, userId, onMessageSent }: InboxReplyInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get conversation messages for context
  const messagesData = useQuery(api.messaging.getMessages, { 
    conversationId, 
    limit: 20 
  });
  
  // Get conversation details
  const conversationData = useQuery(api.messaging.getConversations, { 
    portfolioUserId: userId, 
    limit: 1 
  });
  
  const sendMessageMutation = useMutation(api.messaging.sendMessage);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Load smart reply suggestions when conversation loads
  useEffect(() => {
    const loadSmartReplies = async () => {
      if (!messagesData?.messages || messagesData.messages.length === 0) return;
      
      const conversation = conversationData?.find(c => c._id === conversationId);
      if (!conversation) return;

      const lastMessage = messagesData.messages[messagesData.messages.length - 1];
      const isFromVisitor = lastMessage.senderId !== userId;
      
      if (isFromVisitor && !message) {
        setIsLoadingSuggestions(true);
        try {
          // Build full conversation context
          const conversationContext = messagesData.messages.map((msg: any) => ({
            role: msg.senderId === userId ? 'assistant' : 'user',
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
                visitorName: conversation.visitorName,
                portfolioOwnerName: 'Portfolio Owner', // TODO: Get from user profile
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
  }, [messagesData?.messages, conversationData, conversationId, userId, message]);

  // Generate AI autocomplete suggestions
  const generateAutocompleteSuggestions = async () => {
    if (!message.trim() || !messagesData?.messages) return;

    setIsLoadingSuggestions(true);
    try {
      const conversation = conversationData?.find(c => c._id === conversationId);
      if (!conversation) return;

      // Build full conversation context
      const conversationContext = messagesData.messages.map((msg: any) => ({
        role: msg.senderId === userId ? 'assistant' : 'user',
        content: `${msg.senderName}: ${msg.content}`,
        timestamp: new Date(msg._creationTime).toISOString(),
      }));

      const response = await fetch('/api/groq-autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'autocompletions',
          messageIntent: 'professional',
          visitorName: conversation.visitorName,
          visitorCompany: 'Company',
          portfolioOwnerName: 'Portfolio Owner', // TODO: Get from user profile
          currentMessage: message,
          portfolioContext: {
            conversationHistory: conversationContext
          },
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
  };

  // Enhanced message with AI
  const enhanceMessage = async () => {
    if (!message.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const response = await fetch("/api/enhance-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance",
          draft: message.trim(),
          intent: "professional_reply",
          context: { conversationId },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.enhanced || data.corrected || message);
        toast.success("Message enhanced!", {
          description: data.improvements?.join(", ") || "Grammar and tone improved",
        });
      } else {
        toast.error("Failed to enhance message");
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      toast.error("Failed to enhance message");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    console.log("💬 UI: Sending message from inbox", {
      userId,
      conversationId,
      messageLength: message.trim().length,
      timestamp: new Date().toISOString()
    });

    setIsSending(true);
    try {
      const result = await sendMessageMutation({
        portfolioUserId: userId,
        senderId: userId,
        senderName: "Portfolio Owner", // TODO: Get real name from profile
        content: message.trim(),
        conversationId,
      });

      console.log("✅ UI: Message sent successfully", result);

      setMessage("");
      setSuggestions([]);
      toast.success("Message sent!");
      onMessageSent?.();
    } catch (error) {
      console.error("❌ UI: Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Hide smart suggestions when typing
    if (value && showSuggestions) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Smart Reply Suggestions */}
      {showSuggestions && suggestions.length > 0 && !message && (
        <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {isLoadingSuggestions ? "Generating suggestions..." : "Smart Replies"}
            </span>
          </div>
          {isLoadingSuggestions ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-32 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
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
          )}
        </div>
      )}

      {/* Message Input with Enhanced Features */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type your professional reply..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[200px] resize-none pr-20"
            disabled={isSending}
          />
          
          {/* AI Enhancement Buttons */}
          <div className="absolute right-2 top-2 flex gap-1">
            {message.trim() && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={generateAutocompleteSuggestions}
                      disabled={isLoadingSuggestions}
                      title="AI Autocomplete"
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
                        <CommandGroup heading="AI Autocomplete Suggestions">
                          {suggestions.length > 0 ? (
                            suggestions.map((suggestion, idx) => (
                              <CommandItem
                                key={idx}
                                onSelect={() => {
                                  setMessage(suggestion);
                                }}
                                className="cursor-pointer"
                              >
                                <span className="text-sm">{suggestion}</span>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              Click to generate suggestions
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={enhanceMessage}
                  disabled={isEnhancing}
                  title="Enhance with AI"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-orange-500" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          size="lg"
          className="self-end px-6"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Sparkles className="h-3 w-3" />
        <span>Context-aware AI • Click</span>
        <Lightbulb className="h-3 w-3 text-primary" />
        <span>for completions •</span>
        <Sparkles className="h-3 w-3 text-orange-500" />
        <span>to enhance</span>
      </p>
    </div>
  );
}
