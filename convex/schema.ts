import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  watchlist: defineTable({
    mediaId: v.string(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
  }),
});