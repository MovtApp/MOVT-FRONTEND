import { Platform } from "react-native";
import { unifiedHealthService } from "./unifiedHealthService";
import {
  ensureHealthKitPermissions,
  fetchHealthKitSteps,
  fetchHealthKitHeartRate,
  fetchHealthKitCalories,
} from "./appleHealthKitService";
import { saveHealthMetricData } from "./caloriesService";

export const NativeHealthManager = {
  authorize: async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        return await unifiedHealthService.requestAllPermissions();
      } else if (Platform.OS === "ios") {
        return await ensureHealthKitPermissions();
      }
      return false;
    } catch (e) {
      console.warn("Authorization failed:", e);
      return false;
    }
  },

  fetchSteps: async (): Promise<number> => {
    let steps = 0;
    try {
      if (Platform.OS === "android") {
        steps = await unifiedHealthService.getSteps();
      } else if (Platform.OS === "ios") {
        steps = await fetchHealthKitSteps();
      }
    } catch (e) {
      console.warn("[NHM] fetchSteps falhou:", e);
    }

    if (steps > 0) {
      try {
        await saveHealthMetricData("steps", steps);
      } catch (e) {
        console.warn("Erro ao sincronizar passos com o backend:", e);
      }
    }
    return steps;
  },

  fetchHeartRate: async (): Promise<number> => {
    let bpm = 0;
    try {
      if (Platform.OS === "android") {
        bpm = await unifiedHealthService.getHeartRate();
      } else if (Platform.OS === "ios") {
        bpm = await fetchHealthKitHeartRate();
      }
    } catch (e) {
      console.warn("[NHM] fetchHeartRate falhou:", e);
    }
    return bpm;
  },

  fetchCalories: async (): Promise<number> => {
    let calories = 0;
    try {
      if (Platform.OS === "android") {
        calories = await unifiedHealthService.getCalories();
      } else if (Platform.OS === "ios") {
        calories = await fetchHealthKitCalories();
      }
    } catch (e) {
      console.warn("[NHM] fetchCalories falhou:", e);
    }

    if (calories > 0) {
      try {
        await saveHealthMetricData("calories", calories);
      } catch (e) {
        console.warn("Erro ao sincronizar calorias com o backend:", e);
      }
    }
    return calories;
  },

  fetchOxygen: async (): Promise<number> => {
    let oxygen = 0;
    try {
      if (Platform.OS === "android") {
        oxygen = await unifiedHealthService.getOxygen();
      }
    } catch (e) {
      console.warn("[NHM] fetchOxygen falhou:", e);
    }

    const rounded = Math.round(oxygen * 100) / 100;
    if (rounded > 0) {
      try {
        await saveHealthMetricData("oxygen", rounded);
      } catch (e) {
        console.warn("Erro ao sincronizar oxigênio com o backend:", e);
      }
    }
    return rounded;
  },

  fetchSleep: async (): Promise<number> => {
    let hours = 0;
    try {
      if (Platform.OS === "android") {
        hours = await unifiedHealthService.getSleep();
      }
    } catch (e) {
      console.warn("[NHM] fetchSleep falhou:", e);
    }

    if (hours > 0) {
      try {
        await saveHealthMetricData("sleep", hours);
        console.log(`[NHM] ✅ Sono salvo no backend: ${hours.toFixed(2)}h`);
      } catch (e) {
        console.warn("Erro ao sincronizar sono com o backend:", e);
      }
    }
    return hours;
  },

  fetchDetailedSleep: async (): Promise<any> => {
    try {
      if (Platform.OS === "android") {
        return await unifiedHealthService.getDetailedSleep();
      }
      return null;
    } catch (e) {
      console.warn("[NHM] fetchDetailedSleep falhou:", e);
      return null;
    }
  },

  subscribeSteps: (callback: (steps: number) => void): (() => void) => {
    const interval = setInterval(async () => {
      const steps = await NativeHealthManager.fetchSteps();
      callback(steps);
    }, 10000);
    return () => clearInterval(interval);
  },

  subscribeHeartRate: (callback: (bpm: number) => void): (() => void) => {
    const interval = setInterval(async () => {
      const bpm = await NativeHealthManager.fetchHeartRate();
      if (bpm > 0) callback(bpm);
    }, 5000);
    return () => clearInterval(interval);
  },

  isSimulation: () => {
    return false;
  },
};
