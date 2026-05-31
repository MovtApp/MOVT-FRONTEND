import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { userService } from "../services/userService";
import { supabase } from "../services/supabaseClient";
import { api } from "../services/api";

// Define the shape of a notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  type?:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "like"
    | "comment"
    | "follow"
    | "like_diet"
    | "comment_diet";
  timestamp: Date;
  read: boolean;
  userImage?: string;
  username?: string;
  reference_id?: string | number;
}

export interface FollowRequest {
  id: string | number;
  name: string;
  username: string;
  photo: string;
  created_at: string;
}

// Define the shape of our context state
interface NotificationContextType {
  notifications: Notification[];
  followRequests: FollowRequest[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  unreadChatCount: number;
  fetchRemoteData: () => Promise<void>;
  respondToFollowRequest: (senderId: string | number, accept: boolean) => Promise<void>;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

// Define actions for the reducer
type NotificationAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "MARK_AS_READ"; payload: { id: string } }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: { id: string } }
  | { type: "CLEAR_ALL_NOTIFICATIONS" };

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Reducer function to handle state changes
const notificationReducer = (state: Notification[], action: NotificationAction): Notification[] => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return [action.payload, ...state];
    case "SET_NOTIFICATIONS":
      return action.payload;
    case "MARK_AS_READ":
      return state.map((notification) =>
        notification.id === action.payload.id ? { ...notification, read: true } : notification
      );
    case "MARK_ALL_AS_READ":
      return state.map((notification) => ({ ...notification, read: true }));
    case "REMOVE_NOTIFICATION":
      return state.filter((notification) => notification.id !== action.payload.id);
    case "CLEAR_ALL_NOTIFICATIONS":
      return [];
    default:
      return state;
  }
};

// Notification provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const fetchDebounceRef = useRef<any>(null);

  const fetchRemoteData = useCallback(async () => {
    if (!user) return;
    try {
      const [notifsResp, requestsResp] = await Promise.all([
        userService.getNotifications(),
        userService.getFollowRequests(),
      ]);

      if (notifsResp && notifsResp.success && notifsResp.data) {
        const remoteNotifs = notifsResp.data.map((n: any) => ({
          id: String(n.id),
          title:
            n.type === "like" || n.type === "like_diet"
              ? "Nova Curtida"
              : n.type === "comment" || n.type === "comment_diet"
                ? "Novo Comentário"
                : "Notificação",
          message: n.message || "",
          type: n.type || "info",
          timestamp: new Date(n.created_at),
          read: n.read || false,
          username: n.sender_username,
          userImage: n.sender_avatar,
          reference_id: n.reference_id,
        }));
        dispatch({ type: "SET_NOTIFICATIONS", payload: remoteNotifs });
      }

      if (requestsResp && requestsResp.success) {
        setFollowRequests(requestsResp.data || []);
      }

      // Adicionado: Busca conversas para somar unread_count
      const chatResp = await api.get("/chat");
      if (chatResp.status === 200) {
        const chats = chatResp.data.data || [];
        const totalUnreadChats = chats.reduce((acc: number, chat: any) => {
          // Fallback: Se o usuário logado for o último que enviou mensagem,
          // não deveria haver notificações não lidas para ele nesse chat.
          const isLastSenderMe = String(chat.last_message_sender_id) === String(user.id);
          if (isLastSenderMe) return acc;

          return acc + (chat.unread_count || 0);
        }, 0);
        setUnreadChatCount(totalUnreadChats);
      }
    } catch (err) {
      console.error("Erro ao buscar dados de notificação:", err);
    }
  }, [user]);

  // Versão com debounce: coalesce rajadas de eventos realtime (o listener de
  // "messages" não tem filtro e dispara para qualquer mensagem do app) em uma
  // única chamada de fetchRemoteData, reduzindo rede, bateria e re-renders.
  const scheduleRemoteFetch = useCallback(() => {
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(() => fetchRemoteData(), 500);
  }, [fetchRemoteData]);

  const respondToFollowRequest = useCallback(
    async (senderId: string | number, accept: boolean) => {
      try {
        const resp = await userService.respondToFollowRequest(String(senderId), accept);
        if (resp.success) {
          setFollowRequests((prev) => prev.filter((req) => String(req.id) !== String(senderId)));
          fetchRemoteData();
        }
      } catch (err) {
        console.error("Erro ao responder solicitação:", err);
      }
    },
    [fetchRemoteData]
  );

  // Function to add a new notification
  const addNotification = useCallback(
    (notificationData: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(7),
        ...notificationData,
        timestamp: new Date(),
        read: false,
      };
      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });
    },
    []
  );

  const markAsRead = useCallback(async (id: string) => {
    dispatch({ type: "MARK_AS_READ", payload: { id } });
    try {
      await userService.markNotificationAsRead(id);
    } catch (err) {
      console.error("Erro ao sincronizar leitura de notificação:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    dispatch({ type: "MARK_ALL_AS_READ" });
    try {
      await userService.markAllNotificationsAsRead();
    } catch (err) {
      console.error("Erro ao sincronizar limpeza de notificações:", err);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: { id } });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: "CLEAR_ALL_NOTIFICATIONS" });
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length + followRequests.length,
    [notifications, followRequests]
  );

  useEffect(() => {
    if (!user) return;

    // 1. Initial Fetch
    fetchRemoteData();

    // 2. Realtime Subscription via Supabase
    const userId = user.id_us || user.id;
    if (!userId) return;

    const channel = supabase
      .channel("notifications-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleRemoteFetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          // Idealmente filtraríamos por receiver_id, mas para garantir
          // que qualquer mudança no chat atualize o contador, ouvimos as mensagens.
          // O fetchRemoteData fará a filtragem correta via API.
        },
        () => scheduleRemoteFetch()
      )
      .subscribe();

    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, fetchRemoteData, scheduleRemoteFetch]);

  const value = useMemo(
    () => ({
      notifications,
      followRequests,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      unreadCount,
      unreadChatCount,
      fetchRemoteData,
      respondToFollowRequest,
      activeChatId,
      setActiveChatId,
    }),
    [
      notifications,
      followRequests,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      unreadCount,
      unreadChatCount,
      fetchRemoteData,
      respondToFollowRequest,
      activeChatId,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
