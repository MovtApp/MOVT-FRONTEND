import { useEffect, useState } from "react";
import { makeRedirectUri, useAuthRequest, exchangeCodeAsync, ResponseType } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { secureGet, secureSet, secureRemove } from "../services/secureStore";
import { SPOTIFY_CONFIG } from "../config/spotifyConfig";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Define interfaces for data we care about
export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    images: { url: string }[];
    name: string;
  };
  artists: { name: string }[];
  duration_ms: number;
}

export interface SpotifyState {
  isConnected: boolean;
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "@spotify_token";
// Using Implicit Grant for simplicity in frontend-only flow
// (Note: Authorization Code with PKCE is better for long-term production but requires more setup)

export function useSpotify() {
  const [token, setToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirectUri = makeRedirectUri({ scheme: "movt" });

  // Authorization Code + PKCE (sem client secret no cliente). O access_token NÃO
  // trafega mais na URL de redirect, evitando interceptação por apps registrados
  // no mesmo custom scheme.
  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: SPOTIFY_CONFIG.clientId,
      scopes: SPOTIFY_CONFIG.scopes,
      usePKCE: true,
      redirectUri,
    },
    SPOTIFY_CONFIG.discovery
  );

  // Load token from secure storage on mount
  useEffect(() => {
    (async () => {
      const storedToken = await secureGet(STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
    })();
  }, []);

  // Handle Auth Response — troca o authorization code por access_token via PKCE
  useEffect(() => {
    if (response?.type === "success" && response.params.code && request?.codeVerifier) {
      exchangeCodeAsync(
        {
          clientId: SPOTIFY_CONFIG.clientId,
          code: response.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier },
        },
        SPOTIFY_CONFIG.discovery
      )
        .then((tokenResponse) => {
          const accessToken = tokenResponse.accessToken;
          if (accessToken) {
            setToken(accessToken);
            secureSet(STORAGE_KEY, accessToken);
          }
        })
        .catch((e) => console.error("Erro ao trocar code por token do Spotify:", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, request]);

  // Polling for Current Track (when connected)
  useEffect(() => {
    if (!token) return;

    const fetchCurrentTrack = async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 204) {
          // No info or not playing anything
          return;
        }

        const data = await res.json();
        if (data && data.item) {
          setCurrentTrack(data.item);
          setIsPlaying(data.is_playing);
        }
      } catch (error) {
        console.error("Error fetching Spotify info:", error);
        // If 401, token expired
        if ((error as any)?.status === 401) {
          setToken(null);
          secureRemove(STORAGE_KEY);
        }
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [token]);

  // Actions
  const authenticate = async () => {
    // Check if client ID is set
    if (SPOTIFY_CONFIG.clientId === "SUA_CLIENT_ID_AQUI") {
      Alert.alert(
        "Configuração Necessária",
        "Você precisa configurar o Client ID no arquivo src/config/spotifyConfig.ts"
      );
      return;
    }
    try {
      await promptAsync();
    } catch (e) {
      console.error(e);
    }
  };

  const playPause = async () => {
    if (!token) return;
    const endpoint = isPlaying
      ? "https://api.spotify.com/v1/me/player/pause"
      : "https://api.spotify.com/v1/me/player/play";

    try {
      await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPlaying(!isPlaying); // Optimistic update
    } catch (e) {
      console.error("Error toggling play", e);
    }
  };

  const nextTrack = async () => {
    if (!token) return;
    try {
      await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Wait a bit then refresh
      setTimeout(() => setIsLoading(!isLoading), 500); // Trigger refresh
    } catch (e) {
      console.error("Error skipping", e);
    }
  };

  const prevTrack = async () => {
    if (!token) return;
    try {
      await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Error prev", e);
    }
  };

  return {
    token,
    isConnected: !!token,
    currentTrack,
    isPlaying,
    authenticate,
    playPause,
    nextTrack,
    prevTrack,
  };
}
