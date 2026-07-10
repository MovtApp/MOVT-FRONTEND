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

// ─── Onboarding OEM (Autostart / gestão agressiva de background) ────────────────

// Fabricantes com gestão de background notoriamente agressiva, que matam o
// foreground service do treino mesmo com isenção de bateria — precisam do passo
// extra de "Autostart" (ver dontkillmyapp.com). Em minúsculas (Build.MANUFACTURER).
const AGGRESSIVE_OEMS = [
  "xiaomi",
  "redmi",
  "poco",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "realme",
  "oneplus",
  "meizu",
  "asus",
  "letv",
  "samsung", // menos agressiva, mas ainda tem "Sleeping apps"
];

/** Fabricante do device em minúsculas (ex.: "xiaomi"). "" no iOS/sem módulo. */
export const getDeviceManufacturer = async (): Promise<string> => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.getDeviceManufacturer) return "";
  try {
    return (await MOVTServiceModule.getDeviceManufacturer()) || "";
  } catch {
    return "";
  }
};

/**
 * Este device é de um fabricante com gestão de background agressiva? Usado para
 * decidir se mostramos o guia de Autostart antes/durante o treino.
 */
export const isAggressiveOEM = async (): Promise<boolean> => {
  const m = await getDeviceManufacturer();
  return AGGRESSIVE_OEMS.some((oem) => m.includes(oem));
};

/**
 * Abre a tela de "Autostart / iniciar automaticamente" do OEM (quando existe).
 * Resolve true se abriu a tela específica do fabricante; false se caiu no
 * fallback (detalhes do app). No-op no iOS → false.
 */
export const openAutoStartSettings = async (): Promise<boolean> => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.openAutoStartSettings) return false;
  try {
    return await MOVTServiceModule.openAutoStartSettings();
  } catch (error) {
    console.warn("[MOVTService] Falha ao abrir Autostart:", error);
    return false;
  }
};

/** Abre os detalhes do app nos Ajustes do sistema (fallback universal). No-op no iOS. */
export const openAppDetailsSettings = async (): Promise<void> => {
  if (Platform.OS !== "android" || !MOVTServiceModule?.openAppDetailsSettings) return;
  try {
    await MOVTServiceModule.openAppDetailsSettings();
  } catch (error) {
    console.warn("[MOVTService] Falha ao abrir detalhes do app:", error);
  }
};
