import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    const formData = new FormData();

    // @ts-ignore
    formData.append("avatar", {
      uri: imageUri,
      name: "avatar.jpg",
      type: "image/jpeg",
    });

    const response = await api.put("/user/avatar", formData, {
      ...headers,
      headers: {
        ...headers.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateBanner: async (imageUri: string) => {
    const headers = await getAuthHeaders();
    const formData = new FormData();

    // @ts-ignore
    formData.append("banner", {
      uri: imageUri,
      name: "banner.jpg",
      type: "image/jpeg",
    });

    const response = await api.put("/user/banner", formData, {
      ...headers,
      headers: {
        ...headers.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
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
};
