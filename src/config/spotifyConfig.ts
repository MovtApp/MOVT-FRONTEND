export const SPOTIFY_CONFIG = {
  clientId: "b717c00210c54f2c8debddb773a19faf", // O usuário precisará colocar o ID aqui
  scopes: [
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
    "streaming", // For Web Playback SDK if used, or just general intent
    "app-remote-control",
  ],
  // Discovery endpoints are standard
  discovery: {
    authorizationEndpoint: "https://accounts.spotify.com/authorize",
    tokenEndpoint: "https://accounts.spotify.com/api/token",
  },
};
