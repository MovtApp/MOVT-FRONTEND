import axios from "axios";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const sessionId = await AsyncStorage.getItem("userSessionId");
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log("🚀 Requisição enviada:", config.method?.toUpperCase(), fullUrl);
    return config;
  },
  (error) => {
    console.error("❌ Erro na requisição:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ Resposta recebida:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Erro na resposta:", error.response?.status, error.config?.url);
    console.error("❌ Dados do erro:", error.response?.data);
    return Promise.reject(error);
  }
);

export { api };
