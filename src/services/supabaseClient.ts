import { createClient } from "@supabase/supabase-js";
import { secureGet, secureSet, secureRemove } from "./secureStore";

const supabaseUrl = "https://ypnpdjgsyzdwsmnxsoqj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbnBkamdzeXpkd3Ntbnhzb3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDI5OTUsImV4cCI6MjA3NDQ3ODk5NX0.SxG2mKbprQkJP1JGWp1PoSaM0LfVHgIqg6STuwp8jAw";

// Persiste a sessão Supabase (access_token + refresh_token) no SecureStore
// (Keychain/Keystore) em vez do AsyncStorage. A interface exigida pelo SDK é
// getItem/setItem/removeItem assíncronos. secureGet já migra valor legado
// do AsyncStorage transparentemente — usuários logados não são deslogados.
const supabaseSecureStorage = {
  getItem: (key: string) => secureGet(key),
  setItem: (key: string, value: string) => secureSet(key, value),
  removeItem: (key: string) => secureRemove(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (...args) => fetch(...args),
  },
  auth: {
    storage: supabaseSecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE: signInWithOAuth retorna ?code= em vez de #access_token=. O
    // exchangeCodeForSession exige o code_verifier guardado localmente,
    // tornando o token inutilizável se outro app interceptar o redirect.
    flowType: "pkce",
  },
});
