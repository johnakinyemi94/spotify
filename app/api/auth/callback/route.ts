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

    return NextResponse.redirect(new URL("/", request.url));
  }
}
