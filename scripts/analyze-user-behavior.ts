/**
 * Manual script to analyze and cache user behavior patterns
 *
 * Usage:
 *   bun run scripts/analyze-user-behavior.ts <userId>
 *
 * Example:
 *   bun run scripts/analyze-user-behavior.ts user_123abc
 */

import { analyzeBehaviorPatterns } from "../src/lib/behavior-analysis";

const userId = process.argv[2];

if (!userId) {
  console.error("❌ Error: userId is required");
  console.log("\nUsage:");
  console.log("  bun run scripts/analyze-user-behavior.ts <userId>");
  console.log("\nExample:");
  console.log("  bun run scripts/analyze-user-behavior.ts user_123abc");
  process.exit(1);
}

console.log(`\n🔍 Analyzing behavior patterns for user: ${userId}\n`);

analyzeBehaviorPatterns(userId)
  .then((result) => {
    console.log("✅ Analysis complete!\n");
    console.log("📊 Results:");
    console.log("─".repeat(50));
    console.log(`Watching Velocity: ${result.watchingVelocity.toFixed(2)} movies/week`);
    console.log(`Exploration Score: ${(result.explorationScore * 100).toFixed(0)}% (genre diversity)`);
    console.log(`Consistency Score: ${(result.consistencyScore * 100).toFixed(0)}% (rating consistency)`);
    console.log(`\nBinge Behavior:`);
    console.log(`  Is Binger: ${result.bingePatterns.isBinger ? "Yes" : "No"}`);
    console.log(`  Binge Frequency: ${(result.bingePatterns.bingeFrequency * 100).toFixed(1)}%`);
    console.log(`\nRating Distribution:`);
    Object.entries(result.ratingDistribution).forEach(([rating, count]) => {
      const stars = "★".repeat(parseInt(rating));
      const bar = "█".repeat(count as number);
      console.log(`  ${stars}: ${bar} (${count})`);
    });
    console.log("\n✅ Patterns cached in database successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error analyzing patterns:", error);
    process.exit(1);
  });
