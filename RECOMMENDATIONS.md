# Enhanced Recommendation System

## Overview

The recommendation system now analyzes **13+ signals** to provide deeply personalized movie recommendations, including production companies, countries, streaming platforms, and behavioral patterns.

## How Behavioral Patterns Work

### On-Demand Calculation (Current)
Behavioral patterns are calculated **automatically** when recommendations are fetched:

- **Where**: `src/lib/recommendations.ts` → `getUserPreferences()` function
- **When**: Every time a user requests recommendations
- **Performance**: Fast for most users, may be slower for users with 1000+ watched movies

### Optional Caching (For Performance)
You can pre-compute and cache patterns for better performance:

```bash
# Analyze patterns for a specific user
bun analyze-behavior <userId>

# Example
bun analyze-behavior user_cm7abc123xyz
```

This stores results in the `user_behavior_patterns` table, which are then used by `getUserPreferences()` instead of recalculating.

## Metrics Explained

### 1. Watching Velocity
**What it measures**: How many movies per week the user watches (over last 90 days)

**How it's used**:
- High velocity users (>5 movies/week) → Get more popular, mainstream recommendations
- Low velocity users (<5 movies/week) → Get more hidden gems and critically acclaimed films

### 2. Exploration Score (0-100%)
**What it measures**: Genre diversity compared to total movies watched

**How it's used**:
- High exploration (>70%) → System recommends more content outside comfort zone
- Low exploration (<30%) → System sticks to proven favorites

### 3. Consistency Score (0-100%)
**What it measures**: How consistent are the user's ratings (low standard deviation = high consistency)

**How it's used**:
- High consistency → System is more confident in predictions
- Low consistency → System provides more diverse options

### 4. Quality Threshold
**What it measures**: Minimum rating the user typically enjoys (based on 25th percentile of their ratings)

**How it's used**:
- Critical users (threshold 8+) → Only recommend 8+ rated movies
- Generous users (threshold 6-) → Can recommend 6.5+ rated movies

### 5. Binge Behavior
**What it measures**: Does user watch 3+ movies in a single day frequently?

**How it's used**:
- Currently for analysis only
- Future: Could influence recommendation timing and batch sizes

## Production Metadata Analysis

### Production Companies
Tracks which studios/production companies user prefers:
- **Examples**: A24, Pixar, Studio Ghibli, Marvel Studios
- **Weight**: 0-7 points in scoring algorithm
- **Penalty**: -5 points for disliked studios

### Production Countries
Tracks country/region preferences:
- **Examples**: Korean cinema, French films, Japanese anime
- **Weight**: 0-4 points in scoring algorithm
- **Discovery**: Helps surface international cinema

### Streaming Platforms
Tracks which platforms user's liked movies are on:
- **Examples**: Netflix, HBO Max, Criterion Channel
- **Currently**: Analysis only
- **Future**: Could filter recommendations by available platforms

## Negative Learning

The system learns what to AVOID:

### Low Ratings (1-2 stars)
When you rate something poorly, system tracks:
- **Disliked genres**: Avoids genres with >70% negative rate
- **Disliked directors**: Never recommends movies from directors you dislike
- **Disliked studios**: Heavy penalty for studios you consistently dislike
- **Disliked themes**: Avoids keyword/themes from low-rated movies

### Smart Filtering
- Occasional dislikes in favorite genres don't trigger avoidance
- Only true patterns (>5 exposures, <30% positive rate) count as dislikes

## Scoring Algorithm

Each recommendation gets scored across 13 dimensions:

1. **Genre Matching** (0-10 pts) - With negative penalties
2. **Director Match** (0-8 pts) - Strong weight for favorites
3. **Actor Match** (0-6 pts) - Top 10 cast checked
4. **Production Company** (0-7 pts) - Studio preferences
5. **Production Country** (0-4 pts) - Regional preferences
6. **Quality Alignment** (0-8 pts) - Matches user's threshold
7. **Runtime Fit** (0-3 pts) - Within preferred range
8. **Decade Preference** (0-2 pts) - Era preferences
9. **Keyword/Theme** (0-5 pts) - Thematic matching
10. **Recent Trends** (0-3 pts) - What you've watched lately
11. **Popularity Balance** (0-3 pts) - Popular vs hidden gems
12. **Exploration Bonus** (0-2 pts) - For adventurous users
13. **Source Multiplier** (0.9-1.2x) - Confidence adjustment

**Result**: 20 highly scored, diverse recommendations

## Diversity Filtering

Prevents over-representation:
- **Max 7 movies per genre** (limit/3)
- **Max 7 movies per decade** (limit/3)
- **Max 2 movies per director**
- **Max 4 movies per studio**
- **Max 10 movies per country** (limit/2)

## Testing Recommendations

### Check Current Patterns
```bash
bun analyze-behavior <userId>
```

Output shows:
- Watching velocity
- Exploration score
- Consistency score
- Binge behavior
- Rating distribution

### Debug Recommendations
The recommendation engine logs to console:
```
[EnhancedRecommendations] Generated 20 recommendations in XXXms
```

### View Cached Data
Check `user_behavior_patterns` table in your database to see cached metrics.

## Performance

**Current Performance**:
- Cold calculation: 200-500ms for typical users
- With caching: 50-100ms

**Optimization Options**:
1. Run `bun analyze-behavior` for all users nightly (via cron)
2. Implement Redis caching for getUserPreferences
3. Add database indexes on new columns (already applied)

## Future Enhancements

### Phase 10+ (Optional)
- **Automated cron job**: Daily pattern analysis for all active users
- **Platform filtering**: "Only show Netflix movies"
- **Temporal recommendations**: Different recs based on time of day
- **Collaborative filtering**: "Users like you also enjoyed..."
- **Explanation UI**: Show why each movie was recommended

## Troubleshooting

**Q: Recommendations seem generic?**
- User needs more watch history (minimum 10 liked movies recommended)
- Check if behavioral patterns are calculated (run analyze-behavior)

**Q: Getting same studio repeatedly?**
- Diversity filter limits to 4 per studio
- May indicate user has strong preference for that studio

**Q: No recommendations showing?**
- Check user has liked at least 1 movie
- Verify database migration ran successfully
- Check console for errors

**Q: Performance issues?**
- Run `bun analyze-behavior` for heavy users to cache patterns
- Consider adding Redis caching layer
