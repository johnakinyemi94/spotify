import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import type { WrappedData } from "@/app/types/spotify";
import { getLoginUrl } from "@/app/utils/spotify";
import RecommendationAssistant from "@/components/RecommendationAssistant";
import Navbar from "@/components/Navbar";

export default async function Wrapped() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;
  let liveData: WrappedData | null = null;

  if (accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [tracksResponse, artistsResponse, likedTracksResponse] =
      await Promise.all([
        fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term",
          { headers },
        ),
        fetch(
          "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=long_term",
          { headers },
        ),
        fetch("https://api.spotify.com/v1/me/tracks?limit=20", { headers }),
      ]);

    if (tracksResponse.ok && artistsResponse.ok && likedTracksResponse.ok) {
      const [tracks, artists, likedTracks] = await Promise.all([
        tracksResponse.json(),
        artistsResponse.json(),
        likedTracksResponse.json(),
      ]);
      const genres =
        artists.items?.flatMap(
          (artist: { genres?: string[] }) => artist.genres ?? [],
        ) ?? [];
      const genreCounts = new Map<string, number>();
      genres.forEach((genre: string) =>
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1),
      );
      const topGenre =
        [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "Unknown Genre";

      liveData = {
        topTracks: tracks.items ?? [],
        topArtists: artists.items ?? [],
        topGenre,
        likedTracks:
          likedTracks.items?.map((item: { track: unknown }) => item.track) ??
          [],
      };
    }
  }

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const loginUrl = getLoginUrl(host ? `${protocol}://${host}` : undefined);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center font-sans bg-linear-to-r from-green-950 via-black to-black text-white">
      <Navbar />
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-24 px-8 bg-transparent sm:items-start">
        <Image
          className="h-[40px] w-[130px] pb-5"
          src="/spotify.svg"
          alt="Spotify logo"
          width={130}
          height={40}
          priority
        />

        {!liveData ? (
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left my-auto">
            <h1 className="max-w-xs text-4xl font-bold leading-10 tracking-tight text-emerald-400">
              Spotify Wrapped Data
            </h1>
            <p className="text-zinc-300">
              Discover your top Spotify tracks and artists from the past year.
            </p>
            <ol className="list-decimal list-inside text-left space-y-2 text-zinc-400">
              <li>
                Click &quot;Get My Wrapped&quot; to authorize your account.
              </li>
              <li>Log in securely through Spotify.</li>
              <li>Instantly view your custom top charts below.</li>
            </ol>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                href={loginUrl}
                className="bg-emerald-500 text-black px-8 py-3 rounded-full font-bold hover:bg-emerald-400 transition-colors shadow-lg mb-8"
              >
                Get My Wrapped
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-8 my-auto">
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400 text-center sm:text-left">
              Your Year in Review
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-md">
                <h2 className="text-xl font-bold mb-4 text-emerald-300">
                  Top Tracks
                </h2>
                {liveData.topTracks.length > 0 ? (
                  <ul className="space-y-4">
                    {liveData.topTracks.map((track, i) => (
                      <li key={track.id} className="flex items-center gap-3">
                        <span className="font-bold text-zinc-500 w-4">
                          {i + 1}
                        </span>
                        {track.album?.images?.[0]?.url && (
                          <Image
                            src={track.album.images[0].url}
                            alt={track.name}
                            width={44}
                            height={44}
                            className="rounded"
                          />
                        )}
                        <div className="truncate">
                          <p className="font-medium truncate max-w-[220px]">
                            {track.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate max-w-[220px]">
                            {track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-zinc-400">
                    Spotify does not have enough listening history to show your
                    top tracks yet. Listen to more songs and check back later.
                  </p>
                )}
              </div>

              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-md">
                <h2 className="text-xl font-bold mb-4 text-emerald-300">
                  Top Artists
                </h2>
                {liveData.topArtists.length > 0 ? (
                  <ul className="space-y-4">
                    {liveData.topArtists.map((artist, i) => (
                      <li key={artist.id} className="flex items-center gap-3">
                        <span className="font-bold text-zinc-500 w-4">
                          {i + 1}
                        </span>
                        {artist.images?.[0]?.url && (
                          <Image
                            src={artist.images[0].url}
                            alt={artist.name}
                            width={44}
                            height={44}
                            className="rounded-full object-cover aspect-square"
                          />
                        )}
                        <div>
                          <p className="font-medium">{artist.name}</p>
                          <p className="text-xs text-zinc-400 capitalize truncate max-w-[220px]">
                            {artist.genres.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-zinc-400">
                    Spotify does not have enough listening history to show your
                    top artists yet. Listen to more songs and check back later.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center sm:justify-start pt-4">
              <Link
                href="/"
                className="text-xs text-zinc-500 underline hover:text-white transition-colors"
              >
                Log out / Refresh dashboard data
              </Link>
            </div>
          </div>
        )}

        {liveData && (
          <div className="w-full">
            <RecommendationAssistant
              tracks={[...liveData.likedTracks, ...liveData.topTracks]}
            />
          </div>
        )}
      </main>
    </div>
  );
}
