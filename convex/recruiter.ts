import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Queries
 */

// Get all active cached portfolios
export const getActivePortfolios = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const portfolios: Array<any> = await ctx.db
      .query("cached_portfolios")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return portfolios;
  },
});

// Get paginated matches for a job (sorted by score)
export const getJobMatches = query({
  args: {
    jobId: v.string(),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("liked"),
      v.literal("passed"),
      v.literal("super_liked"),
      v.literal("all")
    )),
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const { jobId, status = "pending", limit = 50, minScore = 0 } = args;
    
    let matchesQuery = ctx.db
      .query("candidate_matches")
      .withIndex("by_job_and_score", (q) => q.eq("jobId", jobId));
    
    const allMatches: Array<any> = await matchesQuery.collect();
    
    // Filter by status and score
    const filtered = allMatches.filter(match => {
      const statusMatch = status === "all" || match.status === status;
      const scoreMatch = match.matchScore >= minScore;
      return statusMatch && scoreMatch;
    });
    
    // Sort by score descending
    const sorted = filtered.sort((a, b) => b.matchScore - a.matchScore);
    
    // Apply limit
    return sorted.slice(0, limit);
  },
});

// Get full details for a specific candidate match
export const getMatchDetails = query({
  args: {
    matchId: v.id("candidate_matches"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    return match;
  },
});

// Get recruiter's activity stats for a job
export const getRecruiterStats = query({
  args: {
    jobId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const matches: Array<any> = await ctx.db
      .query("candidate_matches")
      .withIndex("by_job_and_score", (q) => q.eq("jobId", args.jobId))
      .collect();
    
    const stats = {
      total_matches: matches.length,
      viewed_count: matches.filter(m => m.viewedAt !== undefined).length,
      liked_count: matches.filter(m => m.status === "liked").length,
      passed_count: matches.filter(m => m.status === "passed").length,
      super_liked_count: matches.filter(m => m.status === "super_liked").length,
      pending_count: matches.filter(m => m.status === "pending").length,
      average_match_score: matches.length > 0
        ? matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length
        : 0,
    };
    
    return stats;
  },
});

// Get cached portfolio by user ID
export const getCachedPortfolio = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const portfolio = await ctx.db
      .query("cached_portfolios")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return portfolio;
  },
});

// Get candidate matches for a job with status filter
export const getCandidateMatches = query({
  args: {
    jobId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("liked"),
      v.literal("passed"),
      v.literal("super_liked")
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const matches: Array<any> = await ctx.db
      .query("candidate_matches")
      .withIndex("by_job_and_status", (q) => 
        q.eq("jobId", args.jobId).eq("status", args.status)
      )
      .collect();
    
    // Extract candidate info from matchDetails and add to top level
    const enrichedMatches = matches.map(match => ({
      ...match,
      candidateName: match.matchDetails?.candidate_name,
      candidateTitle: match.matchDetails?.candidate_title,
      candidateLocation: match.matchDetails?.candidate_location,
      candidateAvatar: match.matchDetails?.candidate_avatar,
      candidateSkills: match.matchDetails?.candidate_skills,
      candidateExperienceYears: match.matchDetails?.candidate_experience_years,
      candidatePortfolioSlug: match.matchDetails?.candidate_portfolio_slug,
      candidateGithub: match.matchDetails?.candidate_github,
      candidateLinkedin: match.matchDetails?.candidate_linkedin,
      candidateCompanies: match.matchDetails?.candidate_companies,
      candidateEducation: match.matchDetails?.candidate_education,
    }));
    
    // Sort by match score descending
    return enrichedMatches.sort((a, b) => b.matchScore - a.matchScore);
  },
});

/**
 * Mutations
 */

// Store/update parsed portfolio data
export const cachePortfolio = mutation({
  args: {
    userId: v.string(),
    portfolioId: v.string(),
    parsedData: v.any(),
    isActive: v.boolean(),
  },
  returns: v.id("cached_portfolios"),
  handler: async (ctx, args) => {
    // Check if portfolio already exists
    const existing = await ctx.db
      .query("cached_portfolios")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existing) {
      // Update existing portfolio
      await ctx.db.patch(existing._id, {
        portfolioId: args.portfolioId,
        parsedData: args.parsedData,
        lastUpdated: Date.now(),
        isActive: args.isActive,
      });
      return existing._id;
    } else {
      // Create new portfolio cache
      const portfolioId: Id<"cached_portfolios"> = await ctx.db.insert("cached_portfolios", {
        userId: args.userId,
        portfolioId: args.portfolioId,
        parsedData: args.parsedData,
        lastUpdated: Date.now(),
        isActive: args.isActive,
      });
      return portfolioId;
    }
  },
});

// Bulk insert candidate matches
export const createMatches = mutation({
  args: {
    matches: v.array(v.object({
      jobId: v.string(),
      candidateUserId: v.string(),
      portfolioId: v.string(),
      matchScore: v.number(),
      matchReasons: v.array(v.string()),
      matchDetails: v.any(),
    })),
  },
  returns: v.array(v.id("candidate_matches")),
  handler: async (ctx, args) => {
    const matchIds: Array<Id<"candidate_matches">> = [];
    
    for (const match of args.matches) {
      const matchId: Id<"candidate_matches"> = await ctx.db.insert("candidate_matches", {
        ...match,
        status: "pending" as const,
      });
      matchIds.push(matchId);
    }
    
    return matchIds;
  },
});

// Update match status (like/pass/super_like)
export const updateMatchStatus = mutation({
  args: {
    matchId: v.id("candidate_matches"),
    status: v.union(
      v.literal("liked"),
      v.literal("passed"),
      v.literal("super_liked")
    ),
    jobId: v.string(),
    candidateUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, {
      status: args.status,
      decidedAt: Date.now(),
    });
    return null;
  },
});

// Mark match as viewed
export const markMatchViewed = mutation({
  args: {
    matchId: v.id("candidate_matches"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (match && !match.viewedAt) {
      await ctx.db.patch(args.matchId, {
        viewedAt: Date.now(),
      });
    }
    return null;
  },
});

// Track recruiter actions
export const logActivity = mutation({
  args: {
    userId: v.string(),
    jobId: v.string(),
    action: v.string(),
    candidateUserId: v.string(),
  },
  returns: v.id("recruiter_activity"),
  handler: async (ctx, args) => {
    const activityId: Id<"recruiter_activity"> = await ctx.db.insert("recruiter_activity", {
      ...args,
      timestamp: Date.now(),
    });
    return activityId;
  },
});

// Delete all matches for a job (for re-matching)
export const deleteJobMatches = mutation({
  args: {
    jobId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const matches: Array<any> = await ctx.db
      .query("candidate_matches")
      .withIndex("by_job_and_score", (q) => q.eq("jobId", args.jobId))
      .collect();
    
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }
    
    return null;
  },
});

/**
 * Internal Actions (can be called from API routes)
 */

// Internal mutation for batch operations
export const batchCachePortfolios = internalMutation({
  args: {
    portfolios: v.array(v.object({
      userId: v.string(),
      portfolioId: v.string(),
      parsedData: v.any(),
      isActive: v.boolean(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const portfolio of args.portfolios) {
      const existing = await ctx.db
        .query("cached_portfolios")
        .withIndex("by_user", (q) => q.eq("userId", portfolio.userId))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          portfolioId: portfolio.portfolioId,
          parsedData: portfolio.parsedData,
          lastUpdated: Date.now(),
          isActive: portfolio.isActive,
        });
      } else {
        await ctx.db.insert("cached_portfolios", {
          userId: portfolio.userId,
          portfolioId: portfolio.portfolioId,
          parsedData: portfolio.parsedData,
          lastUpdated: Date.now(),
          isActive: portfolio.isActive,
        });
      }
    }
    return null;
  },
});


