import { createNavigationContainerRef, CommonActions } from "@react-navigation/native";
import type { RootStackParamList } from "../@types/routes";

// Ref global do NavigationContainer — permite navegar de fora de uma tela
// (ex.: do sheet de upgrade, que vive acima do NavigationContainer).
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Navega até a tela de Planos pelo caminho aninhado real:
// App → AppDrawer → HomeStack → PlanScreen.
export function navigateToPlans() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate("App", {
      screen: "AppDrawer",
      params: { screen: "HomeStack", params: { screen: "PlanScreen" } },
    })
  );
}

// Helper genérico: navega até uma tela do HomeStack respeitando o aninhamento
// real App → AppDrawer → HomeStack → <screen>.
function navigateInHomeStack(screen: string, params?: Record<string, unknown>) {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate("App", {
      screen: "AppDrawer",
      params: { screen: "HomeStack", params: { screen, params } },
    })
  );
}

/**
 * Roteia a partir do payload `data` de uma notificação tocada (push de SO ou
 * banner in-app). Mapeia o `type` para a tela de destino. Tolerante a payload
 * incompleto: se não souber rotear, simplesmente não faz nada.
 */
export function navigateFromNotification(data: any) {
  if (!data || typeof data !== "object") return;

  switch (data.type) {
    case "chat":
      if (!data.chatId) return;
      navigateInHomeStack("Chat", {
        chatId: String(data.chatId),
        participantName: data.senderName || "Conversa",
        participantAvatar: data.senderAvatar || undefined,
        participantId: data.senderId ? String(data.senderId) : "",
      });
      break;

    // Fase 2 (social): like/comment abrem o post; follow abre o perfil.
    case "like":
    case "comment":
    case "like_diet":
    case "comment_diet":
      if (data.reference_id != null) {
        navigateInHomeStack("PostDetailScreen", { postId: data.reference_id });
      }
      break;

    case "follow":
    case "follow_request":
    case "follow_accepted":
      navigateInHomeStack("ProfilePFScreen", data.senderId ? { user: { id: data.senderId } } : undefined);
      break;

    default:
      break;
  }
}
