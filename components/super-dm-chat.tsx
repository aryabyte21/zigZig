"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Bot,
  User,
  CheckCheck,
  Check
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface Message {
  _id: Id<"messages">;
  _creationTime: number;
  conversationId: Id<"conversations">;
  senderId: string;
  senderName: string;
  content: string;
  messageType: "text" | "voice" | "ai_reply";
  aiGenerated: boolean;
  readAt?: number;
  sentiment?: string;
}

interface SuperDMChatProps {
  portfolioUserId: string;
  portfolioOwnerName: string;
  onClose?: () => void;
}

export function SuperDMChat({ portfolioUserId, portfolioOwnerName, onClose }: SuperDMChatProps) {
  const [message, setMessage] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate a unique visitor ID for this session
  const [visitorId] = useState(() => `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Convex queries and mutations
  const messages = useQuery(
    api.messaging.getMessages,
    conversationId ? { conversationId, limit: 50 } : "skip"
  );

  const sendMessageMutation = useMutation(api.messaging.sendMessage);
  const markAsReadMutation = useMutation(api.messaging.markAsRead);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim()) return;

    // If this is the first message, we need visitor info
    if (!hasIntroduced && (!visitorName.trim() || !visitorEmail.trim())) {
      toast.error("Please introduce yourself first!");
      return;
    }

    try {
      const result = await sendMessageMutation({
        portfolioUserId,
        senderId: visitorId,
        senderName: visitorName || "Anonymous",
        content: message.trim(),
        visitorEmail: visitorEmail || undefined,
        conversationId: conversationId || undefined,
      });

      setConversationId(result.conversationId);
      setMessage("");
      setHasIntroduced(true);
      
      // Focus back to input
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  }, [message, visitorName, visitorEmail, hasIntroduced, portfolioUserId, visitorId, conversationId, sendMessageMutation]);

  // Handle voice recording (placeholder for now)
  const handleVoiceRecording = useCallback(() => {
    setIsRecording(!isRecording);
    toast.info(isRecording ? "Voice recording stopped" : "Voice recording started");
    // TODO: Implement actual voice recording with MediaRecorder API
  }, [isRecording]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (conversationId && messages?.messages) {
      markAsReadMutation({ conversationId, userId: visitorId });
    }
  }, [conversationId, messages, visitorId, markAsReadMutation]);

  // Introduction form for first-time visitors
  if (!hasIntroduced) {
    return (
      <div className="flex flex-col h-full p-6 justify-center">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Introduce Yourself</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Let {portfolioOwnerName} know who you are before starting the conversation.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <Input
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input
              type="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Message</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to connect about..."
              className="w-full"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
          </div>

          <Button 
            onClick={handleSendMessage}
            className="w-full"
            disabled={!visitorName.trim() || !visitorEmail.trim() || !message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.messages?.map((msg: Message) => (
            <div
              key={msg._id}
              className={`flex items-start space-x-3 ${
                msg.senderId === visitorId ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={`text-xs ${
                  msg.aiGenerated 
                    ? "bg-primary text-primary-foreground" 
                    : msg.senderId === visitorId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {msg.aiGenerated ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    msg.senderName.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Message Bubble */}
              <div className={`flex flex-col max-w-[80%] ${
                msg.senderId === visitorId ? "items-end" : "items-start"
              }`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  msg.senderId === visitorId
                    ? "bg-primary text-primary-foreground"
                    : msg.aiGenerated
                    ? "bg-muted border border-border"
                    : "bg-muted"
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  
                  {/* AI Badge */}
                  {msg.aiGenerated && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      AI Reply
                    </Badge>
                  )}
                </div>

                {/* Message Info */}
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(msg._creationTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  
                  {/* Read Receipt */}
                  {msg.senderId === visitorId && (
                    <div className="text-muted-foreground">
                      {msg.readAt ? (
                        <CheckCheck className="h-3 w-3 text-primary" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  )}

                  {/* Sentiment Indicator */}
                  {msg.sentiment && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        msg.sentiment === "positive" ? "text-green-600 border-green-300" :
                        msg.sentiment === "negative" ? "text-red-600 border-red-300" :
                        "text-gray-600 border-gray-300"
                      }`}
                    >
                      {msg.sentiment}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator Placeholder */}
          {/* TODO: Implement real-time typing indicators */}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message Input */}
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          {/* Voice Recording Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleVoiceRecording}
            className={`${isRecording ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-gray-700"}`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Emoji Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage("Hi! I'm interested in discussing a potential opportunity.")}
            className="text-xs"
          >
            💼 Job Opportunity
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage("I'd love to collaborate on a project together.")}
            className="text-xs"
          >
            🤝 Collaboration
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage("Would you be interested in connecting and networking?")}
            className="text-xs"
          >
            🌐 Networking
          </Button>
        </div>
      </div>
    </div>
  );
}
