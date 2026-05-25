import { Pedometer } from "expo-sensors";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NATIVE_STEPS_KEY = "@MOVT:native_steps_today";

export const nativeStepService = {
  isAvailable: async (): Promise<boolean> => {
    try {
      const result = await Pedometer.isAvailableAsync();
      return result;
    } catch (e) {
      return false;
    }
  },

  getStepsToday: async (): Promise<number> => {
    try {
      if (Platform.OS === "android") {
        // ExponentPedometer.getStepCountAsync is not supported on Android.
        // Steps are fetched via Health Connect on Android.
        return 0;
      }

      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) return 0;

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      if (result && result.steps !== undefined) {
        // Salva no cache local para redundância
        await AsyncStorage.setItem(
          NATIVE_STEPS_KEY,
          JSON.stringify({
            steps: result.steps,
            date: new Date().toDateString(),
          })
        );
        return result.steps;
      }

      // Fallback para cache se a API falhar mas o hardware existir
      const cached = await AsyncStorage.getItem(NATIVE_STEPS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === new Date().toDateString()) {
          return parsed.steps;
        }
      }

      return 0;
    } catch (error) {
      console.error("[NativeSteps] Erro ao buscar passos:", error);
      return 0;
    }
  },

  startStepListener: (callback: (steps: number) => void) => {
    if (Platform.OS !== "android") return null;

    return Pedometer.watchStepCount((result) => {
      callback(result.steps);
    });
  },
};
