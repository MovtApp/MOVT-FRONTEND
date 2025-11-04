import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    console.log("🚀 Requisição enviada:", config.method?.toUpperCase(), config.url);
    console.log("🚀 Headers:", config.headers);
    console.log("🚀 Data:", config.data);
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
