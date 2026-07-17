import { useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

WebBrowser.maybeCompleteAuthSession();

export type GoogleOAuthResult =
  | { status: "success"; access_token: string; supabaseUser: SupabaseUser }
  | { status: "cancel" };

/**
 * Hook compartilhado do fluxo OAuth do Google (PKCE).
 *
 * Centraliza toda a lógica de WebBrowser + troca de code por sessão para que
 * o login (SignInScreen) e o vínculo de conta (configurações) usem exatamente
 * o mesmo caminho, sem duplicar o fluxo sensível.
 *
 * Retorna a sessão/usuário do Supabase JÁ validados. NÃO fala com o backend
 * MOVT nem navega — quem chamou decide o que fazer (login vs. vincular).
 * Em erro, LANÇA (throw); em cancelamento, retorna { status: "cancel" }.
 */
export function useGoogleOAuth() {
  const startGoogleOAuth = useCallback(async (): Promise<GoogleOAuthResult> => {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "movt",
      path: "auth",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes: "openid profile email",
      },
    });

    if (error) throw error;

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (res.type === "cancel" || res.type === "dismiss") {
      return { status: "cancel" };
    }

    if (res.type !== "success" || !res.url) {
      throw new Error("Fluxo de login com Google não foi concluído.");
    }

    // PKCE: a URL traz ?code=, NÃO #access_token=. O code só vira sessão se
    // combinado com o code_verifier guardado pelo SDK ao iniciar o fluxo —
    // inutilizável se outro app interceptar o custom scheme. Regex cobre ?,&,#
    // para não depender do URLSearchParams incompleto do React Native.
    const codeMatch = res.url.match(/[?&#]code=([^&#]+)/);
    const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
    if (!code) {
      throw new Error("Código de autorização não encontrado na URL de retorno.");
    }

    const {
      data: { session, user: supabaseUser },
      error: exchangeError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !supabaseUser || !session) {
      throw exchangeError || new Error("Falha ao trocar code por sessão.");
    }

    return {
      status: "success",
      access_token: session.access_token,
      supabaseUser,
    };
  }, []);

  return { startGoogleOAuth };
}
