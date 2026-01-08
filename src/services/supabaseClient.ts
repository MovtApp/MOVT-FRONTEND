import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://ypnpdjgsyzdwsmnxsoqj.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbnBkamdzeXpkd3Ntbnhzb3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDI5OTUsImV4cCI6MjA3NDQ3ODk5NX0.SxG2mKbprQkJP1JGWp1PoSaM0LfVHgIqg6STuwp8jAw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
