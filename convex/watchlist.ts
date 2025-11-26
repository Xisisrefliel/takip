import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const addToWatchlist = mutation({
  args: {
    mediaId: v.string(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("watchlist", {
      mediaId: args.mediaId,
      mediaType: args.mediaType,
    });
  },
});