"use client";

import { useState, useTransition } from "react";
import { signInAction } from "@/app/actions";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signInAction(email, password);
      if (result?.error) {
        setError(result.error);
      }
      // Note: redirect() in signInAction will navigate away, so AuthButton
      // will update via pathname change listener
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full py-2.5 rounded-lg font-medium transition-colors",
          "bg-foreground text-background hover:opacity-90",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
