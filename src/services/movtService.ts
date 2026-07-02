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

/**
 * O app está isento da otimização de bateria? Quando NÃO está, o SO congela o
 * processo com a tela apagada e o rastreio do treino para. iOS/sem módulo → true
 * (não se aplica). Falha → true para não incomodar o usuário à toa.
 */
export const isIgnoringBatteryOptimizations = async (): Promise<boolean> => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.isIgnoringBatteryOptimizations) return true;
  try {
    return await MOVTServiceModule.isIgnoringBatteryOptimizations();
  } catch {
    return true;
  }
};

/**
 * Abre o diálogo do sistema "Permitir rodar em segundo plano?" (1 toque). Só
 * mostra se o app ainda não estiver isento — checagem feita no nativo. No-op no iOS.
 */
export const requestIgnoreBatteryOptimizations = () => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.requestIgnoreBatteryOptimizations) return;
  try {
    MOVTServiceModule.requestIgnoreBatteryOptimizations();
  } catch (error) {
    console.warn("[MOVTService] Falha ao pedir isenção de bateria:", error);
  }
};

/**
 * Segura um WakeLock parcial durante o treino para o Doze não suspender a CPU
 * (e, com ela, a task que processa os fixes de GPS) com a tela apagada. No-op no iOS.
 */
export const acquireWorkoutWakeLock = () => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.acquireWakeLock) return;
  try {
    MOVTServiceModule.acquireWakeLock();
  } catch (error) {
    console.warn("[MOVTService] Falha ao adquirir wakelock:", error);
  }
};

/** Libera o WakeLock do treino (chamar ao finalizar). No-op no iOS. */
export const releaseWorkoutWakeLock = () => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.releaseWakeLock) return;
  try {
    MOVTServiceModule.releaseWakeLock();
  } catch (error) {
    console.warn("[MOVTService] Falha ao liberar wakelock:", error);
  }
};
