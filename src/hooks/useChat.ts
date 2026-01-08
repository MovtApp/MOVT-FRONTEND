import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string;
  last_timestamp: string;
  participant_name?: string;
  participant_avatar?: string;
  unread_count?: number;
}

export interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  image?: string;
}

const getApiBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";
  if (url.includes("localhost")) url = url.replace("localhost", "10.0.2.2");
  return url;
};

export const useChats = (userId: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();
  const sessionId = user?.sessionId;

  const fetchChats = useCallback(async () => {
    if (!sessionId) return;
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/chat`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      if (resp.ok) {
        const result = await resp.json();
        setChats(result.data || []);
      }
    } catch (e) {
      console.error("useChats error:", e);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  return chats;
};

export const useMessages = (chatId: string, userId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const { user } = useAuth();
  const sessionId = user?.sessionId;

  const fetchMessages = useCallback(async () => {
    if (!sessionId || !chatId) return;
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      if (resp.ok) {
        const result = await resp.json();
        const data = result.data || [];
        const formatted = data.map((msg: any) => ({
          _id: msg.id,
          text: msg.text,
          createdAt: new Date(msg.created_at),
          user: {
            _id: msg.sender_id,
            name: msg.sender_id === userId ? "Eu" : "Outro", // Simplify names as GiftedChat needs them but header has them
            avatar: "https://i.pravatar.cc/150?img=1",
          },
        }));
        setMessages(formatted);
      }
    } catch (e) {
      console.error("useMessages error:", e);
    }
  }, [chatId, sessionId, userId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async (newMessages: any[]) => {
    if (!sessionId || !chatId) return;
    const msg = newMessages[0];
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: msg.text }),
      });
      if (resp.ok) {
        const result = await resp.json();
        const createdMsg = {
          _id: result.data.id,
          text: result.data.text,
          createdAt: new Date(result.data.created_at),
          user: { _id: userId, name: "Eu", avatar: "" },
        };
        setMessages((prev) => [createdMsg, ...prev]);
      }
    } catch (e) {
      console.error("sendMessage error:", e);
    }
  };

  return { messages, sendMessage };
};
