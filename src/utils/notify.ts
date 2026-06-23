/**
 * notify.ts — feedback de erro centralizado.
 *
 * Estratégia em camadas (ver decisão de produto):
 *  - `notifyError` / `notifyApiError`  → Alert BLOQUEANTE. Use para AÇÕES do
 *    usuário que falharam e ele precisa saber (seguir, salvar, excluir, pagar).
 *  - `toastError` / `toastSuccess` / `toastInfo` → toast NÃO bloqueante
 *    (react-native-flash-message). Use para carregamentos/refresh de tela.
 *
 * Centralizar aqui permite trocar Alert↔toast num único lugar e padroniza as
 * mensagens. `extractApiError` mata a repetição de `err.response?.data?.error || …`.
 */
import { Alert } from "react-native";
import { showMessage } from "react-native-flash-message";

/**
 * Extrai uma mensagem amigável de um erro (axios ou Error comum).
 * - Erro de rede/sem resposta (offline/timeout) vira texto claro.
 * - Erro de API usa `data.error`/`data.message` do backend.
 * - Erro comum usa `err.message`.
 */
export function extractApiError(
  err: any,
  fallback = "Algo deu errado. Tente novamente."
): string {
  if (err?.isAxiosError) {
    if (!err.response) {
      if (err.code === "ECONNABORTED") return "A conexão expirou. Tente novamente.";
      return "Sem conexão com a internet. Verifique sua rede e tente novamente.";
    }
    return err.response?.data?.error || err.response?.data?.message || fallback;
  }
  return err?.message || fallback;
}

// ─── Bloqueante (Alert) — ações do usuário ───────────────────────────────────────

/** Alert bloqueante com uma mensagem já pronta. */
export function notifyError(message: string, title = "Erro"): void {
  Alert.alert(title, message);
}

/** Alert bloqueante derivando a mensagem de um erro de API/axios. */
export function notifyApiError(err: any, fallback?: string, title = "Erro"): void {
  Alert.alert(title, extractApiError(err, fallback));
}

// ─── Não bloqueante (toast) — carregamentos/refresh ──────────────────────────────

/** Toast de erro (vermelho), some sozinho. */
export function toastError(message: string, description?: string): void {
  showMessage({ message, description, type: "danger", icon: "danger", duration: 3500 });
}

/** Toast de sucesso (verde). */
export function toastSuccess(message: string, description?: string): void {
  showMessage({ message, description, type: "success", icon: "success", duration: 2500 });
}

/** Toast informativo (neutro). */
export function toastInfo(message: string, description?: string): void {
  showMessage({ message, description, type: "info", icon: "info", duration: 2500 });
}
