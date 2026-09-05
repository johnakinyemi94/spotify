import { NextResponse } from "next/server";

const allowedHosts = ["i.scdn.co", "mosaic.scdn.co", "images-ak.spotifycdn.com"];

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("url");

  if (!source || !isAllowedImageUrl(source)) {
    return new NextResponse("Invalid Spotify image URL", { status: 400 });
  }

  const imageResponse = await fetch(source, {
    headers: { Accept: "image/*" },
    next: { revalidate: 3600 },
  });

  if (!imageResponse.ok) {
    return new NextResponse("Spotify image unavailable", {
      status: imageResponse.status,
    });
  }

  return new NextResponse(imageResponse.body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": imageResponse.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
