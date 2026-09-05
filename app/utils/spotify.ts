const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

export function getRedirectUri(origin?: string) {
  if (process.env.NEXT_PUBLIC_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_REDIRECT_URI;
  }

  if (origin) {
    return `${origin.replace(/\/$/, "")}/api/auth/callback`;
  }

  return (
    process.env.NEXT_PUBLIC_REDIRECT_URI ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/auth/callback`
      : "http://localhost:3000/api/auth/callback")
  );
}

export function getLoginUrl(origin?: string): string {
  if (!CLIENT_ID) {
    console.error("Missing Spotify environment variables!");
    return "/?spotify_error=missing_spotify_client_id";
  }

  const scopes = ["user-top-read", "user-library-read"];
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(origin),
    scope: scopes.join(" "),
    show_dialog: "true", 
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string, redirectUri?: string) {
  const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const callbackUri = redirectUri ?? getRedirectUri();

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Spotify client credentials are not configured.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token exchange failed: ${errorText}`);
  }

  return response.json();
}
