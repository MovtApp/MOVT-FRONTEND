import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { supabase } from "./supabaseClient";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

const getAuthHeaders = async () => {
  const sessionId = await AsyncStorage.getItem("userSessionId");
  return {
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  };
};

export const userService = {
  updateField: async (field: string, value: string) => {
    const headers = await getAuthHeaders();
    const response = await api.put("/user/update-field", { field, value }, headers);
    return response.data;
  },

  updateAvatar: async (imageUri: string) => {
    const headers = await getAuthHeaders();

    try {
      // 1. Ler o arquivo como base64 (Método ultra-estável no Expo)
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });

      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const mimetype = match ? `image/${match[1]}` : `image/jpeg`;

      // 2. Enviar para o Back-end via JSON (Zero erros de Multipart ou RLS)
      const response = await api.put(
        "/user/avatar-base64",
        {
          base64,
          mimetype,
        },
        headers
      );

      return {
        success: true,
        photo: response.data.data?.photo,
        ...response.data,
      };
    } catch (error) {
      console.error("Erro no Upload Pro (Base64 Bridge):", error);
      throw error;
    }
  },

  updateBanner: async (imageUri: string) => {
    const headers = await getAuthHeaders();

    try {
      // 1. Ler o arquivo
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });

      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const mimetype = match ? `image/${match[1]}` : `image/jpeg`;

      // 2. Enviar para o Back-end
      const response = await api.put(
        "/user/banner-base64",
        {
          base64,
          mimetype,
        },
        headers
      );

      return {
        success: true,
        banner: response.data.data?.banner,
        ...response.data,
      };
    } catch (error) {
      console.error("Erro no Upload do Banner (Base64 Bridge):", error);
      throw error;
    }
  },

  getUserPosts: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/${userId}/posts`, headers);
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/${userId}`, headers);
    return response.data;
  },

  followUser: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.post(`/user/${userId}/follow`, {}, headers);
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.delete(`/user/${userId}/unfollow`, headers);
    return response.data;
  },

  getFollowStatus: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/${userId}/follow-status`, headers);
    return response.data;
  },

  getUserStats: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/${userId}/stats`, headers);
    return response.data;
  },

  getUserFollowers: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/${userId}/followers`, headers);
    return response.data;
  },

  getUserFollowing: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/${userId}/following`, headers);
    return response.data;
  },

  updateBio: async (bio: string) => {
    const headers = await getAuthHeaders();
    const response = await api.put("/user/bio", { bio }, headers);
    return response.data;
  },
  deletePost: async (postId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.delete(`/user/posts/${postId}`, headers);
    return response.data;
  },
  updatePost: async (postId: string, legenda: string) => {
    const headers = await getAuthHeaders();
    const response = await api.patch(`/user/posts/${postId}`, { legenda }, headers);
    return response.data;
  },
  toggleLike: async (postId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.post(`/user/posts/${postId}/like`, {}, headers);
    return response.data;
  },
  addComment: async (postId: string, comentario: string) => {
    const headers = await getAuthHeaders();
    const response = await api.post(`/user/posts/${postId}/comment`, { comentario }, headers);
    return response.data;
  },
  getComments: async (postId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/posts/${postId}/comments`, headers);
    return response.data;
  },
  deleteComment: async (commentId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.delete(`/user/posts/comments/${commentId}`, headers);
    return response.data;
  },
  archivePost: async (postId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.post(`/user/posts/${postId}/archive`, {}, headers);
    return response.data;
  },

  unarchivePost: async (postId: string) => {
    const headers = await getAuthHeaders();
    const response = await api.post(`/user/posts/${postId}/unarchive`, {}, headers);
    return response.data;
  },

  getArchivedPosts: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/user/posts/archived`, headers);
    return response.data;
  },

  getNotifications: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get("/user/notifications", headers);
    return response.data;
  },

  getFollowRequests: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get("/user/follow-requests", headers);
    return response.data;
  },

  respondToFollowRequest: async (targetId: string, accept: boolean) => {
    const headers = await getAuthHeaders();
    const response = await api.post(
      `/user/follow-requests/${targetId}/respond`,
      { accept },
      headers
    );
    return response.data;
  },
  markNotificationAsRead: async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await api.put(`/user/notifications/${id}/read`, {}, headers);
    return response.data;
  },
  markAllNotificationsAsRead: async () => {
    const headers = await getAuthHeaders();
    const response = await api.put("/user/notifications/read-all", {}, headers);
    return response.data;
  },

  completeRegistration: async (data: {
    nome: string;
    email: string;
    senha?: string;
    genero?: string;
    idade?: number;
    altura?: number;
    peso?: number;
    objetivo?: string;
    nivel?: string;
  }) => {
    // Para login social, usamos o endpoint de complete-onboarding
    // Se houver senha, poderíamos usar o /register, mas para unificar o fluxo Info,
    // usamos o update de perfil.
    const response = await api.post("/user/complete-onboarding", data);
    return response.data;
  },
};
