import axios from "axios";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
    const isInactiveError = error.response?.status === 403 && 
      (error.response?.data?.error === "Conta inativa" || error.response?.data?.error === "USER_INACTIVE");

    // Silencia os logs no console/expo se for apenas um erro de conta inativa (evita RedBox no dev)
    if (!isInactiveError) {
      console.error("❌ Erro na resposta:", error.response?.status, error.config?.url);
      console.error("❌ Dados do erro:", error.response?.data);
    }
    
    if (isInactiveError) {
      const { DeviceEventEmitter } = require("react-native");
      const message = error.response?.data?.message || "Sua conta foi desativada pelo administrador. Entre em contato com o suporte.";
      DeviceEventEmitter.emit("force_logout_inactive", { message });
    }
    
    return Promise.reject(error);
  }
);

export { api };
