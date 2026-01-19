"use client";

import { useState, useTransition } from "react";
import {
  importWatchedMovieAction,
  type CsvImportResult,
  type CsvImportRow,
  updateProfileAction,
} from "@/app/actions";
import {
  COMMON_REGIONS,
  getRegionLabel,
  sortRegionsWithPreference,
} from "@/data/regions";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

type SettingsFormProps = {
  initialName: string;
  initialEmail: string;
  initialRegion: string;
};

type EnhancedImportRow = CsvImportRow & {
  watchedDatePriority: number;
  ratingPriority: number;
  sources: Set<string>;
};

export function SettingsForm({ initialName, initialEmail, initialRegion }: SettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [region, setRegion] = useState(initialRegion);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [importRows, setImportRows] = useState<CsvImportRow[]>([]);
  const [importLog, setImportLog] = useState<Array<CsvImportResult & { note?: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    done: 0,
    success: 0,
    errors: 0,
    skipped: 0,
  });
  const [isPending, startTransition] = useTransition();

  const regionOptions = sortRegionsWithPreference(COMMON_REGIONS, region);

  const splitCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    cells.push(current);

    return cells
      .map((cell) => cell.trim())
      .map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
  };

  const normalizeHeader = (header: string) => header.toLowerCase().replace(/\s+/g, " ").trim();

  const detectFileType = (headers: string[], fileName: string) => {
    const lowerName = fileName.toLowerCase();
    const hasWatchedDate = headers.some((h) => h.includes("watched date"));
    const hasRewatch = headers.some((h) => h.includes("rewatch"));
    const hasRating = headers.some((h) => h === "rating");

    if (hasWatchedDate || hasRewatch) return "diary";
    if (lowerName.includes("ratings")) return "ratings";
    if (lowerName.includes("watchlist")) return "watchlist";
    if (lowerName.includes("watched")) return "watched";
    if (hasRating) return "ratings";
    return "generic";
  };

  const parseCsvText = (text: string, fileName: string): EnhancedImportRow[] => {
    const rows: EnhancedImportRow[] = [];
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (!lines.length) return rows;

    const headersRaw = splitCsvLine(lines[0]);
    const headers = headersRaw.map(normalizeHeader);
    const fileType = detectFileType(headers, fileName);

    const idxOf = (needle: string, fallback?: number) => {
      const idx = headers.findIndex((h) => h.includes(needle));
      return idx === -1 && fallback !== undefined ? fallback : idx;
    };

    const dateIdx = idxOf("watched date", idxOf("date", 0));
    const loggedDateIdx = idxOf("date", 0);
    const nameIdx = idxOf("name", 1);
    const yearIdx = idxOf("year", 2);
    const uriIdx = idxOf("letterboxd", 3);
    const ratingIdxRaw = idxOf("rating");
    const ratingIdxFallback = headers.findIndex((h) => h.endsWith("rating"));
    const ratingIdx = ratingIdxRaw >= 0 ? ratingIdxRaw : ratingIdxFallback >= 0 ? ratingIdxFallback : -1;
    const rewatchIdx = idxOf("rewatch");

    const parseRating = (value?: string) => {
      if (!value) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const buildRow = (cells: string[]): EnhancedImportRow | null => {
      const title = (cells[nameIdx] || "").trim();
      const year = Number(cells[yearIdx]);
      if (!title || Number.isNaN(year)) return null;

      const letterboxdUri = cells[uriIdx]?.trim() || "";

      if (fileType === "diary") {
        const watchedDateCell = cells[dateIdx]?.trim() || cells[loggedDateIdx]?.trim() || "";
        const watchedDatePriority = cells[dateIdx] ? 3 : 2;
        const ratingValue = ratingIdx >= 0 ? parseRating(cells[ratingIdx]) : null;
        const rewatchValue =
          typeof rewatchIdx === "number" && rewatchIdx >= 0
            ? /^y(es)?$/i.test((cells[rewatchIdx] || "").trim())
            : undefined;

        return {
          title,
          year,
          watchedDate: watchedDateCell || null,
          watchedDatePriority,
          rating: ratingValue,
          ratingPriority: ratingValue === null ? -1 : 2,
          watchlist: false,
          watched: true,
          rewatch: rewatchValue,
          letterboxdUri: letterboxdUri || null,
          source: "diary",
          sources: new Set(["diary"]),
        };
      }

      if (fileType === "ratings") {
        const watchedDateCell = cells[loggedDateIdx]?.trim() || "";
        const ratingValue = ratingIdx >= 0 ? parseRating(cells[ratingIdx]) : null;
        return {
          title,
          year,
          watchedDate: watchedDateCell || null,
          watchedDatePriority: watchedDateCell ? 1 : 0,
          rating: ratingValue,
          ratingPriority: ratingValue === null ? -1 : 1,
          watchlist: false,
          watched: true,
          letterboxdUri: letterboxdUri || null,
          source: "ratings",
          sources: new Set(["ratings"]),
        };
      }

      if (fileType === "watchlist") {
        return {
          title,
          year,
          watchedDate: null,
          watchedDatePriority: -1,
          rating: null,
          ratingPriority: -1,
          watchlist: true,
          watched: false,
          letterboxdUri: letterboxdUri || null,
          source: "watchlist",
          sources: new Set(["watchlist"]),
        };
      }

      const watchedDateCell = cells[loggedDateIdx]?.trim() || "";
      return {
        title,
        year,
        watchedDate: watchedDateCell || null,
        watchedDatePriority: watchedDateCell ? 1 : 0,
        rating: null,
        ratingPriority: -1,
        watchlist: false,
        watched: true,
        letterboxdUri: letterboxdUri || null,
        source: fileType,
        sources: new Set([fileType]),
      };
    };

    lines.slice(1).forEach((line) => {
      const cells = splitCsvLine(line);
      const parsed = buildRow(cells);
      if (parsed) rows.push(parsed);
    });

    return rows;
  };

  const mergeRows = (existing: EnhancedImportRow, incoming: EnhancedImportRow): EnhancedImportRow => {
    const sources = new Set([...(existing.sources ?? []), ...(incoming.sources ?? [])]);

    const watchedDatePriority = Math.max(existing.watchedDatePriority, incoming.watchedDatePriority);
    const watchedDate =
      incoming.watchedDate &&
      incoming.watchedDatePriority >= existing.watchedDatePriority
        ? incoming.watchedDate
        : existing.watchedDate;

    const ratingPriority = Math.max(existing.ratingPriority, incoming.ratingPriority);
    const rating =
      incoming.rating !== null &&
      incoming.rating !== undefined &&
      incoming.ratingPriority >= existing.ratingPriority
        ? incoming.rating
        : existing.rating ?? null;

    const letterboxdUri = incoming.letterboxdUri || existing.letterboxdUri || null;

    return {
      ...existing,
      ...incoming,
      watchedDate,
      watchedDatePriority,
      rating,
      ratingPriority,
      watched: (existing.watched ?? false) || (incoming.watched ?? false),
      watchlist: Boolean(existing.watchlist) || Boolean(incoming.watchlist),
      letterboxdUri,
      sources,
      source: Array.from(sources).join(", "),
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const aggregated = new Map<string, EnhancedImportRow>();

    for (const file of Array.from(files)) {
      const text = await file.text();
      const rows = parseCsvText(text, file.name);
      rows.forEach((row) => {
        const key = `${row.title.toLowerCase()}-${row.year}`;
        const existing = aggregated.get(key);
        aggregated.set(key, existing ? mergeRows(existing, row) : row);
      });
    }

    const mergedRows: CsvImportRow[] = Array.from(aggregated.values()).map((row) => ({
      title: row.title,
      year: row.year,
      watchedDate: row.watchedDate || null,
      letterboxdUri: row.letterboxdUri || null,
      rating: row.rating ?? null,
      watchlist: row.watchlist ?? false,
      watched: row.watched ?? false,
      rewatch: row.rewatch,
      source: row.source,
    }));

    setImportFileName(files.length === 1 ? files[0].name : `${files.length} files`);
    setImportRows(mergedRows);
    setImportLog([]);
    setImportStatusMessage(
      mergedRows.length
        ? `Ready to import ${mergedRows.length} unique movies from ${files.length} file${files.length > 1 ? "s" : ""}`
        : "No rows detected in these files"
    );
    setImportProgress({
      total: mergedRows.length,
      done: 0,
      success: 0,
      errors: 0,
      skipped: 0,
    });
  };

  const handleImport = async () => {
    if (!importRows.length || isImporting) return;

    setIsImporting(true);
    setImportStatusMessage("Importing from CSV...");
    setImportLog([]);
    setImportProgress({
      total: importRows.length,
      done: 0,
      success: 0,
      errors: 0,
      skipped: 0,
    });

    for (const row of importRows) {
      const result = await importWatchedMovieAction(row);

      setImportLog((prev) => [{ ...result }, ...prev].slice(0, 60));
      setImportProgress((prev) => ({
        ...prev,
        done: prev.done + 1,
        success:
          prev.success + (result.status === "imported" || result.status === "updated" ? 1 : 0),
        errors: prev.errors + (result.status === "error" ? 1 : 0),
        skipped: prev.skipped + (result.status === "not_found" ? 1 : 0),
      }));
    }

    setImportStatusMessage("Finished processing CSV");
    setIsImporting(false);
  };

  const progressPercent =
    importProgress.total > 0 ? Math.round((importProgress.done / importProgress.total) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (password && password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    startTransition(async () => {
      const result = await updateProfileAction({
        name,
        email,
        password: password || null,
        preferredRegion: region,
      });

      if (result?.error) {
        setStatus({ type: "error", message: result.error });
      } else {
        setStatus({ type: "success", message: "Saved changes" });
        setPassword("");
        setConfirmPassword("");
        // Clear success message after 3 seconds
        setTimeout(() => setStatus(null), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Identity Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Profile</h3>
        <div
          className="space-y-4"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "left",
            verticalAlign: "middle",
            borderColor: "transparent",
            borderImage: "none",
            borderStyle: "none",
          }}
        >
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground/60 ml-1">
              Display Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/50 focus:border-foreground/20 focus:ring-0 transition-colors"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground/60 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/50 focus:border-foreground/20 focus:ring-0 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Region Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Preferences</h3>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground/60 ml-1">
            Region
          </label>
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/50 focus:border-foreground/20 focus:ring-0 transition-colors"
            >
              {regionOptions.map((code) => (
                <option key={code} value={code}>
                  {getRegionLabel(code)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 text-xs">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-foreground/40 ml-1">
            Used for streaming availability.
          </p>
        </div>
      </section>

      {/* Security Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Security</h3>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground/60 ml-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              minLength={6}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/50 focus:border-foreground/20 focus:ring-0 transition-colors"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground/60 ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={6}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/50 focus:border-foreground/20 focus:ring-0 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Data Import Section */}
      <section className="space-y-4 rounded-2xl border border-border/40 bg-background/60 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Letterboxd CSV import</h3>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Drop Diary, Ratings, Watched, or Watchlist CSVs. We merge them, prefer the Diary
              watched date when present, and sync watched status, ratings, and watchlists.
            </p>
          </div>
          <span className="rounded-full border border-border/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
            Beta
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="relative overflow-hidden rounded-xl border border-dashed border-foreground/20 bg-background/40 p-4 transition hover:border-foreground/40 hover:bg-background/70">
            <input
              type="file"
              accept=".csv,text/csv"
              multiple
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {importFileName || "Choose a CSV to import"}
                </p>
                <p className="text-[11px] text-foreground/60">
                  Click or drop a file. We only use title + year to find matches.
                </p>
              </div>
              <div className="rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground/70">
                {importRows.length ? `${importRows.length} rows queued` : "Awaiting file"}
              </div>
            </div>
          </label>

          <button
            type="button"
            disabled={!importRows.length || isImporting}
            onClick={handleImport}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
              isImporting ? "bg-foreground/60 text-background" : "bg-foreground text-background hover:opacity-90"
            )}
          >
            {isImporting ? "Importing…" : "Import CSV"}
          </button>
        </div>

        {importProgress.total > 0 && (
          <div className="space-y-3 rounded-xl border border-border/40 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <span>Progress</span>
              <span>
                {importProgress.done}/{importProgress.total} • {progressPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border/50">
              <div
                className="h-full rounded-full bg-foreground/70 transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid gap-2 text-[11px] sm:grid-cols-3">
              <div className="rounded-lg border border-border/50 px-3 py-2 text-foreground/80">
                Imported {importProgress.success}
              </div>
              <div className="rounded-lg border border-border/50 px-3 py-2 text-foreground/80">
                Not found {importProgress.skipped}
              </div>
              <div className="rounded-lg border border-border/50 px-3 py-2 text-foreground/80">
                Errors {importProgress.errors}
              </div>
            </div>
          </div>
        )}

        {Boolean(importLog.length) && (
          <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-border/40 bg-transparent p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
            {importLog.map((entry, idx) => (
              <div
                key={`${entry.tmdbId ?? entry.title}-${idx}`}
                className="flex items-center justify-between gap-3 text-xs text-foreground/80"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {entry.title}{" "}
                    <span className="text-foreground/50">({entry.year || "?"})</span>
                  </p>
                  {entry.reason && <p className="truncate text-foreground/50">{entry.reason}</p>}
                  {entry.note && <p className="truncate text-foreground/50">{entry.note}</p>}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full border border-border/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/70",
                    entry.status === "imported" || entry.status === "updated"
                      ? ""
                      : entry.status === "not_found"
                        ? ""
                        : ""
                  )}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {importStatusMessage && (
          <p className="text-[11px] text-foreground/60">{importStatusMessage}</p>
        )}
      </section>

      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <div className="min-h-[20px]">
          {status && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-sm font-medium",
                status.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {status.message}
            </motion.p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            "bg-foreground text-background hover:opacity-90 shadow-sm"
          )}
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
