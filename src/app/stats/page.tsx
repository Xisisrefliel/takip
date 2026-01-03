import {
  BarChart3,
  FlameKindling,
  Gauge,
  Globe2,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import { getStatsData } from "./actions";
import { StatsCard } from "./components/StatsCard";
import { FilmsByYearChart } from "./components/FilmsByYearChart";
import { GenreChart } from "./components/GenreChart";
import { RatingDistribution } from "./components/RatingDistribution";
import { TopActorsGrid, TopDirectorsGrid } from "./components/TopPeopleGrid";

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const stats = await getStatsData();

  const runtimeHours = stats.totals
    ? Math.round((stats.totals.totalRuntimeMinutes / 60) * 10) / 10
    : 0;
  const hasData =
    (stats.totals && stats.totals.watchedCount > 0) ||
    (stats.favorites && stats.favorites.length > 0) ||
    (stats.filmsByYear && stats.filmsByYear.length > 0) ||
    (stats.genres && stats.genres.length > 0) ||
    (stats.actors && stats.actors.length > 0) ||
    (stats.directors && stats.directors.length > 0) ||
    (stats.ratings && stats.ratings.length > 0) ||
    (stats.recent && stats.recent.length > 0);

  if (stats.error) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-10 sm:pt-14">
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:max-w-4xl">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl p-8 text-foreground">
            <p className="text-sm font-semibold text-foreground">
              Stats unavailable
            </p>
            <p className="text-sm text-foreground/60 mt-2">{stats.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 pt-20 sm:pt-24">
      <div className="mx-auto w-full px-6 sm:px-8 md:px-12 lg:max-w-7xl">
        <Hero stats={stats} runtimeHours={runtimeHours} />

        {!hasData ? (
          <div className="mt-16 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl p-8 text-sm text-foreground/60">
            We could not find any stats for your profile yet. Log some movies or
            shows and come back for a cinematic pulse check.
          </div>
        ) : (
          <>
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.totals && (
                <>
                  <MiniStat
                    title="Watched"
                    value={stats.totals.watchedCount}
                    hint="entries in your diary"
                  />
                  <MiniStat
                    title="Hours logged"
                    value={runtimeHours}
                    hint="total runtime"
                  />
                  <MiniStat
                    title="Favorites"
                    value={stats.totals.likedCount}
                    hint="hearted titles"
                  />
                  <MiniStat
                    title="Watchlist"
                    value={stats.totals.watchlistCount}
                    hint="saved for later"
                  />
                </>
              )}
            </div>

            <div className="mt-12 columns-1 xl:columns-2 gap-6">
              {stats.filmsByYear && stats.filmsByYear.length > 0 && (
                <div className="break-inside-avoid mb-6 [column-span:all]">
                  <StatsCard
                    title="Films by year"
                    subtitle="Peaks, droughts, and new eras"
                    icon={<BarChart3 className="h-4 w-4" />}
                  >
                    <FilmsByYearChart data={stats.filmsByYear} />
                  </StatsCard>
                </div>
              )}

              {stats.genres && stats.genres.length > 0 && (
                <div className="break-inside-avoid mb-6">
                  <StatsCard
                    title="Genre gravity"
                    subtitle="Where you keep orbiting"
                    icon={<Globe2 className="h-4 w-4" />}
                    className="h-fit"
                  >
                    <GenreChart data={stats.genres} />
                  </StatsCard>
                </div>
              )}

              {stats.ratings && stats.ratings.length > 0 && (
                <div className="break-inside-avoid mb-6">
                  <StatsCard
                    title="Rating fingerprint"
                    subtitle="How generous are you?"
                    icon={<Gauge className="h-4 w-4" />}
                  >
                    <RatingDistribution data={stats.ratings} />
                  </StatsCard>
                </div>
              )}

              {stats.actors && stats.actors.length > 0 && (
                <div className="break-inside-avoid mb-6">
                  <StatsCard
                    title="Most watched cast"
                    subtitle="Faces that recur in your watch history"
                    icon={<Users className="h-4 w-4" />}
                  >
                    <TopActorsGrid data={stats.actors} />
                  </StatsCard>
                </div>
              )}

              {stats.directors && stats.directors.length > 0 && (
                <div className="break-inside-avoid mb-6">
                  <StatsCard
                    title="Directors you gravitate toward"
                    subtitle="Creative signatures you chase"
                    icon={<Layers className="h-4 w-4" />}
                  >
                    <TopDirectorsGrid data={stats.directors} />
                  </StatsCard>
                </div>
              )}

              {stats.decades && stats.decades.length > 0 && (
                <div className="break-inside-avoid mb-6">
                  <StatsCard
                    title="Decade affinity"
                    subtitle="Where your taste clusters"
                    icon={<Sparkles className="h-4 w-4" />}
                    className="h-fit"
                  >
                    <DecadeChips data={stats.decades} />
                  </StatsCard>
                </div>
              )}

              <div className="break-inside-avoid mb-6">
                <StatsCard
                  title="Energy lately"
                  subtitle="Snapshot of your recent pace"
                  icon={<FlameKindling className="h-4 w-4" />}
                >
                  <PulseCard stats={stats} />
                </StatsCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Hero({
  stats,
  runtimeHours,
}: {
  stats: Awaited<ReturnType<typeof getStatsData>>;
  runtimeHours: number;
}) {
  const watched = stats.totals?.watchedCount ?? 0;
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl px-8 py-12 sm:px-12 sm:py-16">
      <div className="flex flex-col gap-10">
        <div className="max-w-2xl space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-foreground/50">
            Cinematic fingerprint
          </p>
          <p className="max-w-xl text-base text-foreground/60 leading-relaxed">
            Live graphs, TMDB posters, and cast pulls that shimmer in a layout
            that adapts to what data you have.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-foreground/50">
          <Badge>{watched} logged</Badge>
          <Badge>{runtimeHours} hours</Badge>
          <Badge>{stats.totals?.likedCount ?? 0} favorites</Badge>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  title,
  value,
  hint,
}: {
  title: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl p-6">
      <p className="text-xs uppercase tracking-widest text-foreground/50 mb-3">
        {title}
      </p>
      <p className="text-4xl font-semibold text-foreground mb-2">{value}</p>
      <p className="text-xs text-foreground/50">{hint}</p>
    </div>
  );
}

function DecadeChips({
  data,
}: {
  data?: Awaited<ReturnType<typeof getStatsData>>["decades"];
}) {
  if (!data || data.length === 0)
    return <p className="text-sm text-foreground/60">No decade trends yet.</p>;
  return (
    <div className="flex flex-wrap gap-3">
      {data.map((decade) => (
        <span
          key={decade.decade}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2 text-xs text-foreground/70"
        >
          <span className="h-2 w-2 rounded-full bg-foreground/40" />
          {decade.decade} · {decade.count}
        </span>
      ))}
    </div>
  );
}

function PulseCard({
  stats,
}: {
  stats: Awaited<ReturnType<typeof getStatsData>>;
}) {
  const recentCount = stats.recent?.length ?? 0;
  const lastSeven = stats.recent?.slice(0, 7).length ?? 0;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 px-5 py-5">
        <p className="text-xs text-foreground/50 mb-2">Entries pulled</p>
        <p className="text-3xl font-semibold text-foreground">{recentCount}</p>
      </div>
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 px-5 py-5">
        <p className="text-xs text-foreground/50 mb-2">Past 7 items</p>
        <p className="text-3xl font-semibold text-foreground">{lastSeven}</p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-foreground/60">
      {children}
    </span>
  );
}
