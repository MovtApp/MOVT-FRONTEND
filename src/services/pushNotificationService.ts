/**
 * pushNotificationService.ts — registro de notificações de SO (push remoto).
 *
 * Usa `expo-notifications` por cima de FCM (Android) / APNs (iOS) via Expo Push
 * Service. O fluxo de ENTREGA acontece no backend (services/pushService.js); aqui
 * só cuidamos do lado do dispositivo:
 *  - pedir permissão (inclui POST_NOTIFICATIONS no Android 13+),
 *  - criar os canais Android (importância/sound/vibração por tipo),
 *  - obter o Expo Push Token e registrá-lo no backend,
 *  - remover o token no logout.
 *
 * O HANDLER global e os LISTENERS (banner in-app + deep-link) ficam no hook
 * `usePushNotifications`, que tem acesso a navegação e ao estado de chat ativo.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "./api";

// Canais Android — definem como a notificação aparece (heads-up, som, vibração).
export const ANDROID_CHANNELS = {
  messages: "messages",
  social: "social",
  reminders: "reminders",
} as const;

let cachedToken: string | null = null;

/** Cria/atualiza os canais de notificação do Android (no-op no iOS). */
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  // Mensagens: prioridade máxima (heads-up por cima de tudo, igual WhatsApp).
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.messages, {
    name: "Mensagens",
    description: "Novas mensagens no chat",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#22C55E",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });

  // Social: curtidas, comentários, seguidores (importância alta, sem ser intrusivo).
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.social, {
    name: "Atividade social",
    description: "Curtidas, comentários e novos seguidores",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 200],
    lightColor: "#22C55E",
  });

  // Lembretes: treinos/metas (importância padrão).
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.reminders, {
    name: "Lembretes",
    description: "Lembretes de treino e metas",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

/** Pede permissão de notificação, retornando se foi concedida. */
export async function requestPushPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === "granted";
}

/** Resolve o projectId do EAS, necessário para o getExpoPushTokenAsync. */
function getProjectId(): string | undefined {
  return (
    (Constants?.expoConfig?.extra as any)?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId ||
    undefined
  );
}

/**
 * Registra o dispositivo para push: cria canais, pede permissão, pega o token e
 * envia ao backend. Idempotente — pode ser chamado a cada login sem efeito
 * colateral. Retorna o token (ou null se sem permissão/erro).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    await setupAndroidChannels();

    const granted = await requestPushPermission();
    if (!granted) {
      if (__DEV__) console.log("[push] permissão negada");
      return null;
    }

    const projectId = getProjectId();
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;
    cachedToken = token;

    await api.post("/notifications/register-token", {
      token,
      platform: Platform.OS,
    });
    if (__DEV__) console.log("[push] token registrado no backend");
    return token;
  } catch (err) {
    if (__DEV__) console.log("[push] falha no registro:", err);
    return null;
  }
}

/**
 * Remove o token deste dispositivo no backend (chamar no logout para o usuário
 * parar de receber push numa conta da qual saiu).
 */
export async function unregisterPushNotifications(): Promise<void> {
  if (!cachedToken) return;
  try {
    await api.delete("/notifications/token", { data: { token: cachedToken } });
  } catch (err) {
    if (__DEV__) console.log("[push] falha ao remover token:", err);
  } finally {
    cachedToken = null;
  }
}

export function getCachedPushToken(): string | null {
  return cachedToken;
}
