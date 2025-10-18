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
    magicToken: v.optional(v.string()), // Unique token for magic link access (optional for backward compatibility)
  }).index("by_portfolio_user", ["portfolioUserId", "lastMessageAt"])
    .index("by_visitor", ["visitorId"])
    .index("by_category", ["portfolioUserId", "category"])
    .index("by_magic_token", ["magicToken"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    senderName: v.string(),
    content: v.string(), // enriched with context
    messageType: v.union(v.literal("text"), v.literal("ai_reply")),
    sentiment: v.optional(v.string()), // AI-analyzed: "positive", "neutral", "negative"
    aiGenerated: v.boolean(),
    readAt: v.optional(v.number()),
    metadata: v.optional(v.any()), // company, intent, etc.
  }).index("by_conversation", ["conversationId"]),

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

  contact_intelligence: defineTable({
    conversationId: v.id("conversations"),
    visitorEmail: v.string(),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    companyInfo: v.optional(v.any()), // AI-enriched company data
    mutualConnections: v.optional(v.array(v.string())),
    intent: v.string(), // hiring, collaboration, networking, other
    urgency: v.optional(v.string()), // high, medium, low
    estimatedValue: v.optional(v.number()), // AI-estimated opportunity value
    followUpSuggestions: v.optional(v.array(v.string())),
  }).index("by_conversation", ["conversationId"])
    .index("by_email", ["visitorEmail"]),

  // Real-time presence tracking
  presence: defineTable({
    userId: v.string(),
    status: v.union(v.literal("online"), v.literal("away")),
    lastSeen: v.number(),
  }).index("by_user", ["userId"]),
});


