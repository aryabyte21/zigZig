"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Archive, 
  Trash2, 
  Star, 
  MessageSquare, 
  Clock,
  TrendingUp,
  Bot,
  CheckCircle,
  AlertTriangle,
  Users,
  Briefcase,
  Network,
  Handshake
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface InboxDashboardProps {
  userId: string;
}

interface Conversation {
  _id: Id<"conversations">;
  _creationTime: number;
  portfolioUserId: string;
  visitorId?: string;
  visitorEmail?: string;
  visitorName: string;
  lastMessageAt: number;
  status: "active" | "archived" | "spam";
  unreadCount: number;
  category: string;
  priority: number;
}

export function InboxDashboard({ userId }: InboxDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);

  // Convex queries
  const conversations = useQuery(api.messaging.getConversations, { 
    portfolioUserId: userId,
    limit: 100 
  });

  const analytics = useQuery(api.messaging.getConversationAnalytics, { 
    userId,
    period: "weekly" 
  });

  const messages = useQuery(
    api.messaging.getMessages,
    selectedConversation ? { conversationId: selectedConversation, limit: 50 } : "skip"
  );

  // Mutations
  const archiveConversationMutation = useMutation(api.messaging.archiveConversation);
  const markAsReadMutation = useMutation(api.messaging.markAsRead);

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];

    let filtered = conversations.filter((conv: Conversation) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          conv.visitorName.toLowerCase().includes(query) ||
          conv.visitorEmail?.toLowerCase().includes(query) ||
          conv.category.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((conv: Conversation) => conv.category === selectedCategory);
    }

    // Sort by priority and last message time
    return filtered.sort((a: Conversation, b: Conversation) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return b.lastMessageAt - a.lastMessageAt; // More recent first
    });
  }, [conversations, searchQuery, selectedCategory]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!conversations) return {};
    
    const counts: Record<string, number> = {};
    conversations.forEach((conv: Conversation) => {
      counts[conv.category] = (counts[conv.category] || 0) + 1;
    });
    return counts;
  }, [conversations]);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: Id<"conversations">) => {
    setSelectedConversation(conversationId);
    
    // Mark as read
    try {
      await markAsReadMutation({ conversationId, userId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Handle archive conversation
  const handleArchiveConversation = async (conversationId: Id<"conversations">, action: "archive" | "spam" | "delete") => {
    try {
      await archiveConversationMutation({ conversationId, userId, action });
      toast.success(`Conversation ${action}d successfully`);
      
      // Clear selection if archived conversation was selected
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error(`Failed to ${action} conversation:`, error);
      toast.error(`Failed to ${action} conversation`);
    }
  };

  // Get category icon and color
  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case "hiring":
        return { icon: Briefcase, color: "text-green-600 bg-green-100 dark:bg-green-900/20" };
      case "networking":
        return { icon: Network, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20" };
      case "collaboration":
        return { icon: Handshake, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20" };
      case "spam":
        return { icon: AlertTriangle, color: "text-red-600 bg-red-100 dark:bg-red-900/20" };
      default:
        return { icon: MessageSquare, color: "text-gray-600 bg-gray-100 dark:bg-gray-900/20" };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return "border-l-red-500";
    if (priority >= 4) return "border-l-orange-500";
    if (priority >= 3) return "border-l-yellow-500";
    return "border-l-gray-300";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
      {/* Conversations List */}
      <div className="lg:col-span-1 space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                All ({conversations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="hiring" className="text-xs">
                Jobs ({categoryCounts.hiring || 0})
              </TabsTrigger>
              <TabsTrigger value="networking" className="text-xs">
                Network ({categoryCounts.networking || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {filteredConversations.map((conversation: Conversation) => {
              const categoryDisplay = getCategoryDisplay(conversation.category);
              const CategoryIcon = categoryDisplay.icon;
              
              return (
                <Card
                  key={conversation._id}
                  className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getPriorityColor(conversation.priority)} ${
                    selectedConversation === conversation._id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={categoryDisplay.color}>
                            <CategoryIcon className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm truncate">
                              {conversation.visitorName}
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.visitorEmail}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {conversation.category}
                            </Badge>
                            
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessageAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Message View */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <Card className="h-full">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {filteredConversations.find(c => c._id === selectedConversation)?.visitorName}
                  </CardTitle>
                  <CardDescription>
                    {filteredConversations.find(c => c._id === selectedConversation)?.visitorEmail}
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveConversation(selectedConversation, "archive")}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveConversation(selectedConversation, "spam")}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveConversation(selectedConversation, "delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 h-[calc(100%-120px)]">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages?.messages?.map((message: any) => (
                    <div
                      key={message._id}
                      className={`flex items-start space-x-3 ${
                        message.senderId === userId ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={
                          message.aiGenerated 
                            ? "bg-gradient-to-r from-green-400 to-blue-500 text-white" 
                            : message.senderId === userId
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200"
                        }>
                          {message.aiGenerated ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            message.senderName.charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`max-w-[70%] ${
                        message.senderId === userId ? "text-right" : ""
                      }`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.senderId === userId
                            ? "bg-blue-500 text-white"
                            : message.aiGenerated
                            ? "bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(message._creationTime).toLocaleTimeString()}
                          </span>
                          
                          {message.sentiment && (
                            <Badge variant="outline" className="text-xs">
                              {message.sentiment}
                            </Badge>
                          )}
                          
                          {message.aiGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <Bot className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to view messages and manage responses.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
