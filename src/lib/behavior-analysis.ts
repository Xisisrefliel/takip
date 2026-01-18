import { db } from "@/db";
import { userMovies, reviews, userBehaviorPatterns } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Analyze and cache user behavior patterns
 * Run this manually for testing or via cron job for production
 */
export async function analyzeBehaviorPatterns(userId: string) {
  const watchHistory = await db
    .select()
    .from(userMovies)
    .where(eq(userMovies.userId, userId))
    .orderBy(userMovies.watchedDate);

  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId));

  // Calculate metrics
  const watchingVelocity = calculateVelocity(watchHistory);
  const explorationScore = calculateExploration(watchHistory);
  const consistencyScore = calculateConsistency(watchHistory, userReviews);
  const temporalPatterns = analyzeTemporalPatterns(watchHistory);
  const bingePatterns = detectBingeBehavior(watchHistory);
  const ratingDistribution = calculateRatingDistribution(userReviews);
  const genreProgression = analyzeGenreProgression(watchHistory);

  // Upsert to database (store as integers * 100 for precision)
  await db
    .insert(userBehaviorPatterns)
    .values({
      userId,
      watchingVelocity: Math.round(watchingVelocity * 100), // Store as integer
      explorationScore: Math.round(explorationScore * 100),
      consistencyScore: Math.round(consistencyScore * 100),
      temporalPatterns: JSON.stringify(temporalPatterns),
      bingePatterns: JSON.stringify(bingePatterns),
      ratingDistribution: JSON.stringify(ratingDistribution),
      genreProgression: JSON.stringify(genreProgression),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userBehaviorPatterns.userId,
      set: {
        watchingVelocity: Math.round(watchingVelocity * 100),
        explorationScore: Math.round(explorationScore * 100),
        consistencyScore: Math.round(consistencyScore * 100),
        temporalPatterns: JSON.stringify(temporalPatterns),
        bingePatterns: JSON.stringify(bingePatterns),
        ratingDistribution: JSON.stringify(ratingDistribution),
        genreProgression: JSON.stringify(genreProgression),
        updatedAt: new Date(),
      },
    });

  return {
    userId,
    watchingVelocity,
    explorationScore,
    consistencyScore,
    temporalPatterns,
    bingePatterns,
    ratingDistribution,
    genreProgression,
  };
}

function calculateVelocity(history: any[]): number {
  const last90Days = history.filter((m) => {
    if (!m.watchedDate) return false;
    const daysSince = (Date.now() - m.watchedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 90;
  });

  return last90Days.length / (90 / 7); // per week
}

function calculateExploration(history: any[]): number {
  const genres = new Set<string>();
  history.forEach((m) => {
    const movieGenres = JSON.parse(m.genres || "[]");
    movieGenres.forEach((g: string) => genres.add(g));
  });

  return history.length > 0 ? Math.min(1, genres.size / (history.length * 0.3)) : 0.5;
}

function calculateConsistency(history: any[], reviews: any[]): number {
  if (reviews.length < 5) return 0.5;

  const ratings = reviews.map((r) => r.rating).filter(Boolean);
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
  const stdDev = Math.sqrt(variance);

  // Lower std dev = higher consistency
  return Math.max(0, Math.min(1, 1 - stdDev / 2));
}

function analyzeTemporalPatterns(history: any[]): any {
  const byHour = new Map<number, number>();
  const byDayOfWeek = new Map<number, number>();

  history.forEach((m) => {
    if (!m.watchedDate) return;
    const date = new Date(m.watchedDate);
    const hour = date.getHours();
    const day = date.getDay();

    byHour.set(hour, (byHour.get(hour) || 0) + 1);
    byDayOfWeek.set(day, (byDayOfWeek.get(day) || 0) + 1);
  });

  return {
    hourDistribution: Object.fromEntries(byHour),
    dayDistribution: Object.fromEntries(byDayOfWeek),
  };
}

function detectBingeBehavior(history: any[]): any {
  let bingeCount = 0;
  let currentDate: Date | null = null;
  let dailyCount = 0;

  for (const movie of history) {
    if (!movie.watchedDate) continue;
    const date = new Date(movie.watchedDate);

    if (currentDate && isSameDay(date, currentDate)) {
      dailyCount++;
      if (dailyCount >= 3) bingeCount++;
    } else {
      currentDate = date;
      dailyCount = 1;
    }
  }

  return {
    isBinger: bingeCount > history.length * 0.1,
    bingeFrequency: history.length > 0 ? bingeCount / history.length : 0,
  };
}

function calculateRatingDistribution(reviews: any[]): any {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (r.rating) dist[r.rating as keyof typeof dist]++;
  });
  return dist;
}

function analyzeGenreProgression(history: any[]): any {
  // Track how genres evolve over time (first 25% vs last 25%)
  const quarter = Math.floor(history.length / 4);
  const early = history.slice(0, quarter);
  const recent = history.slice(-quarter);

  const earlyGenres = new Map<string, number>();
  const recentGenres = new Map<string, number>();

  early.forEach((m) => {
    JSON.parse(m.genres || "[]").forEach((g: string) => {
      earlyGenres.set(g, (earlyGenres.get(g) || 0) + 1);
    });
  });

  recent.forEach((m) => {
    JSON.parse(m.genres || "[]").forEach((g: string) => {
      recentGenres.set(g, (recentGenres.get(g) || 0) + 1);
    });
  });

  return {
    earlyGenres: Object.fromEntries(earlyGenres),
    recentGenres: Object.fromEntries(recentGenres),
  };
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
