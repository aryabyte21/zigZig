import { query, mutation, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Create a new portfolio agent record
 */
export const createAgent = mutation({
  args: {
    userId: v.string(),
    portfolioId: v.string(),
    agentId: v.string(),
    voiceId: v.string(),
    agentUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("portfolio_agents"),
  handler: async (ctx, args) => {
    // Check if agent already exists for this portfolio
    const existing = await ctx.db
      .query("portfolio_agents")
      .withIndex("by_portfolio", (q) => q.eq("portfolioId", args.portfolioId))
      .first();

    const isActive = args.isActive !== undefined ? args.isActive : true;

    if (existing) {
      // Update existing agent
      await ctx.db.patch(existing._id, {
        agentId: args.agentId,
        voiceId: args.voiceId,
        agentUrl: args.agentUrl,
        isActive: isActive,
      });
      return existing._id;
    }

    // Create new agent
    return await ctx.db.insert("portfolio_agents", {
      userId: args.userId,
      portfolioId: args.portfolioId,
      agentId: args.agentId,
      voiceId: args.voiceId,
      agentUrl: args.agentUrl,
      conversationCount: 0,
      isActive: isActive,
    });
  },
});

/**
 * Get agent by portfolio ID
 */
export const getAgentByPortfolio = query({
  args: {
    portfolioId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("portfolio_agents"),
      _creationTime: v.number(),
      userId: v.string(),
      portfolioId: v.string(),
      agentId: v.string(),
      voiceId: v.string(),
      agentUrl: v.optional(v.string()),
      conversationCount: v.number(),
      lastConversationAt: v.optional(v.number()),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("portfolio_agents")
      .withIndex("by_portfolio", (q) => q.eq("portfolioId", args.portfolioId))
      .first();

    return agent || null;
  },
});

/**
 * Get agent by user ID
 */
export const getAgentByUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("portfolio_agents"),
      _creationTime: v.number(),
      userId: v.string(),
      portfolioId: v.string(),
      agentId: v.string(),
      voiceId: v.string(),
      agentUrl: v.optional(v.string()),
      conversationCount: v.number(),
      lastConversationAt: v.optional(v.number()),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("portfolio_agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return agent || null;
  },
});

/**
 * Store a new conversation
 */
export const storeConversation = internalMutation({
  args: {
    agentId: v.string(),
    userId: v.string(),
    conversationId: v.string(),
    duration: v.number(),
    timestamp: v.number(),
    summary: v.optional(v.string()),
    visitorInfo: v.optional(v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    })),
  },
  returns: v.id("agent_conversations"),
  handler: async (ctx, args) => {
    // Check if conversation already exists
    const existing = await ctx.db
      .query("agent_conversations")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new conversation record
    const conversationId = await ctx.db.insert("agent_conversations", {
      agentId: args.agentId,
      userId: args.userId,
      conversationId: args.conversationId,
      duration: args.duration,
      timestamp: args.timestamp,
      summary: args.summary,
      visitorInfo: args.visitorInfo,
    });

    // Update agent's conversation count
    const agent = await ctx.db
      .query("portfolio_agents")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        conversationCount: agent.conversationCount + 1,
        lastConversationAt: args.timestamp,
      });
    }

    return conversationId;
  },
});

/**
 * Get conversations for a user
 */
export const getConversationsByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("agent_conversations"),
      _creationTime: v.number(),
      agentId: v.string(),
      userId: v.string(),
      conversationId: v.string(),
      duration: v.number(),
      timestamp: v.number(),
      summary: v.optional(v.string()),
      visitorInfo: v.optional(v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
      })),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const conversations = await ctx.db
      .query("agent_conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return conversations;
  },
});

/**
 * Get conversation stats for a user
 */
export const getConversationStats = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    totalConversations: v.number(),
    weeklyConversations: v.number(),
    avgDuration: v.number(),
  }),
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("agent_conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = allConversations.filter((c) => c.timestamp > weekAgo);

    const totalDuration = allConversations.reduce((sum, c) => sum + c.duration, 0);
    const avgDuration = allConversations.length > 0 ? totalDuration / allConversations.length : 0;

    return {
      totalConversations: allConversations.length,
      weeklyConversations: thisWeek.length,
      avgDuration: Math.round(avgDuration),
    };
  },
});

/**
 * Get all active agents for conversation sync (internal)
 */
export const getActiveAgents = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("portfolio_agents"),
      _creationTime: v.number(),
      userId: v.string(),
      portfolioId: v.string(),
      agentId: v.string(),
      voiceId: v.string(),
      agentUrl: v.optional(v.string()),
      conversationCount: v.number(),
      lastConversationAt: v.optional(v.number()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("portfolio_agents")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return agents;
  },
});

/**
 * Sync conversations from ElevenLabs for all active agents (cron job)
 */
export const syncConversations = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const agents = await ctx.runQuery(internal.agents.getActiveAgents);

    for (const agent of agents) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.agentId}&page_size=50`,
          {
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            },
          }
        );

        if (!response.ok) continue;

        const conversationList = await response.json();

        for (const conv of conversationList.conversations || []) {
          const detailResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
            {
              headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
              },
            }
          );

          if (!detailResponse.ok) continue;

          const fullConv = await detailResponse.json();

          const duration = fullConv.metadata?.duration_seconds || 0;
          const timestamp = fullConv.start_time_unix_secs
            ? fullConv.start_time_unix_secs * 1000
            : Date.now();

          const transcript = fullConv.transcript || '';
          const summary = transcript.substring(0, 200) || undefined;

          await ctx.runMutation(internal.agents.storeConversation, {
            agentId: agent.agentId,
            userId: agent.userId,
            conversationId: conv.conversation_id,
            duration,
            timestamp,
            summary,
            visitorInfo: undefined,
          });
        }
      } catch (error) {
        // Continue with next agent even if one fails
        continue;
      }
    }

    return null;
  },
});

