"use client";

import { useState, useTransition } from "react";
import {
  importWatchedMovieAction,
  type CsvImportResult,
  type CsvImportRow,
  updateProfileAction,
} from "@/app/actions";
import {
  REGION_LABELS,
  SUPPORTED_REGION_CODES,
  sortRegionsWithPreference,
} from "@/data/regions";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

type SettingsFormProps = {
  initialName: string;
  initialEmail: string;
  initialRegion: string;
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

  const regionOptions = sortRegionsWithPreference(SUPPORTED_REGION_CODES, region);

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

  const parseCsvText = (text: string): CsvImportRow[] => {
    const rows: CsvImportRow[] = [];
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (!lines.length) return rows;

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const yearIdx = headers.findIndex((h) => h.includes("year"));
    const uriIdx = headers.findIndex((h) => h.includes("letterboxd"));

    const safeDateIdx = dateIdx === -1 ? 0 : dateIdx;
    const safeNameIdx = nameIdx === -1 ? 1 : nameIdx;
    const safeYearIdx = yearIdx === -1 ? 2 : yearIdx;
    const safeUriIdx = uriIdx === -1 ? 3 : uriIdx;

    lines.slice(1).forEach((line) => {
      const cells = splitCsvLine(line);
      const title = (cells[safeNameIdx] || "").trim();
      const year = Number(cells[safeYearIdx]);

      if (!title || Number.isNaN(year)) return;

      const watchedDateRaw = cells[safeDateIdx]?.trim() || "";
      const letterboxdUri = cells[safeUriIdx]?.trim() || "";

      rows.push({
        title,
        year,
        watchedDate: watchedDateRaw || null,
        letterboxdUri: letterboxdUri || null,
      });
    });

    return rows;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsvText(text);

    setImportFileName(file.name);
    setImportRows(rows);
    setImportLog([]);
    setImportStatusMessage(
      rows.length
        ? `Ready to import ${rows.length} movies from CSV`
        : "No rows detected in this CSV"
    );
    setImportProgress({
      total: rows.length,
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
        <div className="space-y-4">
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
                  {REGION_LABELS[code] || code}
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
      <section className="space-y-4 rounded-2xl border border-border/40 bg-gradient-to-br from-foreground/5 via-foreground/0 to-emerald-400/10 p-4 sm:p-6 shadow-[0_20px_70px_-40px_rgba(16,185,129,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Letterboxd CSV import</h3>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Drop your export (Date, Name, Year, Letterboxd URI). We will search TMDB by title +
              year and mark them watched.
            </p>
          </div>
          <span className="rounded-full bg-foreground/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
            Beta
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="relative overflow-hidden rounded-xl border border-dashed border-foreground/20 bg-background/40 p-4 transition hover:border-foreground/40 hover:bg-background/70">
            <input
              type="file"
              accept=".csv,text/csv"
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
          <div className="space-y-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <span>Progress</span>
              <span>
                {importProgress.done}/{importProgress.total} • {progressPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid gap-2 text-[11px] sm:grid-cols-3">
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-500">
                Imported {importProgress.success}
              </div>
              <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-500">
                Not found {importProgress.skipped}
              </div>
              <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-rose-500">
                Errors {importProgress.errors}
              </div>
            </div>
          </div>
        )}

        {Boolean(importLog.length) && (
          <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-foreground/10 bg-background/60 p-3">
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
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                    entry.status === "imported" || entry.status === "updated"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : entry.status === "not_found"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-rose-500/15 text-rose-500"
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
