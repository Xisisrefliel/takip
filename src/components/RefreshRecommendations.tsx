"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshRecommendationsAction } from "@/app/actions";

export function RefreshRecommendations() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);

    try {
      const result = await refreshRecommendationsAction();

      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: result.message });
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to refresh recommendations" });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Refresh recommendations"
      >
        <RefreshCw
          className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span className="text-sm font-medium">
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </span>
      </button>

      {message && (
        <span
          className={`text-sm ${
            message.type === "success" ? "text-green-500" : "text-red-500"
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
