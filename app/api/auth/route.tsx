import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const tokenData = await getAccessToken(code);
    const accessToken = tokenData.access_token;
    const tracksRes = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const tracksData = await tracksRes.json();
    const artistsRes = await fetch(
      "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=long_term",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!tracksRes.ok || !artistsRes.ok) {
      throw new Error(
        `Spotify data request failed: ${tracksRes.status} / ${artistsRes.status}`,
      );
    }
    const artistsData = await artistsRes.json();
    const wrappedData = {
      topTracks: tracksData.items || [],
      topArtists: artistsData.items || [],
    };

    const response = NextResponse.redirect(new URL("/wrapped", request.url));

    response.cookies.set("wrapped_data", JSON.stringify(wrappedData), {
      maxAge: 60 * 5,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Error during Spotify authentication callback:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
