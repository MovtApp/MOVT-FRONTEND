import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://10.0.2.2:3000";

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
    const response = await axios.put(
      `${API_BASE_URL}/api/user/update-field`,
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

    const response = await axios.put(`${API_BASE_URL}/api/user/avatar`, formData, {
      ...headers,
      headers: {
        ...headers.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Banner update will need a specific endpoint in the backend
  updateBanner: async (imageUri: string) => {
    const headers = await getAuthHeaders();
    const formData = new FormData();

    // @ts-ignore
    formData.append("banner", {
      uri: imageUri,
      name: "banner.jpg",
      type: "image/jpeg",
    });

    // We'll create this endpoint in the backend next
    const response = await axios.put(`${API_BASE_URL}/api/user/banner`, formData, {
      ...headers,
      headers: {
        ...headers.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
