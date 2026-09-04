export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
}

export interface WrappedData {
  topTracks: SpotifyTrack[];
  topArtists: SpotifyArtist[];
  topGenre: string;
  likedTracks: SpotifyTrack[];
}
