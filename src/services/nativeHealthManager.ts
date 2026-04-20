import { Platform } from "react-native";
import {
  ensureHealthConnectPermissions,
  fetchHealthConnectSteps,
  fetchHealthConnectHeartRate,
  fetchHealthConnectCalories,
  fetchHealthConnectOxygen,
} from "./healthConnectService";
import {
  ensureHealthKitPermissions,
  fetchHealthKitSteps,
  fetchHealthKitHeartRate,
  fetchHealthKitCalories,
} from "./appleHealthKitService";

export interface NativeHealthData {
  steps: number;
  heartRate: number;
}

let isSimulationState = false;

export const NativeHealthManager = {
  authorize: async (): Promise<boolean> => {
    let success = false;
    try {
      if (Platform.OS === "android") {
        success = await ensureHealthConnectPermissions();
      } else if (Platform.OS === "ios") {
        success = await ensureHealthKitPermissions();
      }
    } catch (error) {
      console.log("ℹ️ Saúde Nativa: Módulos indisponíveis (Expo Go). Ativando Modo Simulação.");
      success = false;
    }

    if (!success) {
      isSimulationState = true;
      console.log("🛠️ [MODO SIMULAÇÃO] Ativado para testes de interface.");
      return true; // Retornamos true para destravar a interface do usuário
    }

    isSimulationState = false;
    return success;
  },

  fetchSteps: async (): Promise<number> => {
    if (isSimulationState) return Math.floor(4000 + Math.random() * 1000);
    if (Platform.OS === "android") {
      return fetchHealthConnectSteps();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitSteps();
    }
    return 0;
  },

  fetchHeartRate: async (): Promise<number> => {
    if (isSimulationState) return Math.floor(70 + Math.random() * 15);
    if (Platform.OS === "android") {
      return fetchHealthConnectHeartRate();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitHeartRate();
    }
    return 0;
  },

  fetchCalories: async (): Promise<number> => {
    if (isSimulationState) return Math.floor(300 + Math.random() * 50);
    if (Platform.OS === "android") {
      return fetchHealthConnectCalories();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitCalories();
    }
    return 0;
  },

  subscribeSteps: (callback: (steps: number) => void): (() => void) => {
    const interval = setInterval(async () => {
      const steps = await NativeHealthManager.fetchSteps();
      callback(steps);
    }, 5000);
    return () => clearInterval(interval);
  },

  subscribeHeartRate: (callback: (bpm: number) => void): (() => void) => {
    const interval = setInterval(async () => {
      const bpm = await NativeHealthManager.fetchHeartRate();
      if (bpm > 0) callback(bpm);
    }, 3000);
    return () => clearInterval(interval);
  },

  fetchPressure: async (): Promise<number | null> => {
    if (isSimulationState) return Math.floor(110 + Math.random() * 20);
    return null;
  },

  fetchOxygen: async (): Promise<number | null> => {
    if (isSimulationState) return Math.floor(95 + Math.random() * 5);
    if (Platform.OS === "android") {
      return fetchHealthConnectOxygen();
    }
    return null;
  },
};
