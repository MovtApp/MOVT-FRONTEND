import { Platform } from "react-native";
import {
  ensureGoogleFitPermissions,
  fetchTodayStepCount,
  subscribeToStepUpdates,
} from "./googleFitService";
import {
  ensureHealthKitPermissions,
  fetchHealthKitSteps,
  fetchHealthKitHeartRate,
} from "./appleHealthKitService";

export interface NativeHealthData {
  steps: number;
  heartRate: number;
}

export const NativeHealthManager = {
  authorize: async (): Promise<boolean> => {
    let success = false;
    if (Platform.OS === "android") {
      success = await ensureGoogleFitPermissions();
    } else if (Platform.OS === "ios") {
      success = await ensureHealthKitPermissions();
    }

    if (!success) {
      console.log("ℹ️ Saúde Nativa: Módulos indisponíveis (Expo Go/Emulador) ou permissão negada.");
    }
    return success;
  },

  fetchSteps: async (): Promise<number> => {
    if (Platform.OS === "android") {
      return fetchTodayStepCount();
    } else if (Platform.OS === "ios") {
      return fetchHealthKitSteps();
    }
    return 0;
  },

  fetchHeartRate: async (): Promise<number> => {
    if (Platform.OS === "ios") {
      return fetchHealthKitHeartRate();
    }
    // Android heart rate is typically handled via Wear OS service in this project
    return 0;
  },

  subscribeSteps: (callback: (steps: number) => void): (() => void) => {
    if (Platform.OS === "android") {
      return subscribeToStepUpdates(callback);
    } else if (Platform.OS === "ios") {
      // For iOS we typically use polling since HealthKit observer is more complex
      const interval = setInterval(async () => {
        const steps = await fetchHealthKitSteps();
        callback(steps);
      }, 5000);
      return () => clearInterval(interval);
    }
    return () => { };
  },
};
