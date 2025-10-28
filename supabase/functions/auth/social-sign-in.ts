// eslint-disable-next-line import/no-unresolved
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// eslint-disable-next-line import/no-unresolved
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
// eslint-disable-next-line @typescript-eslint/no-unused-vars, import/no-unresolved
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

// Carregar variáveis de ambiente - embora para Google SignInWithIdToken, o Supabase geralmente faz a validação
// Se houver necessidade de validação mais profunda ou de outras credenciais, elas seriam carregadas aqui.

// Inicializar cliente Supabase com service_role key para acesso administrativo
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetadas automaticamente nas Edge Functions.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { provider, token } = await req.json();

    if (!provider || !token) {
      return new Response("Missing provider or token", { status: 400 });
    }

    let session;
    let error;

    switch (provider) {
      case "google":
        // Supabase Auth Admin pode lidar diretamente com id_tokens (JWT) do Google
        const { data: idTokenData, error: idTokenError } =
          await supabaseAdmin.auth.signInWithIdToken({
            provider: "google", // Supabase reconhece 'google'
            token: token, // O id_token JWT
          });
        session = idTokenData?.session;
        error = idTokenError;
        break;

      default:
        return new Response(
          "Invalid social provider. Only 'google' is supported.",
          { status: 400 },
        );
    }

    if (error) {
      console.error(
        `Erro na autenticação social (${provider}):`,
        error.message,
      );
      return new Response(`Erro ao autenticar: ${error.message}`, {
        status: 500,
      });
    }

    if (!session) {
      return new Response("Sessão Supabase não gerada.", { status: 500 });
    }

    return new Response(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Erro inesperado na Edge Function de social sign-in:", error);
    return new Response(
      JSON.stringify({ message: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
