"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Send, 
  Sparkles,
  Building2,
  User,
  CheckCheck,
  Check,
  Zap,
  MessageSquare,
  Clock,
  ArrowRight,
  Lightbulb,
  Bot,
  Paperclip
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { generateAutocompletions, suggestCompanies, generateMessageTemplate, analyzeMessageQuality } from "@/lib/ai/groq-autocomplete";

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
  const [visitorCompany, setVisitorCompany] = useState("");
  const [messageIntent, setMessageIntent] = useState<string>("");
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const [hasIntroduced, setHasIntroduced] = useState(false);
  
  // Enhanced UI state
  const [autocompletions, setAutocompletions] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [isLoadingAutocompletions, setIsLoadingAutocompletions] = useState(false);
  const [messageQuality, setMessageQuality] = useState<{ score: number; suggestions: string[] } | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Get contextual placeholder text based on intent
  const getPlaceholderText = () => {
    switch (messageIntent) {
      case 'Hiring':
        return "Hi! I'm looking for a [role] at [company]. I was impressed by your [specific project/skill]. Are you open to discussing opportunities?";
      case 'Collaboration':
        return "Hi! I'm working on [project type] and think your expertise in [skill] would be perfect. Would you be interested in collaborating?";
      case 'Networking':
        return "Hi! I came across your portfolio and loved your work on [specific project]. I'd love to connect and learn more about your experience with [technology/field].";
      default:
        return "Hi! I'd love to connect about...";
    }
  };

  // Generate autocompletions using Groq
  const handleGenerateAutocompletions = useCallback(async () => {
    if (!message.trim() || !messageIntent) return;
    
    setIsLoadingAutocompletions(true);
    try {
      const suggestions = await generateAutocompletions({
        messageIntent,
        visitorName,
        visitorCompany,
        portfolioOwnerName,
        currentMessage: message,
        portfolioContext: {
          skills: [], // TODO: Get from portfolio data
          projects: [],
          experience: ""
        }
      });
      setAutocompletions(suggestions);
    } catch (error) {
      console.error('Autocomplete error:', error);
    } finally {
      setIsLoadingAutocompletions(false);
    }
  }, [message, messageIntent, visitorName, visitorCompany, portfolioOwnerName]);

  // Handle company input with suggestions
  const handleCompanyChange = useCallback(async (value: string) => {
    setVisitorCompany(value);
    if (value.length >= 2) {
      try {
        const suggestions = await suggestCompanies(value);
        setCompanySuggestions(suggestions);
      } catch (error) {
        console.error('Company suggestion error:', error);
      }
    } else {
      setCompanySuggestions([]);
    }
  }, []);

  // Generate message template
  const handleGenerateTemplate = useCallback(async () => {
    if (!messageIntent) return;
    
    try {
      const template = await generateMessageTemplate(messageIntent, {
        visitorCompany,
        portfolioOwnerName,
        portfolioContext: {
          skills: [], // TODO: Get from portfolio data
          projects: [],
          experience: ""
        }
      });
      setMessage(template);
      setShowTemplate(false);
    } catch (error) {
      console.error('Template generation error:', error);
    }
  }, [messageIntent, visitorCompany, portfolioOwnerName]);

  // Analyze message quality
  const handleAnalyzeMessage = useCallback(async () => {
    if (!message.trim() || !messageIntent) return;
    
    try {
      const analysis = await analyzeMessageQuality(message, messageIntent);
      setMessageQuality(analysis);
    } catch (error) {
      console.error('Message analysis error:', error);
    }
  }, [message, messageIntent]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim()) return;

    // If this is the first message, we need visitor info
    if (!hasIntroduced && (!visitorName.trim() || !visitorEmail.trim() || !messageIntent)) {
      toast.error("Please fill in all required fields!");
      return;
    }

    try {
      // Create enriched message content for first message
      const enrichedContent = !hasIntroduced ? 
        `${message.trim()}\n\n---\nCompany: ${visitorCompany || 'Not specified'}\nIntent: ${messageIntent}\nEmail: ${visitorEmail}` :
        message.trim();

      const result = await sendMessageMutation({
        portfolioUserId,
        senderId: visitorId,
        senderName: visitorName || "Anonymous",
        content: enrichedContent,
        visitorEmail: visitorEmail || undefined,
        conversationId: conversationId || undefined,
        metadata: !hasIntroduced ? {
          company: visitorCompany,
          intent: messageIntent,
        } : undefined,
      });

      setConversationId(result.conversationId);
      setMessage("");
      setHasIntroduced(true);
      
      // Show magic link toast for first message
      if (result.magicLink && !hasIntroduced) {
        toast.success(
          "Message sent! 🎉",
          {
            description: `Check your email (${visitorEmail}) for a link to return to this conversation anytime.`,
            action: {
              label: "Copy Link",
              onClick: () => {
                navigator.clipboard.writeText(result.magicLink!);
                toast.success("Link copied to clipboard!");
              },
            },
            duration: 10000,
          }
        );
      } else {
        toast.success("Message sent!");
      }
      
      // Focus back to input
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  }, [message, visitorName, visitorEmail, visitorCompany, messageIntent, hasIntroduced, portfolioUserId, visitorId, conversationId, sendMessageMutation]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (conversationId && messages?.messages) {
      markAsReadMutation({ conversationId, userId: visitorId });
    }
  }, [conversationId, messages, visitorId, markAsReadMutation]);

  // Modern step-by-step introduction form
  if (!hasIntroduced) {
    const steps = [
      { title: "About You", icon: User },
      { title: "Your Intent", icon: MessageSquare },
      { title: "Your Message", icon: Send }
    ];

    return (
      <div className="flex flex-col h-full">
        {/* Header with progress */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Connect with {portfolioOwnerName}</h3>
            <p className="text-sm text-muted-foreground">
              Professional networking made simple
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted ? 'bg-primary text-primary-foreground' :
                    isActive ? 'bg-primary/20 text-primary border-2 border-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-px mx-2 transition-all ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full"
                  autoFocus
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={visitorCompany}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    placeholder="Your company name"
                    className="w-full pl-10"
                  />
                </div>
                {companySuggestions.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 shadow-lg">
                    <CardContent className="p-2">
                      {companySuggestions.map((company, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => {
                            setVisitorCompany(company);
                            setCompanySuggestions([]);
                          }}
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          {company}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">What brings you here?</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'Hiring', icon: '💼', title: 'Hiring Opportunity', desc: 'Looking to recruit talent' },
                    { key: 'Collaboration', icon: '🤝', title: 'Project Collaboration', desc: 'Want to work together' },
                    { key: 'Networking', icon: '🌐', title: 'Professional Networking', desc: 'Building connections' },
                    { key: 'Other', icon: '💬', title: 'Something Else', desc: 'Other professional inquiry' }
                  ].map((intent) => (
                    <Card
                      key={intent.key}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        messageIntent === intent.key ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setMessageIntent(intent.key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{intent.icon}</div>
                          <div>
                            <h4 className="font-medium">{intent.title}</h4>
                            <p className="text-sm text-muted-foreground">{intent.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Your Message</label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateTemplate}
                    disabled={!messageIntent}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAutocompletions}
                    disabled={!message.trim() || isLoadingAutocompletions}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    {isLoadingAutocompletions ? 'Loading...' : 'Suggestions'}
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  ref={messageTextareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={getPlaceholderText()}
                  className="w-full min-h-[120px] p-4 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                />
                
                {/* Message Quality Indicator */}
                {messageQuality && (
                  <div className="absolute top-2 right-2">
                    <Badge variant={messageQuality.score >= 8 ? "default" : messageQuality.score >= 6 ? "secondary" : "destructive"}>
                      {messageQuality.score}/10
                    </Badge>
                  </div>
                )}
              </div>

              {/* AI Autocompletions */}
              {autocompletions.length > 0 && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center mb-2">
                      <Lightbulb className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm font-medium">AI Suggestions</span>
                    </div>
                    <div className="space-y-2">
                      {autocompletions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setMessage(suggestion)}
                        >
                          <ArrowRight className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="text-xs">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Context Tips */}
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      {messageIntent === 'Hiring' && 'Include the role, timeline, and what specifically caught your attention about their work.'}
                      {messageIntent === 'Collaboration' && 'Describe your project, timeline, and how their skills would contribute.'}
                      {messageIntent === 'Networking' && 'Mention shared interests, mutual connections, or specific projects that impressed you.'}
                      {messageIntent === 'Other' && 'Be specific about your inquiry and what you hope to achieve.'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/20 flex-shrink-0">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            {currentStep < 2 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 0 && (!visitorName.trim() || !visitorEmail.trim())) ||
                  (currentStep === 1 && !messageIntent)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            )}
          </div>
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
                <div className={`rounded-2xl px-4 py-2 break-words ${
                  msg.senderId === visitorId
                    ? "bg-primary text-primary-foreground"
                    : msg.aiGenerated
                    ? "bg-muted border border-border"
                    : "bg-muted"
                }`}>
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  
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
      <div className="border-t p-4 flex-shrink-0">
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

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Smart Quick Actions */}
        {hasIntroduced && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Thanks for your response! When would be a good time for a quick call?")}
              className="text-xs"
            >
              📅 Schedule Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("Could you share more details about your experience with [specific technology]?")}
              className="text-xs"
            >
              🔍 Learn More
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage("I'd love to see some examples of your work in this area.")}
              className="text-xs"
            >
              👀 See Examples
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
