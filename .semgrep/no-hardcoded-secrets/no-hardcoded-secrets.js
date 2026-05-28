// NOTA: valores abaixo são SINTÉTICOS (fake), apenas para exercitar os padrões da regra.
// Nunca coloque segredos reais em arquivos de teste.

// ruleid: no-hardcoded-secrets
const sentryToken = "sntryu_0000000000000000000000000000000000000000000000000000000000000000";

// ruleid: no-hardcoded-secrets
const mapsKey = "AIzaFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE000";

// ruleid: no-hardcoded-secrets
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiZmFrZSJ9.ZmFrZXNpZ25hdHVyZUZBS0V4eHh4";

// ruleid: no-hardcoded-secrets
const privateKey = "-----BEGIN PRIVATE KEY-----";

// ok: no-hardcoded-secrets
const apiKeyFromEnv = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ok: no-hardcoded-secrets
const supabaseUrl = "https://example-project.supabase.co";

// ok: no-hardcoded-secrets
const greeting = "Bem-vindo ao MOVT";
