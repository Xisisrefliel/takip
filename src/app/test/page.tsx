"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Test() {
  const addToWatchlist = useMutation(api.watchlist.addToWatchlist);

  return (
    <div>
      <h1>Test</h1>
      <button onClick={() => {
        addToWatchlist({
          mediaId: "123",
          mediaType: "movie",
        });
      }}>Add to watchlist</button>
    </div>
  );
}
