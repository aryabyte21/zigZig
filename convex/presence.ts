import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Update user presence status
 * Called when user is active in the app
 */
export const updatePresence = mutation({
  args: {
    userId: v.string(),
    status: v.union(v.literal("online"), v.literal("away")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingPresence) {
      // Update existing presence
      await ctx.db.patch(existingPresence._id, {
        status: args.status,
        lastSeen: Date.now(),
      });
    } else {
      // Create new presence record
      await ctx.db.insert("presence", {
        userId: args.userId,
        status: args.status,
        lastSeen: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Get user's current presence status
 * Returns online, away, or offline based on last activity
 */
export const getPresence = query({
  args: { userId: v.string() },
  returns: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!presence) return "offline";

    // Consider offline after 5 minutes of inactivity
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (presence.lastSeen < fiveMinutesAgo) return "offline";

    return presence.status;
  },
});

/**
 * Get multiple users' presence at once
 * Efficient for inbox/conversation lists
 */
export const getBulkPresence = query({
  args: { userIds: v.array(v.string()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
    })
  ),
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const results = await Promise.all(
      args.userIds.map(async (userId) => {
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        if (!presence || presence.lastSeen < fiveMinutesAgo) {
          return { userId, status: "offline" as const };
        }

        return { userId, status: presence.status };
      })
    );

    return results;
  },
});

/**
 * Automatically set user to away after period of inactivity
 * This should be called periodically by the client
 */
export const heartbeat = mutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (presence) {
      await ctx.db.patch(presence._id, {
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        userId: args.userId,
        status: "online",
        lastSeen: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Set user to offline explicitly
 */
export const goOffline = mutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (presence) {
      await ctx.db.patch(presence._id, {
        status: "away",
        lastSeen: Date.now(),
      });
    }

    return null;
  },
});

