import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { secureGet } from "./secureStore";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const sessionId = await secureGet("userSessionId");
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
    if (__DEV__) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log("🚀 Requisição enviada:", config.method?.toUpperCase(), fullUrl);
    }
    return config;
  },
  (error) => {
    console.error("❌ Erro na requisição:", error);
    return Promise.reject(error);
  }
);

// Quando a conta é excluída / o token deixa de ser válido, várias requisições
// paralelas falham ao mesmo tempo (401). Sem deduplicação isso dispararia um
// `force_logout_inactive` por request — empilhando vários Alerts e disparando
// uma cascata de logout/erros. Este flag garante UM único disparo por ciclo;
// ele é zerado assim que qualquer resposta volta com sucesso (novo login ok).
let forceLogoutEmitted = false;

api.interceptors.response.use(
  (response) => {
    forceLogoutEmitted = false;
    if (__DEV__) {
      console.log("✅ Resposta recebida:", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const isInactiveError =
      status === 403 && (data?.error === "Conta inativa" || data?.error === "USER_INACTIVE");

    // Código dedicado que o backend pode passar a devolver para a conta excluída
    // (ver docs/account-deleted-backend.md). Enquanto não existir, a conta
    // removida cai no caminho genérico de 401 abaixo.
    const isAccountDeleted = data?.error === "ACCOUNT_DELETED" || data?.code === "ACCOUNT_DELETED";

    const isUnauthorized = status === 401;

    // Conta recém-criada / sem vínculo no Supabase Auth (supabase_uid null) recebe
    // 404 "Usuário não encontrado no sistema de autenticação" em endpoints como
    // /chat. É uma condição esperada e benigna (os callers já tratam) — não deve
    // poluir o console com ERROR durante o cadastro.
    const isUserNotInAuth =
      status === 404 &&
      data?.error === "Usuário não encontrado no sistema de autenticação.";

    // 403 "Token de sessão não fornecido ou formato inválido" é apenas um SINTOMA
    // de já estarmos sem token (logout já em andamento) — não deve gerar alerta.
    const isMissingToken =
      status === 403 && typeof data?.message === "string" && data.message.includes("Token de sessão");

    // Silencia os logs no console/expo para condições de auth já tratadas.
    if (
      __DEV__ &&
      !isInactiveError &&
      !isUnauthorized &&
      !isUserNotInAuth &&
      !isMissingToken
    ) {
      console.error("❌ Erro na resposta:", status, error.config?.url);
      console.error("❌ Dados do erro:", data);
    }

    if (isInactiveError || isUnauthorized || isAccountDeleted) {
      if (!forceLogoutEmitted) {
        forceLogoutEmitted = true;
        const { DeviceEventEmitter } = require("react-native");

        const reason = isInactiveError
          ? "inactive"
          : isAccountDeleted
            ? "deleted"
            : "account_unavailable";

        DeviceEventEmitter.emit("force_logout_inactive", {
          reason,
          message: data?.message,
        });
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Permite zerar o flag de deduplicação após um logout concluído, para que um
 * futuro login que volte a falhar consiga exibir o alerta novamente.
 */
export function resetForceLogoutGuard() {
  forceLogoutEmitted = false;
}

/**
 * Indica se um erro de requisição é uma falha de autenticação ESPERADA durante
 * o logout forçado (conta excluída/inativa/sessão inválida). Os callers usam
 * isto para não poluir o console com ERROR — o fluxo já está sendo tratado
 * centralmente (alerta único + logout). Cobre 401, 403 e 404.
 */
export function isExpectedAuthError(error: any): boolean {
  const status = error?.response?.status;
  return status === 401 || status === 403 || status === 404;
}

export { api };
