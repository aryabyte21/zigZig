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
    <div className="flex h-full bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0 bg-muted/50"
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
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? "bg-primary/10 border-l-4 border-primary shadow-sm" 
                        : "hover:bg-muted/50 border-l-4 border-transparent"
                      }
                    `}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={isSelected ? "bg-primary/20 text-primary" : ""}>
                        {conversation.visitorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium text-sm truncate ${isSelected ? "text-primary" : ""}`}>
                          {conversation.visitorName}
                        </h4>
                        <div className="flex items-center gap-1">
                          {conversation.unreadCount > 0 && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                              {conversation.unreadCount}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {conversation.category}
                        </span>
                        {conversation.priority >= 4 && (
                          <Badge variant="secondary" className="h-4 text-xs px-1">
                            <Zap className="h-2 w-2 mr-1" />
                            High
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">No conversations found</p>
                <p className="text-xs mt-1">
                  {searchQuery ? "Try adjusting your search" : "Conversations will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border bg-gradient-to-r from-background to-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {selectedConv.visitorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{selectedConv.visitorName}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedConv.visitorEmail}</span>
                    {selectedConv.unreadCount > 0 && (
                      <Badge variant="secondary" className="h-5 text-xs">
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
                  <DropdownMenuItem onClick={() => handleArchive(selectedConv._id, "archive")}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleArchive(selectedConv._id, "spam")}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as Spam
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
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-muted/5 to-background min-h-0">
              <div className="space-y-4 max-w-4xl mx-auto" style={{ minHeight: 'calc(100vh - 300px)' }}>
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
                        className={`flex gap-3 ${isOwner ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={
                            message.aiGenerated 
                              ? "bg-primary text-primary-foreground" 
                              : isOwner
                              ? "bg-primary/10 text-primary"
                              : "bg-muted"
                          }>
                            {message.aiGenerated ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              message.senderName.charAt(0).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className={`max-w-[70%] ${isOwner ? "text-right" : ""}`}>
                          {/* Sender name for consecutive messages */}
                          {!isOwner && (
                            <p className="text-xs font-medium text-muted-foreground mb-1 px-1">
                              {message.senderName}
                            </p>
                          )}
                          
                          <div className={`
                            rounded-2xl px-4 py-3 text-sm shadow-sm border-0 transition-all duration-200
                            ${isOwner 
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25" 
                              : "bg-white border border-gray-200 text-gray-900 shadow-gray-200/50"
                            }
                          `}>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                          
                          <div className={`flex items-center gap-2 mt-2 px-1 ${isOwner ? "justify-end" : ""}`}>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message._creationTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            
                            {message.aiGenerated && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                                <Bot className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            
                            {isOwner && message.readAt && (
                              <div className="text-xs text-blue-600 flex items-center gap-0.5">
                                <CheckCheck className="h-3 w-3" />
                                Read
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                      <p className="text-muted-foreground">
                        Send a message to begin your professional dialogue
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Input */}
            <div className="border-t p-6 bg-gradient-to-t from-muted/5 to-background flex-shrink-0">
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/20 to-background">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20"></div>
                <MessageSquare className="relative h-16 w-16 text-blue-500 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Select a conversation
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Choose a conversation from the sidebar to view messages and reply with AI-powered suggestions
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>AI-enhanced messaging • Context-aware replies</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
