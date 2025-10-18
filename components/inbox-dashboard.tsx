"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DebugConversation } from "@/components/debug-conversation";
import { 
  Search, 
  Archive, 
  Trash2, 
  MessageSquare, 
  Bot,
  AlertTriangle,
  Briefcase,
  Network,
  Handshake,
  MoreHorizontal,
  Clock,
  Mail,
  Zap,
  CheckCheck
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { InboxReplyInput } from "@/components/inbox-reply-input";

interface InboxDashboardProps {
  userId: string;
}

export function InboxDashboard({ userId }: InboxDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);

  // Convex queries
  const conversations = useQuery(api.messaging.getConversations, { 
    portfolioUserId: userId,
    limit: 50 
  });

  const messages = useQuery(
    api.messaging.getMessages,
    selectedConversation ? { conversationId: selectedConversation, limit: 50 } : "skip"
  );

  // Mutations
  const archiveConversationMutation = useMutation(api.messaging.archiveConversation);
  const markAsReadMutation = useMutation(api.messaging.markAsRead);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];

    let filtered = conversations;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = conversations.filter((conv: any) => 
        conv.visitorName.toLowerCase().includes(query) ||
        conv.visitorEmail?.toLowerCase().includes(query)
      );
    }

    // Sort by unread first, then by last message time
    return filtered.sort((a: any, b: any) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      return b.lastMessageAt - a.lastMessageAt;
    });
  }, [conversations, searchQuery]);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: Id<"conversations">) => {
    setSelectedConversation(conversationId);
    
    try {
      await markAsReadMutation({ conversationId, userId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Auto-scroll to bottom when messages change
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.messages]);

  // Handle archive
  const handleArchive = async (conversationId: Id<"conversations">, action: "archive" | "spam") => {
    try {
      await archiveConversationMutation({ conversationId, userId, action });
      toast.success(`Conversation ${action === "archive" ? "archived" : "marked as spam"}`);
      
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      toast.error(`Failed to ${action} conversation`);
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hiring": return Briefcase;
      case "networking": return Network;
      case "collaboration": return Handshake;
      default: return MessageSquare;
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return "now";
    if (hours < 24) return `${Math.floor(hours)}h`;
    if (hours < 168) return `${Math.floor(hours / 24)}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const selectedConv = conversations?.find(c => c._id === selectedConversation);

  return (
    <div className="flex h-full max-h-full bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0 max-h-full">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {!conversations ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredConversations?.length > 0 ? (
              filteredConversations.map((conversation: any) => {
                const CategoryIcon = getCategoryIcon(conversation.category);
                const isSelected = selectedConversation === conversation._id;
                
                return (
                  <div
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation._id)}
                    className={`
                      flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                      ${isSelected 
                        ? "bg-muted border-l-2 border-foreground" 
                        : "hover:bg-muted/50"
                      }
                    `}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className={`text-sm ${isSelected ? "bg-foreground text-background" : "bg-muted"}`}>
                        {conversation.visitorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`font-medium text-sm truncate ${isSelected ? "font-semibold" : ""}`}>
                          {conversation.visitorName}
                        </h4>
                        <div className="flex items-center gap-1">
                          {conversation.unreadCount > 0 && (
                            <div className="bg-foreground text-background text-xs font-medium rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize truncate">
                          {conversation.category}
                        </span>
                        {conversation.priority >= 4 && (
                          <Badge variant="secondary" className="h-4 text-xs px-1.5">
                            High
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-4">
                <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  No conversations
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Messages will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col min-h-0 max-h-full">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-foreground text-background font-medium">
                    {selectedConv.visitorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-base font-semibold">
                    {selectedConv.visitorName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedConv.visitorEmail}</span>
                    {selectedConv.unreadCount > 0 && (
                      <Badge variant="secondary" className="h-4 text-xs px-1.5">
                        {selectedConv.unreadCount} new
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleArchive(selectedConv._id, "archive")} className="cursor-pointer">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleArchive(selectedConv._id, "spam")} className="cursor-pointer text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Spam
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Debug Component - Remove in production */}
            {/* <div className="p-4 border-b bg-muted/10">
              <DebugConversation 
                conversationId={selectedConv._id}
                currentUserId={userId}
              />
            </div> */}

            {/* Messages */}
            <div className="flex-1 overflow-hidden bg-background min-h-0">
              <div className="h-full overflow-y-auto p-4">
                <div className="space-y-3 max-w-4xl mx-auto pb-4">
                  {!messages ? (
                    // Loading skeleton for messages
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className={`max-w-[70%] ${i % 2 === 0 ? "text-right" : ""}`}>
                          <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
                          <Skeleton className="h-3 w-16 mt-2" />
                        </div>
                      </div>
                    ))
                  ) : messages.messages?.length > 0 ? (
                    messages.messages.map((message: any) => {
                      const isOwner = message.senderId === userId;
                      
                      return (
                        <div
                          key={message._id}
                          className={`flex gap-2.5 ${isOwner ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className={
                              message.aiGenerated || isOwner
                                ? "bg-foreground text-background text-xs" 
                                : "bg-muted text-xs"
                            }>
                              {message.aiGenerated ? (
                                <Bot className="h-3.5 w-3.5" />
                              ) : (
                                message.senderName.charAt(0).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>

                          <div className={`max-w-[70%] ${isOwner ? "text-right" : ""}`}>
                            {!isOwner && (
                              <p className="text-xs font-medium text-muted-foreground mb-1 px-1">
                                {message.senderName}
                              </p>
                            )}
                            
                            <div className={`
                              rounded-lg px-3 py-2 text-sm
                              ${isOwner 
                                ? "bg-foreground text-background" 
                                : "bg-muted"
                              }
                            `}>
                              {message.aiGenerated && (
                                <Badge variant="secondary" className="text-xs mb-1.5">
                                  <Bot className="h-2.5 w-2.5 mr-1" />
                                  AI
                                </Badge>
                              )}
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                            
                            <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwner ? "justify-end" : ""}`}>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message._creationTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              
                              {isOwner && message.readAt && (
                                <div className="text-xs flex items-center gap-0.5 text-muted-foreground">
                                  <CheckCheck className="h-3 w-3" />
                                  <span>Read</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-base font-semibold mb-2">
                          Start the conversation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Send a message to begin
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Reply Input */}
            <div className="border-t border-border p-4 bg-background flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                <InboxReplyInput 
                  conversationId={selectedConv._id}
                  userId={userId}
                  onMessageSent={() => {
                    // Refresh messages
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar to view and reply
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
