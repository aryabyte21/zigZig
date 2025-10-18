import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const cacheJobResults = mutation({
  args: {
    userId: v.string(),
    searchQuery: v.string(),
    skills: v.array(v.string()),
    results: v.any(),
  },
  handler: async (ctx, args) => {
    // Cache for 1 hour
    const ttl = Date.now() + 60 * 60 * 1000;
    
    await ctx.db.insert("job_cache", {
      ...args,
      timestamp: Date.now(),
      ttl,
    });
  },
});

export const getCachedResults = query({
  args: { userId: v.string(), searchQuery: v.string() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("job_cache")
      .withIndex("by_user_and_query", (q) =>
        q.eq("userId", args.userId).eq("searchQuery", args.searchQuery)
      )
      .first();
    
    if (cached && cached.ttl > Date.now()) {
      return cached.results;
    }
    return null;
  },
});

export const trackJobInteraction = mutation({
  args: {
    userId: v.string(),
    jobId: v.string(),
    action: v.union(v.literal("view"), v.literal("save"), v.literal("apply"), v.literal("dismiss")),
  },
  handler: async (ctx, args) => {
    // Get or create user preferences
    let preferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!preferences) {
      const prefId = await ctx.db.insert("user_preferences", {
        userId: args.userId,
        savedJobs: [],
        viewedJobs: [],
        appliedJobs: [],
        dismissedJobs: [],
        preferredCompanies: [],
        preferredLocations: [],
      });
      preferences = await ctx.db.get(prefId);
    }
    
    if (!preferences) return;
    
    // Update based on action
    const updates: any = {};
    
    switch (args.action) {
      case "view":
        if (!preferences.viewedJobs.includes(args.jobId)) {
          updates.viewedJobs = [...preferences.viewedJobs, args.jobId];
        }
        break;
      case "save":
        if (!preferences.savedJobs.includes(args.jobId)) {
          updates.savedJobs = [...preferences.savedJobs, args.jobId];
        }
        break;
      case "apply":
        if (!preferences.appliedJobs.includes(args.jobId)) {
          updates.appliedJobs = [...preferences.appliedJobs, args.jobId];
        }
        break;
      case "dismiss":
        if (!preferences.dismissedJobs.includes(args.jobId)) {
          updates.dismissedJobs = [...preferences.dismissedJobs, args.jobId];
        }
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(preferences._id, updates);
    }
  },
});

export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_preferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const generateJobRecommendations = mutation({
  args: {
    userId: v.string(),
    jobs: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    // Get user preferences for personalized recommendations
    const preferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!preferences) return;
    
    // Generate recommendations based on user interaction history
    const recommendations = args.jobs.map((job, index) => {
      let relevanceScore = 0.5;
      const matchReasons: string[] = [];
      
      // Boost score for previously saved companies
      if (preferences.preferredCompanies.some(company => 
        job.company.toLowerCase().includes(company.toLowerCase())
      )) {
        relevanceScore += 0.3;
        matchReasons.push("Company matches your preferences");
      }
      
      // Boost score for preferred locations
      if (preferences.preferredLocations.some(location => 
        job.location.toLowerCase().includes(location.toLowerCase())
      )) {
        relevanceScore += 0.2;
        matchReasons.push("Location matches your preferences");
      }
      
      // Penalize dismissed jobs
      if (preferences.dismissedJobs.includes(job.id)) {
        relevanceScore = 0.1;
        matchReasons.push("Previously dismissed");
      }
      
      return {
        userId: args.userId,
        jobId: job.id,
        relevanceScore: Math.min(relevanceScore, 1.0),
        matchReasons,
        timestamp: Date.now(),
      };
    });
    
    // Store recommendations
    for (const rec of recommendations) {
      await ctx.db.insert("job_recommendations", rec);
    }
  },
});

export const getJobRecommendations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("job_recommendations")
      .withIndex("by_user_score", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});


