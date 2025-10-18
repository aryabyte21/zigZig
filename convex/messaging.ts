import { query, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Public Queries

/**
 * Get all conversations for a portfolio owner with real-time updates
 */
export const getConversations = query({
  args: { 
    portfolioUserId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_portfolio_user", (q) => 
        q.eq("portfolioUserId", args.portfolioUserId)
      )
      .order("desc")
      .take(limit);

    return conversations;
  },
});

/**
 * Get paginated messages for a specific conversation
 */
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    messages: v.array(v.any()),
    nextCursor: v.optional(v.string()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => 
        q.eq("conversationId", args.conversationId)
      )
      .order("desc");

    if (args.cursor) {
      // Implement cursor-based pagination
      query = query.filter((q) => q.lt(q.field("_creationTime"), parseInt(args.cursor!)));
    }

    const messages = await query.take(limit + 1);
    
    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? resultMessages[resultMessages.length - 1]._creationTime.toString() : undefined;

    return {
      messages: resultMessages.reverse(), // Return in chronological order
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get conversation analytics for dashboard
 */
export const getConversationAnalytics = query({
  args: { 
    userId: v.string(),
    period: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const period = args.period ?? "weekly";
    
    const analytics = await ctx.db
      .query("dm_analytics")
      .withIndex("by_user_period", (q) => 
        q.eq("userId", args.userId).eq("period", period)
      )
      .first();

    if (!analytics) {
      // Return default analytics structure
      return {
        messagesReceived: 0,
        messagesReplied: 0,
        avgResponseTime: 0,
        topCategories: [],
        conversionRate: 0,
        aiReplyRate: 0,
      };
    }

    return analytics;
  },
});

/**
 * Get job referrals for a user
 */
export const getJobReferrals = query({
  args: { 
    userId: v.string(),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("job_referrals")
      .withIndex("by_recipient", (q) => q.eq("toUserId", args.userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const referrals = await query
      .order("desc")
      .take(100);

    return referrals;
  },
});

// Public Mutations

/**
 * Send a new message with AI classification
 */
export const sendMessage = mutation({
  args: {
    portfolioUserId: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    content: v.string(),
    messageType: v.optional(v.string()),
    visitorEmail: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
  },
  returns: v.object({
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
  }),
  handler: async (ctx, args) => {
    const messageType = args.messageType ?? "text";
    const now = Date.now();

    let conversationId = args.conversationId;

    // Create or find existing conversation
    if (!conversationId) {
      // Check if conversation already exists
      const existingConversation = await ctx.db
        .query("conversations")
        .withIndex("by_portfolio_user", (q) => 
          q.eq("portfolioUserId", args.portfolioUserId)
        )
        .filter((q) => q.eq(q.field("visitorEmail"), args.visitorEmail))
        .first();

      if (existingConversation) {
        conversationId = existingConversation._id;
      } else {
        // Create new conversation
        conversationId = await ctx.db.insert("conversations", {
          portfolioUserId: args.portfolioUserId,
          visitorId: args.senderId !== args.portfolioUserId ? args.senderId : undefined,
          visitorEmail: args.visitorEmail,
          visitorName: args.senderName,
          lastMessageAt: now,
          status: "active",
          unreadCount: args.senderId !== args.portfolioUserId ? 1 : 0,
          category: "uncategorized", // Will be updated by AI
          priority: 3, // Default priority, will be updated by AI
        });
      }
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId: args.senderId,
      senderName: args.senderName,
      content: args.content, // TODO: Encrypt in production
      messageType: messageType as any,
      aiGenerated: false,
      sentiment: undefined, // Will be analyzed by AI
      metadata: {},
    });

    // Update conversation
    const conversation = await ctx.db.get(conversationId);
    if (conversation) {
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        unreadCount: args.senderId !== args.portfolioUserId 
          ? conversation.unreadCount + 1 
          : conversation.unreadCount,
      });
    }

    // Schedule AI processing
    await ctx.scheduler.runAfter(0, internal.messaging.categorizeMessage, {
      messageId,
      conversationId,
    });

    return { messageId, conversationId };
  },
});

/**
 * Mark messages as read
 */
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all unread messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => 
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .collect();

    // Mark messages as read
    for (const message of messages) {
      if (message.senderId !== args.userId) {
        await ctx.db.patch(message._id, { readAt: now });
      }
    }

    // Reset unread count
    await ctx.db.patch(args.conversationId, { unreadCount: 0 });

    return null;
  },
});

/**
 * Archive or delete a conversation
 */
export const archiveConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    action: v.union(v.literal("archive"), v.literal("spam"), v.literal("delete")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || conversation.portfolioUserId !== args.userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    if (args.action === "delete") {
      // Delete all messages first
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => 
          q.eq("conversationId", args.conversationId)
        )
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      // Delete conversation
      await ctx.db.delete(args.conversationId);
    } else {
      // Update status
      await ctx.db.patch(args.conversationId, {
        status: args.action as any,
      });
    }

    return null;
  },
});

/**
 * Send a job referral to another user
 */
export const sendJobReferral = mutation({
  args: {
    fromUserId: v.string(),
    toUserId: v.string(),
    jobId: v.string(),
    message: v.string(),
    matchScore: v.optional(v.number()),
  },
  returns: v.id("job_referrals"),
  handler: async (ctx, args) => {
    const referralId = await ctx.db.insert("job_referrals", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      jobId: args.jobId,
      message: args.message,
      status: "pending",
      matchScore: args.matchScore ?? 0.5,
      createdAt: Date.now(),
    });

    return referralId;
  },
});

// Internal Actions (AI-powered)

/**
 * Internal mutation to update message and conversation data
 */
export const updateMessageAnalysis = internalMutation({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    category: v.string(),
    priority: v.number(),
    sentiment: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update conversation with AI analysis
    await ctx.db.patch(args.conversationId, {
      category: args.category,
      priority: args.priority,
    });

    // Update message with sentiment
    await ctx.db.patch(args.messageId, {
      sentiment: args.sentiment,
    });

    return null;
  },
});

/**
 * Categorize message using AI and update conversation
 */
export const categorizeMessage = internalAction({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // For now, using simplified logic that will be replaced with actual AI calls
      // In production, this would call the AI service from lib/ai/super-dm.ts
      
      let category = "general";
      let priority = 3;
      let sentiment = "neutral";

      // Simple categorization logic (placeholder)
      // TODO: Replace with actual AI integration
      
      // Update the database using internal mutation
      await ctx.runMutation(internal.messaging.updateMessageAnalysis, {
        messageId: args.messageId,
        conversationId: args.conversationId,
        category,
        priority,
        sentiment,
      });

      // Generate auto-reply if appropriate
      if (category === "hiring" && priority >= 4) {
        await ctx.scheduler.runAfter(2000, internal.messaging.generateAutoReply, {
          conversationId: args.conversationId,
          triggerMessageId: args.messageId,
        });
      }

      // Update analytics
      await ctx.scheduler.runAfter(0, internal.messaging.updateAnalytics, {
        userId: "placeholder", // Will be passed from the calling function
        period: "daily",
        increment: { messagesReceived: 1 },
      });

    } catch (error) {
      console.error("Message categorization error:", error);
    }

    return null;
  },
});

/**
 * Internal mutation to create auto-reply message
 */
export const createAutoReplyMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    portfolioUserId: v.string(),
    content: v.string(),
    triggerMessageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.portfolioUserId,
      senderName: "AI Assistant",
      content: args.content,
      messageType: "ai_reply",
      aiGenerated: true,
      sentiment: "positive",
      metadata: { triggerMessageId: args.triggerMessageId },
    });

    return null;
  },
});

/**
 * Generate auto-reply using AI
 */
export const generateAutoReply = internalAction({
  args: {
    conversationId: v.id("conversations"),
    triggerMessageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // This will be implemented with Gemini 2.5 Flash
      // For now, return a simple acknowledgment
      
      // Simple auto-reply logic (will be replaced with AI)
      const autoReplyContent = "Thank you for your message! I'll get back to you soon.";

      // Use internal mutation to create the message
      await ctx.runMutation(internal.messaging.createAutoReplyMessage, {
        conversationId: args.conversationId,
        portfolioUserId: "placeholder", // TODO: Get from conversation
        content: autoReplyContent,
        triggerMessageId: args.triggerMessageId,
      });

    } catch (error) {
      console.error("Auto-reply generation error:", error);
    }

    return null;
  },
});

/**
 * Analyze message sentiment using AI
 */
export const analyzeMessageSentiment = internalAction({
  args: {
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // This will be implemented with Gemini integration
      // For now, use simple sentiment analysis
      
      // Simple sentiment analysis (will be replaced with AI)
      let sentiment = "neutral";
      
      // TODO: Get message content and analyze with AI
      // For now, just update with neutral sentiment
      
      // Use internal mutation to update sentiment
      await ctx.runMutation(internal.messaging.updateMessageAnalysis, {
        messageId: args.messageId,
        conversationId: "placeholder" as any, // TODO: Get from message
        category: "general",
        priority: 3,
        sentiment,
      });

    } catch (error) {
      console.error("Sentiment analysis error:", error);
    }

    return null;
  },
});

/**
 * Update analytics for a user
 */
export const updateAnalytics = internalMutation({
  args: {
    userId: v.string(),
    period: v.string(),
    increment: v.object({
      messagesReceived: v.optional(v.number()),
      messagesReplied: v.optional(v.number()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dm_analytics")
      .withIndex("by_user_period", (q) => 
        q.eq("userId", args.userId).eq("period", args.period)
      )
      .first();

    if (existing) {
      const updates: any = {};
      if (args.increment.messagesReceived) {
        updates.messagesReceived = existing.messagesReceived + args.increment.messagesReceived;
      }
      if (args.increment.messagesReplied) {
        updates.messagesReplied = existing.messagesReplied + args.increment.messagesReplied;
      }
      
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("dm_analytics", {
        userId: args.userId,
        period: args.period,
        messagesReceived: args.increment.messagesReceived ?? 0,
        messagesReplied: args.increment.messagesReplied ?? 0,
        avgResponseTime: 0,
        topCategories: [],
        conversionRate: 0,
        aiReplyRate: 0,
      });
    }

    return null;
  },
});
