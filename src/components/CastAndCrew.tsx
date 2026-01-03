"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Movie, CastMember, CrewMember, CountryRelease } from "@/types";

interface CastAndCrewProps {
  movie: Movie;
}

type TabType = "cast" | "crew" | "details" | "genres" | "releases";

function getCountryFlag(iso: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", JP: "🇯🇵", CN: "🇨🇳", KR: "🇰🇷",
    IN: "🇮🇳", IT: "🇮🇹", ES: "🇪🇸", CA: "🇨🇦", AU: "🇦🇺", BR: "🇧🇷", MX: "🇲🇽",
    RU: "🇷🇺", HK: "🇭🇰", NL: "🇳🇱", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰", FI: "🇫🇮",
    PL: "🇵🇱", CZ: "🇨🇿", HU: "🇭🇺", GR: "🇬🇷", PT: "🇵🇹", BE: "🇧🇪", AT: "🇦🇹",
    CH: "🇨🇭", IE: "🇮🇪", NZ: "🇳🇿", SG: "🇸🇬", TH: "🇹🇭", PH: "🇵🇭", ID: "🇮🇩",
    MY: "🇲🇾", VN: "🇻🇳", TW: "🇹🇼", AR: "🇦🇷", CL: "🇨🇱", CO: "🇨🇴", PE: "🇵🇪",
    VE: "🇻🇪", ZA: "🇿🇦", EG: "🇪🇬", NG: "🇳🇬", IL: "🇮🇱", AE: "🇦🇪", SA: "🇸🇦",
    TR: "🇹🇷", UA: "🇺🇦", RO: "🇷🇴", BG: "🇧🇬", SK: "🇸🇰", HR: "🇭🇷", SI: "🇸🇮",
    RS: "🇷🇸", LT: "🇱🇹", LV: "🇱🇻", EE: "🇪🇪", IS: "🇮🇸", CY: "🇨🇾", LU: "🇱🇺",
    MT: "🇲🇹", KW: "🇰🇼", QA: "🇶🇦", BH: "🇧🇭", OM: "🇴🇲", LB: "🇱🇧", JO: "🇯🇴",
    SY: "🇸🇾", IQ: "🇮🇶", AF: "🇦🇫", PK: "🇵🇰", BD: "🇧🇩", LK: "🇱🇰", NP: "🇳🇵",
    MM: "🇲🇲", KH: "🇰🇭", LA: "🇱🇦", MN: "🇲🇳", UZ: "🇺🇿", KZ: "🇰🇿", GE: "🇬🇪",
    AM: "🇦🇲", AZ: "🇦🇿", BY: "🇧🇾", MD: "🇲🇩", AL: "🇦🇱", MK: "🇲🇰", ME: "🇲🇪",
    BA: "🇧🇦", XK: "🇽🇰",
  };
  return flags[iso] || "";
}

function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatReleaseType(type: number): string {
  const types: Record<number, string> = {
    1: "Premiere", 2: "Theatrical", 3: "Theatrical", 4: "Digital", 5: "Physical", 6: "TV",
  };
  return types[type] || "";
}

// Chip component for consistent styling
function Chip({
  children,
  href,
  onClick,
  variant = "default",
  image
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "accent";
  image?: string | null;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = `
    inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium
    transition-all duration-200 ease-out
    border border-white/10 hover:border-accent/50
    hover:scale-[1.02] active:scale-[0.98]
    relative group
  `;

  const variantStyles = {
    default: "bg-white/5 hover:bg-white/10 text-foreground",
    accent: "bg-accent/20 text-accent hover:bg-accent/30",
  };

  const className = `${baseStyles} ${variantStyles[variant]}`;

  const Tooltip = image ? (
    <div
      className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-3
        w-24 h-32 rounded-lg overflow-hidden shadow-2xl
        border border-white/20 bg-surface z-50 pointer-events-none
        transition-all duration-200 ease-out origin-bottom
        ${isHovered ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"}
      `}
    >
      <div className="relative w-full h-full">
        <Image
          src={`https://image.tmdb.org/t/p/w185${image}`}
          alt=""
          fill
          className="object-cover"
          sizes="96px"
        />
        {/* Triangle arrow - simulated with pseudo-element or separate div */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-r border-b border-white/20 rotate-45" />
      </div>
    </div>
  ) : null;

  const content = (
    <>
      {Tooltip}
      {children}
    </>
  );

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const props = {
    className,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  };

  if (href) {
    return (
      <Link href={href} {...props}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} {...props}>
        {content}
      </button>
    );
  }

  return <span {...props}>{content}</span>;
}

// Row component for label + chips layout
function LabeledRow({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex items-center gap-2 shrink-0 w-48 sm:w-64">
        <span
          className="text-sm font-medium text-muted-foreground uppercase tracking-wider truncate"
          title={label}
        >
          {label}
        </span>
        <div className="flex-1 border-b border-dotted border-white/20" />
      </div>
      <div className="flex flex-wrap gap-2 flex-1">
        {children}
      </div>
    </div>
  );
}

// Tab navigation component
function TabNavigation({
  activeTab,
  onTabChange,
  tabs
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabs: { id: TabType; label: string; count?: number }[];
}) {
  return (
    <div className="flex gap-6 border-b border-border mb-4 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative pb-3 text-sm font-semibold uppercase tracking-wider
            transition-colors duration-200 whitespace-nowrap
            ${activeTab === tab.id
              ? "text-accent"
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// Cast tab content
function CastContent({
  cast,
  allCast,
  showAll,
  onToggleShowAll
}: {
  cast: CastMember[];
  allCast: CastMember[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const displayCast = showAll ? allCast : cast;
  const hasMore = allCast.length > cast.length;

  if (displayCast.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">No cast information available.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5 py-4">
      {displayCast.map((person) => (
        <Chip key={person.id} href={`/actor/${person.id}`} image={person.profilePath}>
          {person.name}
        </Chip>
      ))}
      {hasMore && !showAll && (
        <Chip onClick={onToggleShowAll} variant="accent">
          Show All...
        </Chip>
      )}
      {showAll && hasMore && (
        <Chip onClick={onToggleShowAll} variant="accent">
          Show Less
        </Chip>
      )}
    </div>
  );
}

// Crew tab content - grouped by job roles
function CrewContent({
  crewByDepartment,
  showAll,
  onToggleShowAll
}: {
  crewByDepartment: Record<string, CrewMember[]>;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  if (!crewByDepartment || Object.keys(crewByDepartment).length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">No crew information available.</p>
    );
  }

  // Group crew by their job (not department) for better display
  const crewByJob: Record<string, CrewMember[]> = {};

  Object.values(crewByDepartment).flat().forEach((member) => {
    const job = member.job;
    if (!crewByJob[job]) {
      crewByJob[job] = [];
    }
    // Avoid duplicates
    if (!crewByJob[job].find(m => m.id === member.id)) {
      crewByJob[job].push(member);
    }
  });

  // Define the order of jobs to display (most important first)
  const jobOrder = [
    "Director",
    "Producer",
    "Executive Producer",
    "Writer",
    "Screenplay",
    "Story",
    "Casting",
    "Editor",
    "Director of Photography",
    "Cinematography",
    "Original Music Composer",
    "Composer",
    "Music",
    "Sound Designer",
    "Sound",
    "Production Design",
    "Art Direction",
    "Costume Design",
    "Makeup",
    "Visual Effects Supervisor",
    "Visual Effects",
  ];

  // Sort jobs: prioritized ones first, then alphabetically
  const sortedJobs = Object.keys(crewByJob).sort((a, b) => {
    const aIndex = jobOrder.indexOf(a);
    const bIndex = jobOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  // Convert job to display label (pluralize if multiple members)
  const getJobLabel = (job: string, count: number): string => {
    if (count <= 1) return job.toUpperCase();

    // Simple pluralization rules
    const pluralMap: Record<string, string> = {
      "Director": "Directors",
      "Producer": "Producers",
      "Executive Producer": "Exec. Producers",
      "Writer": "Writers",
      "Editor": "Editors",
      "Composer": "Composers",
    };

    if (pluralMap[job]) return pluralMap[job].toUpperCase();
    if (job.endsWith("er")) return (job + "s").toUpperCase();
    if (job.endsWith("or")) return (job + "s").toUpperCase();
    return job.toUpperCase();
  };

  const displayJobs = showAll ? sortedJobs : sortedJobs.slice(0, 10);
  const hasMore = sortedJobs.length > 10;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12">
        {displayJobs.map((job) => {
          const members = crewByJob[job];
          return (
            <div key={job} className="border-b border-white/5 last:border-0 xl:last:border-0 xl:nth-last-2:border-0">
              <LabeledRow label={getJobLabel(job, members.length)}>
                {members.map((member) => (
                  <Chip
                    key={member.id}
                    href={member.job === "Director" ? `/director/${member.id}` : `/actor/${member.id}`}
                    image={member.profilePath}
                  >
                    {member.name}
                  </Chip>
                ))}
              </LabeledRow>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-start pt-2">
          <Chip onClick={onToggleShowAll} variant="accent">
            {showAll ? "Show Less" : `Show ${sortedJobs.length - 10} More Roles...`}
          </Chip>
        </div>
      )}
    </div>
  );
}

// Details tab content - matching the reference layout
function DetailsContent({ movie }: { movie: Movie }) {
  const studios = movie.productionCompanies || [];
  const countries = movie.productionCountries || [];

  const hasContent = studios.length > 0 || countries.length > 0;

  if (!hasContent) {
    return (
      <p className="text-muted-foreground text-sm py-4">No details available.</p>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {studios.length > 0 && (
        <LabeledRow label="STUDIOS">
          {studios.map((studio) => (
            <Chip key={studio.id}>
              {studio.name}
            </Chip>
          ))}
        </LabeledRow>
      )}

      {countries.length > 0 && (
        <LabeledRow label="COUNTRIES">
          {countries.map((country) => (
            <Chip key={country.iso}>
              {country.name}
            </Chip>
          ))}
        </LabeledRow>
      )}
    </div>
  );
}

// Genres tab content
function GenresContent({ genres }: { genres: string[] }) {
  if (!genres || genres.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">No genres available.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5 py-4">
      {genres.map((genre) => (
        <Chip key={genre}>
          {genre}
        </Chip>
      ))}
    </div>
  );
}

// Releases tab content
function ReleasesContent({
  releaseDates,
  showAll,
  onToggleShowAll
}: {
  releaseDates: CountryRelease[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  if (!releaseDates || releaseDates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">No release information available.</p>
    );
  }

  // Sort by release date
  const sortedReleases = [...releaseDates].sort((a, b) => {
    const aFirst = a.releases.find(r => r.type === 3) || a.releases[0];
    const bFirst = b.releases.find(r => r.type === 3) || b.releases[0];
    if (!aFirst?.releaseDate || !bFirst?.releaseDate) return 0;
    return new Date(aFirst.releaseDate).getTime() - new Date(bFirst.releaseDate).getTime();
  });

  const displayReleases = showAll ? sortedReleases : sortedReleases.slice(0, 12);
  const hasMore = sortedReleases.length > 12;

  const getPrimaryRelease = (releases: CountryRelease["releases"]) => {
    const theatrical = releases.find(r => r.type === 3);
    const limited = releases.find(r => r.type === 2);
    const premiere = releases.find(r => r.type === 1);
    return theatrical || limited || premiere || releases[0];
  };

  return (
    <div className="flex flex-wrap gap-2.5 py-4">
      {displayReleases.map((country) => {
        const primary = getPrimaryRelease(country.releases);
        if (!primary) return null;

        return (
          <Chip key={country.iso}>
            <span className="mr-2">{getCountryFlag(country.iso)}</span>
            <span className="mr-2 font-medium">{country.name}</span>
            {primary.certification && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-medium mr-2">
                {primary.certification}
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              {formatReleaseDate(primary.releaseDate)}
            </span>
            {primary.type && (
              <span className="text-muted-foreground/70 text-xs ml-1">
                · {formatReleaseType(primary.type)}
              </span>
            )}
          </Chip>
        );
      })}
      {hasMore && !showAll && (
        <Chip onClick={onToggleShowAll} variant="accent">
          +{sortedReleases.length - 12} more...
        </Chip>
      )}
      {showAll && hasMore && (
        <Chip onClick={onToggleShowAll} variant="accent">
          Show Less
        </Chip>
      )}
    </div>
  );
}

export function CastAndCrew({ movie }: CastAndCrewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("cast");
  const [showAllCast, setShowAllCast] = useState(false);
  const [showAllCrew, setShowAllCrew] = useState(false);
  const [showAllReleases, setShowAllReleases] = useState(false);

  // Check if we have any data to show
  const hasCast = movie.cast && movie.cast.length > 0;
  const hasCrew = movie.crewByDepartment && Object.keys(movie.crewByDepartment).length > 0;
  const hasDetails = movie.productionCompanies?.length || movie.productionCountries?.length;
  const hasGenres = movie.genre && movie.genre.length > 0;
  const hasReleases = movie.releaseDates && movie.releaseDates.length > 0;

  // Return null if no data
  if (!hasCast && !hasCrew && !hasDetails && !hasGenres && !hasReleases) {
    return null;
  }

  // Build tabs based on available data
  const tabs: { id: TabType; label: string; count?: number }[] = [];
  if (hasCast) tabs.push({ id: "cast", label: "Cast" });
  if (hasCrew) tabs.push({ id: "crew", label: "Crew" });
  if (hasDetails) tabs.push({ id: "details", label: "Details" });
  if (hasGenres) tabs.push({ id: "genres", label: "Genres" });
  if (hasReleases) tabs.push({ id: "releases", label: "Releases" });

  // Set default tab to first available
  if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  const renderContent = () => {
    switch (activeTab) {
      case "cast":
        return (
          <CastContent
            cast={movie.cast || []}
            allCast={movie.allCast || movie.cast || []}
            showAll={showAllCast}
            onToggleShowAll={() => setShowAllCast(!showAllCast)}
          />
        );
      case "crew":
        return (
          <CrewContent
            crewByDepartment={movie.crewByDepartment || {}}
            showAll={showAllCrew}
            onToggleShowAll={() => setShowAllCrew(!showAllCrew)}
          />
        );
      case "details":
        return <DetailsContent movie={movie} />;
      case "genres":
        return <GenresContent genres={movie.genre || []} />;
      case "releases":
        return (
          <ReleasesContent
            releaseDates={movie.releaseDates || []}
            showAll={showAllReleases}
            onToggleShowAll={() => setShowAllReleases(!showAllReleases)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
