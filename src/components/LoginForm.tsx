"use client";

import { useState, useTransition } from "react";
import { signInAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const { update } = useSession();
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
      } else if (result?.success) {
        // Refresh the session on the client side first
        await update?.();
        // Navigate to home page
        router.push("/");
        // Refresh to ensure all server components update
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm shake">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground/80 mb-2"
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
          className="w-full px-4 py-2.5 rounded-[10px] bg-surface border border-border text-foreground placeholder:text-foreground/40 disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground/80 mb-2"
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
          className="w-full px-4 py-2.5 rounded-[10px] bg-surface border border-border text-foreground placeholder:text-foreground/40 disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full py-2.5 rounded-[10px] font-medium transition-all duration-150 btn-press",
          "bg-foreground text-background hover:opacity-90",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
