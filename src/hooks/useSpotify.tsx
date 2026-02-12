import { useEffect, useState } from "react";
import { makeRedirectUri, useAuthRequest, ResponseType } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  // Setup Auth Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Token,
      clientId: SPOTIFY_CONFIG.clientId,
      scopes: SPOTIFY_CONFIG.scopes,
      // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
      // this must be set to false
      usePKCE: false,
      redirectUri: makeRedirectUri({
        scheme: "movt",
      }),
    },
    SPOTIFY_CONFIG.discovery
  );

  // Load token from storage on mount
  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
    })();
  }, []);

  // Handle Auth Response
  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      setToken(access_token);
      AsyncStorage.setItem(STORAGE_KEY, access_token);
    }
  }, [response]);

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
          AsyncStorage.removeItem(STORAGE_KEY);
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
