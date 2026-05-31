import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { secureGet } from "./secureStore";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const sessionId = await secureGet("userSessionId");
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
    if (__DEV__) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log("🚀 Requisição enviada:", config.method?.toUpperCase(), fullUrl);
    }
    return config;
  },
  (error) => {
    console.error("❌ Erro na requisição:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("✅ Resposta recebida:", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const isInactiveError =
      error.response?.status === 403 &&
      (error.response?.data?.error === "Conta inativa" ||
        error.response?.data?.error === "USER_INACTIVE");

    const isUnauthorized = error.response?.status === 401;

    // Silencia os logs no console/expo se for apenas um erro de conta inativa ou não autorizado
    if (__DEV__ && !isInactiveError && !isUnauthorized) {
      console.error("❌ Erro na resposta:", error.response?.status, error.config?.url);
      console.error("❌ Dados do erro:", error.response?.data);
    }

    if (isInactiveError || isUnauthorized) {
      const { DeviceEventEmitter } = require("react-native");
      const message = isUnauthorized
        ? "Sua sessão expirou. Por favor, faça login novamente."
        : error.response?.data?.message || "Sua conta foi desativada pelo administrador.";

      DeviceEventEmitter.emit("force_logout_inactive", { message });
    }

    return Promise.reject(error);
  }
);

export { api };
