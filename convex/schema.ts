import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Existing job-related tables
  job_cache: defineTable({
    userId: v.string(),
    searchQuery: v.string(),
    skills: v.array(v.string()),
    results: v.array(v.any()),
    timestamp: v.number(),
    ttl: v.number(), // 1 hour cache
  }).index("by_user_and_query", ["userId", "searchQuery"]),
  
  user_preferences: defineTable({
    userId: v.string(),
    savedJobs: v.array(v.string()),
    viewedJobs: v.array(v.string()),
    appliedJobs: v.array(v.string()),
    dismissedJobs: v.array(v.string()),
    preferredCompanies: v.array(v.string()),
    preferredLocations: v.array(v.string()),
  }).index("by_user", ["userId"]),
  
  job_recommendations: defineTable({
    userId: v.string(),
    jobId: v.string(),
    relevanceScore: v.number(),
    matchReasons: v.array(v.string()),
    timestamp: v.number(),
  }).index("by_user_score", ["userId", "relevanceScore"]),

  // SuperDM Chat System Tables
  conversations: defineTable({
    portfolioUserId: v.string(),
    visitorId: v.optional(v.string()),
    visitorEmail: v.optional(v.string()),
    visitorName: v.string(),
    lastMessageAt: v.number(),
    status: v.union(v.literal("active"), v.literal("archived"), v.literal("spam")),
    unreadCount: v.number(),
    category: v.string(), // AI-categorized: "hiring", "networking", "collaboration", "spam"
    priority: v.number(), // 1-5, AI-determined
    encryptionKey: v.optional(v.string()),
  }).index("by_portfolio_user", ["portfolioUserId", "lastMessageAt"])
    .index("by_visitor", ["visitorId"])
    .index("by_category", ["portfolioUserId", "category"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    senderName: v.string(),
    content: v.string(), // encrypted
    messageType: v.union(v.literal("text"), v.literal("voice"), v.literal("ai_reply")),
    voiceMessageUrl: v.optional(v.string()),
    transcription: v.optional(v.string()),
    sentiment: v.optional(v.string()), // AI-analyzed: "positive", "neutral", "negative"
    aiGenerated: v.boolean(),
    readAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_conversation", ["conversationId"]),

  voice_messages: defineTable({
    messageId: v.id("messages"),
    audioUrl: v.string(),
    duration: v.number(),
    transcription: v.string(),
    language: v.string(),
    generatedByAI: v.boolean(),
  }).index("by_message", ["messageId"]),

  job_referrals: defineTable({
    fromUserId: v.string(),
    toUserId: v.string(),
    jobId: v.string(),
    message: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    matchScore: v.number(),
    createdAt: v.number(),
  }).index("by_recipient", ["toUserId", "status"]),

  dm_analytics: defineTable({
    userId: v.string(),
    period: v.string(), // "daily", "weekly", "monthly"
    messagesReceived: v.number(),
    messagesReplied: v.number(),
    avgResponseTime: v.number(),
    topCategories: v.array(v.string()),
    conversionRate: v.number(), // visitors who got hired/connected
    aiReplyRate: v.number(),
  }).index("by_user_period", ["userId", "period"]),
});


