import {
  fetchHealthConnectSteps,
  fetchHealthConnectCalories,
  fetchHealthConnectHeartRate,
  fetchHealthConnectOxygen,
  fetchHealthConnectSleep,
  fetchHealthConnectDetailedSleep,
  requestHealthConnectPermissions,
} from "./healthConnectService";
import { nativeStepService } from "./nativeStepService";
import { Platform } from "react-native";

export const unifiedHealthService = {
  getSteps: async (): Promise<number> => {
    try {
      // Tenta Health Connect primeiro
      const hcSteps = await fetchHealthConnectSteps();
      if (hcSteps > 0) return hcSteps;

      // Se falhar ou for 0, tenta o sensor nativo
      const nativeSteps = await nativeStepService.getStepsToday();
      return nativeSteps;
    } catch (error) {
      console.error("[UnifiedHealth] Erro ao buscar passos:", error);
      return 0;
    }
  },

  getCalories: async (weightKg: number = 70): Promise<number> => {
    try {
      const hcCalories = await fetchHealthConnectCalories();
      if (hcCalories > 0) return hcCalories;

      // Cálculo fallback baseado em passos (METs aproximado)
      // 1000 passos ~= 40-50 kcal para um adulto médio
      const steps = await nativeStepService.getStepsToday();
      const estimatedCalories = (steps / 1000) * 45 * (weightKg / 70);
      return Math.round(estimatedCalories);
    } catch (error) {
      return 0;
    }
  },

  getHeartRate: async (): Promise<number> => {
    return await fetchHealthConnectHeartRate();
  },

  getOxygen: async (): Promise<number> => {
    return await fetchHealthConnectOxygen();
  },

  getSleep: async (): Promise<number> => {
    return await fetchHealthConnectSleep();
  },

  getDetailedSleep: async () => {
    return await fetchHealthConnectDetailedSleep();
  },

  requestAllPermissions: async (): Promise<boolean> => {
    if (Platform.OS !== "android") return false;

    // Solicita ambas as permissões
    const hcResult = await requestHealthConnectPermissions();

    // A permissão de pedômetro do expo-sensors é solicitada automaticamente
    // quando usamos as APIs, mas podemos garantir aqui se necessário.

    return hcResult;
  },
};
