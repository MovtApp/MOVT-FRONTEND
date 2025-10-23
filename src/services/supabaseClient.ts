import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://ypnpdjgsyzdwsmnxsoqj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbnBkamdzeXpkd3Ntbnhzb3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDI5OTUsImV4cCI6MjA3NDQ3ODk5NX0.SxG2mKbprQkJP1JGWp1PoSaM0LfVHgIqg6STuwp8jAw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
