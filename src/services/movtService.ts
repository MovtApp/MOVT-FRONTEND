import { NativeModules, Platform } from "react-native";

const { MOVTServiceModule } = NativeModules;

/**
 * Inicia o Serviço em Primeiro Plano (Foreground Service) no Android.
 * Exibe uma notificação persistente para o usuário, permitindo o rastreamento em segundo plano.
 * 
 * @param title Título da notificação (ex: "MOVT - Treino em Andamento")
 * @param body Texto descritivo da notificação (ex: "Rastreando seu percurso de ciclismo...")
 */
export const startMOVTService = (title: string, body: string) => {
  if (Platform.OS === "android") {
    if (MOVTServiceModule) {
      try {
        MOVTServiceModule.startService(title, body);
        console.log("[MOVTService] Foreground service iniciado com sucesso.");
      } catch (error) {
        console.error("[MOVTService] Falha ao iniciar foreground service:", error);
      }
    } else {
      console.warn("[MOVTService] MOVTServiceModule nativo não encontrado.");
    }
  }
};

/**
 * Para o Serviço em Primeiro Plano (Foreground Service) no Android, ocultando a notificação.
 */
export const stopMOVTService = () => {
  if (Platform.OS === "android") {
    if (MOVTServiceModule) {
      try {
        MOVTServiceModule.stopService();
        console.log("[MOVTService] Foreground service parado com sucesso.");
      } catch (error) {
        console.error("[MOVTService] Falha ao parar foreground service:", error);
      }
    } else {
      console.warn("[MOVTService] MOVTServiceModule nativo não encontrado.");
    }
  }
};
