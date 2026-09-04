const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

export function getLoginUrl(): string {
  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error("Missing Spotify environment variables!");
    return "#";
  }

  const scopes = ["user-top-read", "user-library-read"];
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: scopes.join(" "),
    show_dialog: "true", 
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string) {
  const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token exchange failed: ${errorText}`);
  }

  return response.json();
}
