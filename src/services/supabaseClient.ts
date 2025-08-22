import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://supabase.com/dashboard/project/ukxvqhguvbyhcvpkxyky";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreHZxaGd1dmJ5aGN2cGt4eWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjM2NjMsImV4cCI6MjA2MDEzOTY2M30.MnNQGK_BY1c65SqWETyCGQF60_2vZfJYdqo8jTZA2q4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
