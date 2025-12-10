"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/actions";
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
  const [isPending, startTransition] = useTransition();

  const regionOptions = sortRegionsWithPreference(SUPPORTED_REGION_CODES, region);

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

      <div className="flex items-center justify-between pt-4 border-t border-border/30">
         <div className="min-h-[20px]">
           {status && (
             <motion.p
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               className={cn(
                 "text-sm font-medium",
                 status.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
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
