import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { api } from "@/services/api";
import { userService } from "@/services/userService";

// Cache global para persistir dados entre navegações
const globalChatCache: {
  list: Chat[];
  messages: Record<string, Message[]>;
  profiles: Record<string, any>;
  lastFetch: number;
} = {
  list: [],
  messages: {},
  profiles: {},
  lastFetch: 0,
};

export interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string;
  last_timestamp: string;
  participant_name?: string;
  participant_avatar?: string;
  unread_count?: number;
  last_sender_id?: string;
}

export interface Message {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: string | number;
    name: string;
    avatar: string;
  };
  image?: string;
  pending?: boolean;
  read?: boolean;
}

export const useChats = (userId: string) => {
  const [chats, setChats] = useState<Chat[]>(globalChatCache.list);
  const { user } = useAuth();
  const sessionId = user?.sessionId;

  const fetchChats = useCallback(async () => {
    if (!sessionId) return;
    try {
      const resp = await api.get("/chat");
      if (resp.status === 200) {
        const data = resp.data.data || [];
        globalChatCache.list = data;
        globalChatCache.lastFetch = Date.now();
        setChats(data);
      }
    } catch (e) {
      console.error("useChats error:", e);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchChats();

    // Opcional: Escutar mudanças na tabela chats para atualizar a lista em tempo real
    const subscription = supabase
      .channel("public:chats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, () => {
        console.log("Novo chat detectado!");
        fetchChats();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chats" }, () => {
        console.log("Chat atualizado!");
        fetchChats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchChats]);

  const deleteChat = async (chatId: string) => {
    if (!sessionId) return;

    // Optimistic Update: Remove da UI e do cache
    const originalChats = [...chats];
    const newChats = chats.filter((c) => c.id !== chatId);

    setChats(newChats);
    globalChatCache.list = newChats;

    try {
      const resp = await api.delete(`/chat/${chatId}`);
      if (resp.status !== 200 && resp.status !== 204) {
        throw new Error("Falha ao deletar chat");
      }

      // Limpar mensagens do cache também
      delete globalChatCache.messages[chatId];
    } catch (e: any) {
      // Se for 404, significa que já foi deletado, então não precisamos reverter a UI
      if (e?.response?.status === 404) {
        console.log("[Chat] Chat já não existia no servidor (404), mantendo UI limpa.");
        return;
      }

      console.error("deleteChat error:", e);
      // Reverte se falhar por outros motivos
      setChats(originalChats);
      globalChatCache.list = originalChats;
      Alert.alert("Erro", "Não foi possível excluir a conversa.");
    }
  };

  return { chats, refreshChats: fetchChats, deleteChat };
};

export const useMessages = (chatId: string, userId: string) => {
  const [messages, setMessages] = useState<Message[]>(globalChatCache.messages[chatId] || []);
  const { user } = useAuth();
  const sessionId = user?.sessionId;
  const isFetchingRef = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(
    async (isSilent = false) => {
      if (!sessionId || !chatId) return;

      // Evita múltiplas buscas pesadas ao mesmo tempo, mas permite o "silent" (realtime)
      if (isFetchingRef.current && !isSilent) return;

      if (isSilent) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => executeFetch(), 400);
        return;
      }

      await executeFetch();

      async function executeFetch() {
        isFetchingRef.current = true;
        try {
          const resp = await api.get(`/chat/${chatId}/messages`, {
            params: { limit: 50, offset: 0 },
          });
          if (resp.status === 200) {
            const data = resp.data.data || [];
            const formatted: Message[] = data.map((msg: any) => ({
              _id: msg.id,
              text: msg.text || "",
              image: msg.image_url,
              createdAt: new Date(msg.created_at),
              user: {
                _id: msg.sender_id,
                name: String(msg.sender_id) === String(userId) ? "Eu" : "Participante",
                avatar: `https://i.pravatar.cc/150?u=${msg.sender_id}`,
              },
              read: !!msg.is_read,
            }));

            setMessages((prev) => {
              const newMessages =
                prev.length === 0 || !isSilent
                  ? formatted
                  : (() => {
                      // Merge inteligente: Atualiza status de leitura e insere novas
                      const prevMap = new Map(prev.map((m) => [String(m._id), m]));
                      let hasChanges = false;

                      const merged = formatted.map((newMsg) => {
                        const existing = prevMap.get(String(newMsg._id));
                        if (existing) {
                          if (existing.read !== newMsg.read) {
                            hasChanges = true;
                            return { ...existing, read: newMsg.read };
                          }
                          return existing;
                        }
                        hasChanges = true;
                        return newMsg;
                      });
                      // CORREÇÃO: Se a lista da API for menor, algo foi deletado
                      if (formatted.length < prev.length) {
                        console.log("[Chat Realtime] Mensagem deletada!");
                        return formatted;
                      }

                      return hasChanges || formatted.length !== prev.length ? merged : prev;
                    })();

              globalChatCache.messages[chatId] = newMessages;
              return newMessages;
            });
          }
        } catch (e) {
          console.error("useMessages fetch error:", e);
        } finally {
          isFetchingRef.current = false;
        }
      }
    },
    [chatId, sessionId, userId]
  );

  useEffect(() => {
    // Não limpa imediatamente para manter o cache visível
    fetchMessages();

    const channel = supabase
      .channel(`chat_sync_${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log("[Chat Realtime] Evento:", payload.eventType);

          if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setMessages((prev) => {
                if (prev.some((m) => String(m._id) === String(deletedId))) {
                  return prev.filter((m) => String(m._id) !== String(deletedId));
                }
                return prev;
              });
            }
          } else {
            // INSERT ou UPDATE: Fetcha para garantir dados completos/status
            fetchMessages(true);
          }
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages]);

  const sendMessage = async (newMessages: any[]) => {
    if (!sessionId || !chatId) return;
    const msg = newMessages[0];
    const tempId = Math.random().toString(36).substr(2, 9);

    // Optimistic Update: Adiciona na UI antes de salvar no servidor
    const optimisticMsg: Message = {
      ...msg,
      _id: tempId,
      createdAt: new Date(),
      pending: true,
      read: false,
      user: { _id: userId, name: "Eu", avatar: "" },
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      const resp = await api.post(`/chat/${chatId}/messages`, {
        text: msg.text,
        image_url: msg.image,
      });

      if (resp.status === 201 || resp.status === 200) {
        const result = resp.data;
        const savedMsg = result.data;

        // Substituir a otimista pela real do banco
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(tempId)
              ? {
                  ...m,
                  _id: savedMsg.id,
                  text: savedMsg.text ? savedMsg.text : msg.text,
                  createdAt: new Date(savedMsg.created_at),
                  image: savedMsg.image_url,
                  read: !!savedMsg.is_read,
                }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => String(m._id) !== String(tempId)));
        Alert.alert("Erro", "Erro ao enviar mensagem.");
      }
    } catch (e) {
      console.error("sendMessage error:", e);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const uploadMedia = async (fileUri: string): Promise<string | null> => {
    if (!supabase) return null;
    try {
      const fileName = `${chatId}/${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: "image/jpeg",
      } as any);

      const fileExt = fileUri.split(".").pop();
      const path = `chat_attachments/${chatId}/${Date.now()}.${fileExt}`;

      // Para simplificar, usaremos o Blob se disponível ou o sistema de arquivos
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("avatars") // Reutilizando bucket existente ou use um novo
        .upload(path, blob);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      return publicUrl;
    } catch (e) {
      console.error("Upload media error:", e);
      return null;
    }
  };

  const markAsRead = async () => {
    if (!sessionId || !chatId) return;
    try {
      await api.post(`/chat/${chatId}/read`);
    } catch (e) {
      console.error("markAsRead error:", e);
    }
  };

  const deletingRef = useRef<Set<string | number>>(new Set());

  const deleteMessage = async (messageId: string | number) => {
    if (!sessionId || !chatId) return;

    // Evita chamadas duplicadas para a mesma mensagem
    if (deletingRef.current.has(messageId)) {
      console.log("[Chat] Já existe uma exclusão em andamento para:", messageId);
      return;
    }

    try {
      deletingRef.current.add(messageId);

      // Optimistic Update: Remove da UI e do cache
      const originalMessages = [...messages];
      const newMessages = messages.filter((m) => String(m._id) !== String(messageId));

      setMessages(newMessages);
      globalChatCache.messages[chatId] = newMessages;

      try {
        const resp = await api.delete(`/chat/messages/${messageId}`);
        if (resp.status !== 200 && resp.status !== 204) {
          throw new Error("Falha ao deletar");
        }
      } catch (e: any) {
        // Se for 404, significa que já foi deletado, então não precisamos reverter a UI
        if (e?.response?.status === 404) {
          console.log("[Chat] Mensagem já não existia no servidor (404), mantendo UI limpa.");
          return;
        }

        console.error("deleteMessage error:", e);
        // Reverte se falhar por outros motivos (conexão, permissão, etc)
        setMessages(originalMessages);
        globalChatCache.messages[chatId] = originalMessages;
        Alert.alert("Erro", "Não foi possível excluir a mensagem.");
      }
    } finally {
      // Pequeno delay para garantir que o evento de realtime chegue ou a UI estabilize
      setTimeout(() => {
        deletingRef.current.delete(messageId);
      }, 1000);
    }
  };

  return {
    messages: messages || [],
    sendMessage,
    uploadMedia,
    markAsRead,
    deleteMessage,
    refresh: fetchMessages,
  };
};

// Hook para acessar/atualizar o cache de perfil
export const useProfileCache = (userId: string) => {
  const [profile, setProfile] = useState<any>(globalChatCache.profiles[userId] || null);

  const updateProfileCache = useCallback(
    (data: any) => {
      if (!userId) return;
      globalChatCache.profiles[userId] = {
        ...(globalChatCache.profiles[userId] || {}),
        ...data,
        lastUpdate: Date.now(),
      };
      setProfile(globalChatCache.profiles[userId]);
    },
    [userId]
  );

  return { profile, updateProfileCache };
};

// Hook para inicializar o cache global (deve ser chamado no início do App)
export const usePreloadChat = () => {
  const { user } = useAuth();
  const sessionId = user?.sessionId;
  const effectiveUserId = user?.supabaseUserId || "";

  useEffect(() => {
    if (!sessionId) return;

    const preload = async () => {
      try {
        const resp = await api.get("/chat");
        if (resp.status === 200) {
          const chatList = resp.data.data || [];
          globalChatCache.list = chatList;
          globalChatCache.lastFetch = Date.now();

          // Preload das mensagens e perfis dos 3 chats mais recentes
          chatList.slice(0, 3).forEach(async (chat: any) => {
            const myUUID = String(effectiveUserId).toLowerCase();
            const otherUUID =
              String(chat.participant1_id).toLowerCase() === myUUID
                ? chat.participant2_id
                : chat.participant1_id;

            try {
              // Preload mensagens
              const mResp = await api.get(`/chat/${chat.id}/messages`, { params: { limit: 20 } });
              if (mResp.status === 200) {
                globalChatCache.messages[chat.id] = mResp.data.data.map((msg: any) => ({
                  _id: msg.id,
                  text: msg.text || "",
                  createdAt: new Date(msg.created_at),
                  user: {
                    _id: msg.sender_id,
                    name: String(msg.sender_id) === String(effectiveUserId) ? "Eu" : "Participante",
                    avatar: `https://i.pravatar.cc/150?u=${msg.sender_id}`,
                  },
                  read: !!msg.is_read,
                }));
              }

              // Preload perfil completo do participante
              const [pRes, sRes, poRes] = await Promise.allSettled([
                userService.getUserProfile(otherUUID),
                userService.getUserStats(otherUUID),
                userService.getUserPosts(otherUUID),
              ]);

              const profileData =
                pRes.status === "fulfilled" && pRes.value.success ? pRes.value.data : null;
              if (profileData) {
                globalChatCache.profiles[otherUUID] = {
                  ...profileData,
                  stats: sRes.status === "fulfilled" && sRes.value.success ? sRes.value.data : null,
                  posts:
                    poRes.status === "fulfilled" && poRes.value.success ? poRes.value.data : null,
                  lastUpdate: Date.now(),
                };
              }
            } catch (e) {
              /* silent */
            }
          });
        }
      } catch (e) {
        /* silent */
      }
    };

    preload();
  }, [sessionId, effectiveUserId]);
};
