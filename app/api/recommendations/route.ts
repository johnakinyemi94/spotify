import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RecommendationTrack = {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
};

function getSuggestedSongs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^\d+[.)-]\s*/, ""))
    .map((line) => line.split(/\s+[—-]\s+|\s*:\s+/)[0].trim())
    .map((line) => {
      const match = line.match(/^(.+?)\s+by\s+(.+)$/i);
      return match ? { name: match[1].trim(), artist: match[2].trim() } : null;
    })
    .filter((song): song is { name: string; artist: string } => song !== null)
    .slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.BAZAARLINK_API_KEY;
    const baseUrl = process.env.BAZAARLINK_BASE_URL?.replace(/\/$/, "");
    const model = process.env.BAZAARLINK_MODEL;
    const missingSettings = [
      !apiKey && "BAZAARLINK_API_KEY",
      !baseUrl && "BAZAARLINK_BASE_URL",
      (!model || model === "your-bazaarlink-model") && "BAZAARLINK_MODEL",
    ].filter(Boolean);

    if (missingSettings.length > 0) {
      return NextResponse.json(
        { error: `BazaarLink is missing: ${missingSettings.join(", ")}. Add the missing setting(s) to .env.local.` },
        { status: 503 },
      );
    }

    const configuredBaseUrl = baseUrl as string;

    const body = await request.json();
    const tracks = Array.isArray(body.tracks) ? body.tracks.slice(0, 50) : [];
    const preference = typeof body.preference === "string" ? body.preference.trim().slice(0, 100) : "";

    if (tracks.length === 0 && !preference) {
      return NextResponse.json({ error: "Enter a genre, mood, or type of song." }, { status: 400 });
    }

    const trackList = tracks
      .map((track: { name?: string; artists?: { name?: string }[] }) => {
        const artists = track.artists?.map((artist) => artist.name).filter(Boolean).join(", ");
        return `${track.name ?? "Unknown song"} by ${artists || "Unknown artist"}`;
      })
      .join("\n");
    const listenerContext = tracks.length > 0
      ? `Here are songs this listener likes or frequently plays:\n${trackList}`
      : `This is a new Spotify listener with no listening history yet. They want music in this style or mood: ${preference}`;

    const endpoint = configuredBaseUrl.endsWith("/chat/completions")
      ? configuredBaseUrl
      : `${configuredBaseUrl}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are a concise music discovery assistant. Recommend five real songs that fit the listener's taste or requested style. Do not claim the user has listened to a song unless it appears in the input. Format every recommendation exactly as 'Song Title by Artist - one short reason'. Keep the tone warm.",
          },
          { role: "user", content: `${listenerContext}\n\nSuggest five different songs.` },
        ],
      }),
    });

    if (!response.ok) {
      const providerError = await response.text();
      console.error(`BazaarLink request failed (${response.status}):`, providerError);
      return NextResponse.json(
        {
          error: response.status === 402
            ? "BazaarLink has insufficient credits. Top up your BazaarLink account, then try again."
            : response.status === 429
              ? "BazaarLink has no available credits or rate limit capacity."
              : "BazaarLink could not create recommendations.",
        },
        { status: response.status },
      );
    }

    const completion = await response.json();
    const recommendations = completion.choices?.[0]?.message?.content;

    if (typeof recommendations !== "string" || !recommendations.trim()) {
      throw new Error("BazaarLink returned no recommendation text.");
    }

    const accessToken = (await cookies()).get("spotify_access_token")?.value;
    let recommendedTracks: RecommendationTrack[] = [];

    if (accessToken) {
      const suggestedSongs = getSuggestedSongs(recommendations);
      recommendedTracks = (
        await Promise.all(
          suggestedSongs.map(async (song): Promise<RecommendationTrack | null> => {
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(`${song.name} ${song.artist}`)}`,
              { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            if (!searchResponse.ok) return null;
            const searchData = await searchResponse.json();
            const track = searchData.tracks?.items?.[0];
            if (!track) return null;
            return {
              id: track.id,
              name: track.name,
              artist: track.artists?.[0]?.name ?? song.artist,
              imageUrl: track.album?.images?.[0]?.url,
            };
          }),
        )
      ).filter((track): track is RecommendationTrack => track !== null);
    }

    return NextResponse.json({ recommendations, recommendedTracks });
  } catch (error) {
    console.error("Recommendation request failed:", error);
    return NextResponse.json({ error: "Could not create recommendations." }, { status: 500 });
  }
}