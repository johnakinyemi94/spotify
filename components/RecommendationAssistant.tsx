"use client";

import { useState } from "react";
import type { SpotifyTrack } from "@/app/types/spotify";

export default function RecommendationAssistant({ tracks }: { tracks: SpotifyTrack[] }) {
  const hasListeningHistory = tracks.length > 0;
  const [recommendations, setRecommendations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preference, setPreference] = useState("");

  async function getRecommendations() {
    if (!hasListeningHistory && !preference.trim()) {
      setError("Enter a genre, mood, or type of song first.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks, preference }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Request failed");
      setRecommendations(data.recommendations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card border bg-zinc-900/70 p-6 rounded-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-emerald-300">Your next listen using AI</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {hasListeningHistory
              ? "Get five AI-picked songs based on your Spotify taste."
              : "You need more listening history for a Wrapped, but you can still discover songs."}
          </p>
        </div>
      </div>
      {!hasListeningHistory && (
        <label className="mt-5 block text-sm text-zinc-300">
          What would you like to hear?
          <input
            type="text"
            value={preference}
            onChange={(event) => setPreference(event.target.value)}
            placeholder="e.g. mellow indie, upbeat Afrobeats, 90s hip-hop"
            maxLength={100}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400"
          />
        </label>
      )}
      <button
        type="button"
        onClick={getRecommendations}
        disabled={isLoading}
        className="mt-5 bg-emerald-500 px-5 py-3 rounded-full font-bold text-black transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? "Finding songs..." : "Suggest songs"}
      </button>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      {recommendations && (
        <div className="mt-5 whitespace-pre-line border-t border-zinc-800 pt-5 text-zinc-200">
          {recommendations}
        </div>
      )}
    </section>
  );
}