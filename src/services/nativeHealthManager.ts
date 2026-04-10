import { Platform } from "react-native";
import {
  ensureHealthConnectPermissions,
  fetchHealthConnectSteps,
  fetchHealthConnectHeartRate,
  fetchHealthConnectCalories,
  fetchHealthConnectOxygen,
  fetchHealthConnectSleep,
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

export const NativeHealthManager = {
  authorize: async (): Promise<boolean> => {
    let success = false;
    if (Platform.OS === "android") {
      success = await ensureHealthConnectPermissions();
    } else if (Platform.OS === "ios") {
      success = await ensureHealthKitPermissions();
    }

    if (!success) {
      console.log("ℹ️ Saúde Nativa: Módulos indisponíveis ou permissão negada.");
    }
    return success;
  },

  fetchSteps: async (): Promise<number> => {
    if (Platform.OS === "android") {
      return fetchHealthConnectSteps();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitSteps();
    }
    return 0;
  },

  fetchHeartRate: async (): Promise<number> => {
    if (Platform.OS === "android") {
      return fetchHealthConnectHeartRate();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitHeartRate();
    }
    return 0;
  },

  fetchCalories: async (): Promise<number> => {
    if (Platform.OS === "android") {
      return fetchHealthConnectCalories();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitCalories();
    }
    return 0;
  },

  subscribeSteps: (callback: (steps: number) => void): (() => void) => {
    // For both platforms we use polling since direct step observing can be buggy or unsupported
    const interval = setInterval(async () => {
      const steps = await NativeHealthManager.fetchSteps();
      callback(steps);
    }, 5000);
    return () => clearInterval(interval);
  },

  subscribeHeartRate: (callback: (bpm: number) => void): (() => void) => {
    // We use polling for Health Connect (Android) and AppleHealthKit (iOS) natively
    const interval = setInterval(async () => {
      const bpm = await NativeHealthManager.fetchHeartRate();
      if (bpm > 0) callback(bpm);
    }, 3000);
    return () => clearInterval(interval);
  },

  fetchPressure: async (): Promise<number | null> => {
    // Apenas Health Connect tem implementado
    return null; // Implementação base, será expandido
  },

  fetchOxygen: async (): Promise<number | null> => {
    if (Platform.OS === "android") {
      return fetchHealthConnectOxygen();
    }
    return null;
  },
};
