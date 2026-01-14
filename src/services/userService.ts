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
    const response = await api.put(
      "/user/update-field",
      { field, value },
      headers
    );
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
};
