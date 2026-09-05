import { NextResponse } from "next/server";
import { getAccessToken, getRedirectUri } from "@/app/utils/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const spotifyError = searchParams.get("error");

  if (spotifyError) {
    return NextResponse.redirect(
      new URL(`/?spotify_error=${encodeURIComponent(spotifyError)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?spotify_error=missing_authorization_code", request.url),
    );
  }

  try {
    const callbackUri = getRedirectUri(new URL(request.url).origin);
    const tokenData = await getAccessToken(code, callbackUri);
    const accessToken = tokenData.access_token;
    const response = NextResponse.redirect(new URL("/wrapped", request.url));

    response.cookies.set("spotify_access_token", accessToken, {
      maxAge: tokenData.expires_in ?? 60 * 60,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Error during Spotify authentication callback:", error);

    return NextResponse.redirect(
      new URL("/?spotify_error=token_exchange_failed", request.url),
    );
  }
}
