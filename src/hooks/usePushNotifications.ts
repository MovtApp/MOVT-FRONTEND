/**
 * usePushNotifications — cola a entrega de push de SO à experiência do app.
 *
 * Responsabilidades:
 *  1. Registrar o token de push quando o usuário está logado.
 *  2. Handler global (foreground): decide se mostra o banner do SO. Se o usuário
 *     já está na conversa de onde veio a mensagem, NÃO mostra nada (igual
 *     WhatsApp). Caso contrário, suprime o banner do SO e deixamos o nosso banner
 *     in-app (flash-message) cuidar do visual.
 *  3. Listener "received" (foreground): mostra o banner in-app tocável.
 *  4. Listener "response" (toque na notificação): deep-link para a tela certa.
 *  5. Cold start: se o app foi aberto tocando numa notificação, navega para ela.
 *
 * O handler é registrado uma vez (nível de módulo). O chat ativo é sincronizado
 * para uma variável de módulo, porque `handleNotification` roda fora do React.
 */
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { navigateFromNotification } from "../services/navigationRef";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { registerForPushNotifications, ACTION_IDS } from "../services/pushNotificationService";
import { showRichNotification } from "../components/RichNotificationBanner";
import { userService } from "../services/userService";
import { api } from "../services/api";

/**
 * Executa a ação de um botão da notificação (Responder / Aceitar / Recusar /
 * Curtir) SEM abrir o app.
 *
 * ⚠️ Limite real: isto roda no JS do app. Com o processo vivo (foreground ou
 * background) funciona; com o app MORTO, o SO até entrega a resposta, mas o
 * JS pode não subir a tempo de completar a chamada. WhatsApp/Instagram fazem
 * essa parte em código nativo. Se falhar, a notificação some e a ação não
 * acontece — por isso todo caminho aqui é tolerante e silencioso.
 */
async function runNotificationAction(actionIdentifier: string, userText: string | undefined, data: any) {
  try {
    switch (actionIdentifier) {
      case ACTION_IDS.reply: {
        const text = (userText || "").trim();
        if (!text) return;
        if (data?.type === "chat" && data?.chatId) {
          await api.post(`/chat/${data.chatId}/messages`, { text });
        } else if (data?.reference_id) {
          await userService.addComment(String(data.reference_id), text);
        }
        return;
      }
      case ACTION_IDS.accept:
      case ACTION_IDS.reject: {
        if (!data?.senderId) return;
        await userService.respondToFollowRequest(
          String(data.senderId),
          actionIdentifier === ACTION_IDS.accept
        );
        return;
      }
      case ACTION_IDS.like: {
        if (!data?.reference_id) return;
        await userService.toggleLike(String(data.reference_id));
        return;
      }
      default:
        return;
    }
  } catch {
    // Silencioso: a notificação já sumiu da bandeja, não há onde mostrar erro.
  }
}

// Chat aberto no momento — usado pelo handler para suprimir a notificação da
// própria conversa. Atualizado pelo hook a cada mudança de `activeChatId`.
let activeChatIdForPush: string | null = null;

// Handler global do foreground. Em background/fechado o SO mostra sozinho — este
// handler só é consultado quando o app está em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data: any = notification.request.content.data || {};
    const isActiveChat =
      data?.type === "chat" &&
      data?.chatId != null &&
      String(data.chatId) === String(activeChatIdForPush);

    if (isActiveChat) {
      // Já estou na conversa: silêncio total (a lista de mensagens já atualiza).
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    // Foreground em outra tela: suprimimos o banner do SO e exibimos o nosso
    // banner in-app (estilo WhatsApp) no listener "received". Mantemos som/badge.
    return {
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  },
});

export function usePushNotifications() {
  const { user } = useAuth();
  const { activeChatId, fetchRemoteData } = useNotifications();

  // Mantém a variável de módulo em sincronia com o chat aberto.
  const fetchRef = useRef(fetchRemoteData);
  fetchRef.current = fetchRemoteData;
  useEffect(() => {
    activeChatIdForPush = activeChatId;
  }, [activeChatId]);

  // 1) Registra o token sempre que houver usuário logado.
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications();
  }, [user?.id]);

  // 2) Listeners de foreground (banner in-app) e de toque (deep-link).
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data: any = content.data || {};

      // Supressão: mensagem da conversa que já está aberta → só atualiza contadores.
      if (
        data?.type === "chat" &&
        data?.chatId != null &&
        String(data.chatId) === String(activeChatIdForPush)
      ) {
        fetchRef.current?.();
        return;
      }

      // Banner in-app rico (avatar + nome + ação + miniatura), estilo Instagram.
      showRichNotification({
        title: content.title || "Nova notificação",
        body: content.body || undefined,
        avatar: data?.senderAvatar || undefined,
        thumbnail: data?.type === "new_post" ? (data?.image as string) || undefined : undefined,
        type: data?.type,
        onPress: () => navigateFromNotification(data),
      });

      // Atualiza sino/contadores em segundo plano.
      fetchRef.current?.();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data: any = response.notification.request.content.data || {};
      const actionId = response.actionIdentifier;

      // Toque no corpo da notificação → abre a tela.
      if (!actionId || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        navigateFromNotification(data);
        return;
      }

      // Botão de ação → executa sem abrir o app e só atualiza os contadores.
      const userText = (response as any)?.userText as string | undefined;
      runNotificationAction(actionId, userText, data).finally(() => fetchRef.current?.());
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  // 3) Cold start: app aberto a partir de uma notificação tocada.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (!cancelled && last) {
          const data: any = last.notification.request.content.data || {};
          // Pequeno atraso para garantir que a navegação esteja pronta.
          setTimeout(() => navigateFromNotification(data), 600);
        }
      } catch {
        // silencioso
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
