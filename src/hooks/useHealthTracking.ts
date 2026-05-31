import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDeferredFocusEffect } from "./useDeferredFocusEffect";
import { api } from "../services/api";
import { useAuth } from "./useAuth";
import {
  getLatestWearOsHealthData,
  pollWearOsHealthData,
  checkWearOsDeviceRegistered,
} from "../services/wearOsHealthService";
import { isHealthConnectReady } from "../services/healthConnectService";
import { NativeHealthManager } from "../services/nativeHealthManager";
import { getTodayKey } from "../utils/formatters";
import { Platform } from "react-native";
import * as Location from "expo-location";

// Module-level caches to survive across mounts and renders
const healthDataCache: Record<
  string,
  {
    stepsToday: number;
    dailyCalories: number;
    sleepHours: number;
    sleepMinutes: number;
    waterConsumedMl: number;
    heartRate: number;
    oxygen: number;
  }
> = {};

const statsCache: Record<string, any> = {};

/**
 * Pré-carrega o resumo de saúde de hoje no cache de módulo (best-effort, silencioso).
 * Chamado no login para que a tela de Dados já renderize com os números prontos,
 * sem fetch no mount nem travadinha ao acessá-la.
 */
export async function preloadTodayHealth(): Promise<void> {
  try {
    const now = new Date();
    const dateKey = now.toDateString();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    const response = await api.get("/health/daily-summary", { params: { date: dateStr } });
    if (response.data && response.data.success) {
      const remote = response.data.data || {};
      const existing = healthDataCache[dateKey] || {
        stepsToday: 0,
        dailyCalories: 0,
        sleepHours: 0,
        sleepMinutes: 0,
        waterConsumedMl: 0,
        heartRate: 0,
        oxygen: 0,
      };
      healthDataCache[dateKey] = {
        ...existing,
        stepsToday: remote.steps ?? existing.stepsToday,
        dailyCalories: remote.calories ?? existing.dailyCalories,
        sleepHours:
          remote.sleep_hours !== undefined ? Math.floor(remote.sleep_hours) : existing.sleepHours,
        sleepMinutes:
          remote.sleep_hours !== undefined
            ? Math.round((remote.sleep_hours % 1) * 60)
            : existing.sleepMinutes,
        waterConsumedMl: remote.water_intake ?? existing.waterConsumedMl,
      };
    }
  } catch {
    // best-effort: se falhar, a tela carrega normalmente no mount
  }
}

export const useHealthTracking = (targetDate?: Date) => {
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : null;

  const isToday = !targetDate || targetDate.toDateString() === new Date().toDateString();
  const dateKey = targetDate ? targetDate.toDateString() : new Date().toDateString();

  const cached = healthDataCache[dateKey] || null;

  // Metrics state initialized from cache if available to prevent any flashing
  const [steps, setSteps] = useState(0);
  const [stepsToday, setStepsToday] = useState(cached ? cached.stepsToday : 0);
  const [dailyCalories, setDailyCalories] = useState(cached ? cached.dailyCalories : 0);
  const [sleepHours, setSleepHours] = useState(cached ? cached.sleepHours : 0);
  const [sleepMinutes, setSleepMinutes] = useState(cached ? cached.sleepMinutes : 0);
  const [waterIntake, setWaterIntake] = useState(cached ? cached.waterConsumedMl : 0);
  const [heartRate, setHeartRate] = useState(cached ? cached.heartRate : 0);
  const [oxygen, setOxygen] = useState(cached ? cached.oxygen : 0);
  const [trainingActive, setTrainingActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Loading states are false if cached data exists, preventing spinners
  const [stepsLoading, setStepsLoading] = useState(!cached);
  const [caloriesLoading, setCaloriesLoading] = useState(!cached);
  const [sleepLoading, setSleepLoading] = useState(!cached);
  const [waterLoading, setWaterLoading] = useState(!cached);
  const [hrLoading, setHRLoading] = useState(!cached);

  // Refs
  const lastStepCountRef = useRef(0);
  const pollingIntervalRef = useRef<any>(null);

  // keys
  const waterKey = `@MOVT:water_intake:${dateKey}`;
  const calKey = `@MOVT:daily_calories:${dateKey}`;
  const sleepKey = `@MOVT:sleep_data:${dateKey}`;
  const stepsKey = `@MOVT:steps_data:${dateKey}`;
  const trainingKey = `@MOVT:training_active:${dateKey}`;
  const hrKey = `@MOVT:heart_rate:${dateKey}`;

  // Initial Data Load
  const loadInitialData = useCallback(async () => {
    try {
      const hasCached = !!healthDataCache[dateKey];
      setStepsLoading(!hasCached);
      setCaloriesLoading(!hasCached);
      setSleepLoading(!hasCached);
      setWaterLoading(!hasCached);
      setHRLoading(!hasCached);

      const [waterRaw, calRaw, sleepRaw, stepsRaw, trainingRaw, hrRaw] = await Promise.all([
        AsyncStorage.getItem(waterKey),
        AsyncStorage.getItem(calKey),
        AsyncStorage.getItem(sleepKey),
        AsyncStorage.getItem(stepsKey),
        AsyncStorage.getItem(trainingKey),
        AsyncStorage.getItem(hrKey),
      ]);

      let finalSteps = cached ? cached.stepsToday : 0;
      let finalCalories = cached ? cached.dailyCalories : 0;
      let finalSleepHours = cached ? cached.sleepHours : 0;
      let finalSleepMinutes = cached ? cached.sleepMinutes : 0;
      let finalWater = cached ? cached.waterConsumedMl : 0;
      let finalHR = cached ? cached.heartRate : 0;
      let finalOxygen = cached ? cached.oxygen : 0;

      if (!cached) {
        if (waterRaw) finalWater = parseInt(waterRaw, 10);
        if (calRaw) finalCalories = parseInt(calRaw, 10);
        if (sleepRaw) {
          const s = parseFloat(sleepRaw);
          finalSleepHours = Math.floor(s);
          finalSleepMinutes = Math.round((s % 1) * 60);
        }
        if (stepsRaw) finalSteps = parseInt(stepsRaw, 10);
        if (hrRaw) finalHR = parseInt(hrRaw, 10);
      }

      // Para HOJE: sincroniza HC primeiro para garantir que os passos reais apareçam
      if (isToday) {
        try {
          // Garante autorização automática silenciosa
          await NativeHealthManager.authorize();

          // Paraleliza as leituras de bridge (antes eram 5 awaits sequenciais)
          // para reduzir a congestão da JS/UI thread e o tempo total de sync.
          const [hcSteps, hcSleep, hcCalories, hcHR, hcOxygen] = await Promise.all([
            NativeHealthManager.fetchSteps(),
            NativeHealthManager.fetchSleep(),
            NativeHealthManager.fetchCalories(),
            NativeHealthManager.fetchHeartRate(),
            NativeHealthManager.fetchOxygen(),
          ]);

          console.log("[HealthConnect] Dados sincronizados no foco.");

          if (hcSteps > 0) finalSteps = hcSteps;
          if (hcSleep > 0) {
            finalSleepHours = Math.floor(hcSleep);
            finalSleepMinutes = Math.round((hcSleep % 1) * 60);
          }
          if (hcCalories > 0) finalCalories = hcCalories;
          if (hcHR > 0) finalHR = hcHR;
          if (hcOxygen > 0) finalOxygen = hcOxygen;
        } catch (hcErr) {
          console.warn("[useHealthTracking] Falha na sincronização inicial HC:", hcErr);
        }
      }

      // Tenta buscar do backend para todas as métricas (Garante reset diário e histórico)
      try {
        const dateStr = targetDate
          ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`
          : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

        console.log(`[HISTORY] Buscando dados consolidados para: ${dateStr}`);
        const response = await api.get("/health/daily-summary", { params: { date: dateStr } });

        if (response.data && response.data.success) {
          const remote = response.data.data;
          if (remote.steps !== undefined) finalSteps = remote.steps;
          if (remote.calories !== undefined) finalCalories = remote.calories;
          if (remote.sleep_hours !== undefined) {
            finalSleepHours = Math.floor(remote.sleep_hours);
            finalSleepMinutes = Math.round((remote.sleep_hours % 1) * 60);
          }
          if (remote.water_intake !== undefined) finalWater = remote.water_intake;
        }
      } catch (err) {
        console.log("[HISTORY] Sem dados no backend para esta data, usando cache local.");
      }

      // Batch state updates to avoid multi-render layouts shifts
      setStepsToday(finalSteps);
      setDailyCalories(finalCalories);
      setSleepHours(finalSleepHours);
      setSleepMinutes(finalSleepMinutes);
      setWaterIntake(finalWater);
      setHeartRate(finalHR);
      setOxygen(finalOxygen);
      setTrainingActive(trainingRaw === "true");

      // Save to static memory cache
      healthDataCache[dateKey] = {
        stepsToday: finalSteps,
        dailyCalories: finalCalories,
        sleepHours: finalSleepHours,
        sleepMinutes: finalSleepMinutes,
        waterConsumedMl: finalWater,
        heartRate: finalHR,
        oxygen: finalOxygen,
      };
    } catch (error) {
      console.error("Error loading health data:", error);
    } finally {
      setStepsLoading(false);
      setCaloriesLoading(false);
      setSleepLoading(false);
      setWaterLoading(false);
      setHRLoading(false);
    }
  }, [
    isToday,
    waterKey,
    calKey,
    sleepKey,
    stepsKey,
    trainingKey,
    hrKey,
    targetDate,
    dateKey,
    cached,
  ]);

  // Sincronização Autônoma Periódica (Foco Ativo).
  // Adiada para depois da transição de navegação (InteractionManager) para não
  // travar a abertura da tela com as leituras nativas do Health Connect.
  useDeferredFocusEffect(() => {
    // Executa a carga/sincronização inicial assim que a navegação assenta
    loadInitialData();

    // Configura intervalo de sincronização silenciosa se for a data de hoje
    let intervalId: any = null;
    if (isToday) {
      console.log("[NHM] 🔄 Sincronização automática de saúde ativada (a cada 3min)");
      intervalId = setInterval(() => {
        loadInitialData();
      }, 180000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("[NHM] ⏸️ Sincronização automática de saúde pausada");
      }
    };
  }, [loadInitialData, isToday]);

  // Wear OS Polling (Background)
  useEffect(() => {
    if (!isToday || !userId) return;

    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const isRegistered = await checkWearOsDeviceRegistered(userId);
        if (isRegistered) {
          const data = await getLatestWearOsHealthData(userId);
          if (isMounted && data) {
            if (data.heartRate) {
              setHeartRate(data.heartRate);
              if (healthDataCache[dateKey]) healthDataCache[dateKey].heartRate = data.heartRate;
            }
            if (data.oxygen) {
              setOxygen(data.oxygen);
              if (healthDataCache[dateKey]) healthDataCache[dateKey].oxygen = data.oxygen;
            }
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.warn("Wear OS initial fetch error:", error);
      }
    };

    // Inicia polling real via service (alinhado ao intervalo de 3min)
    const stopPolling = pollWearOsHealthData(userId, 180000, (data) => {
      if (isMounted && data) {
        if (data.heartRate) {
          setHeartRate(data.heartRate);
          if (healthDataCache[dateKey]) healthDataCache[dateKey].heartRate = data.heartRate;
        }
        if (data.oxygen) {
          setOxygen(data.oxygen);
          if (healthDataCache[dateKey]) healthDataCache[dateKey].oxygen = data.oxygen;
        }
        setLastUpdate(new Date());
      }
    });

    fetchLatest();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [isToday, userId, dateKey]);

  const [isWearOsConnected, setIsWearOsConnected] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [stepsGoal] = useState(10000); // Meta padrão
  const [trainingTime] = useState(0); // Placeholder
  const [cyclingRoute, setCyclingRoute] = useState<any[]>([]);
  const [cyclingRegion, setCyclingRegion] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch current GPS location for the dashboard Map
  useEffect(() => {
    let isMounted = true;
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted) setLocationError("Permissão de localização negada");
          return;
        }

        // Get last known location first (lightning fast!)
        let loc = await Location.getLastKnownPositionAsync({});
        if (!loc) {
          // Fallback to current location (takes ~1-2 seconds)
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (isMounted && loc) {
          setCyclingRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          });
        }
      } catch (err: any) {
        console.warn("Erro ao obter localização no painel:", err);
        if (isMounted) setLocationError(err.message || "Erro de GPS");
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Wear OS Connectivity Check
  useEffect(() => {
    if (userId) {
      checkWearOsDeviceRegistered(userId).then((device) => setIsWearOsConnected(!!device));
    }
  }, [userId]);

  const addWater = useCallback(
    async (amount: number) => {
      const newAmount = waterIntake + amount;
      setWaterIntake(newAmount);
      await AsyncStorage.setItem(waterKey, newAmount.toString());

      if (healthDataCache[dateKey]) {
        healthDataCache[dateKey].waterConsumedMl = newAmount;
      }

      try {
        const dateStr = targetDate
          ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`
          : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

        await api.post("/health/water", { amount: newAmount, date: dateStr });
      } catch (e) {
        console.warn("Falha ao salvar água no servidor:", e);
      }
    },
    [waterIntake, waterKey, dateKey, targetDate]
  );

  const getHistoricalStats = useCallback(
    async (period: string) => {
      const cacheKey = `${period}:${userId}:${dateKey}`;
      if (statsCache[cacheKey]) {
        return statsCache[cacheKey];
      }
      try {
        const response = await api.get("/health/stats", { params: { period, userId } });
        statsCache[cacheKey] = response.data;
        return response.data;
      } catch (error) {
        console.error("Error fetching historical stats:", error);
        return { dailyScores: [], radar: { forca: 0, agilidade: 0, resistencia: 0 } };
      }
    },
    [userId, dateKey]
  );

  // Memoiza o objeto de retorno para que consumidores (DataScreen, HomeScreen)
  // não re-renderizem por nova referência quando nenhuma métrica relevante mudou.
  return useMemo(
    () => ({
      heartRate,
      isWearOsConnected,
      stepsToday,
      stepsLoading,
      isWalking,
      stepsGoal,
      trainingTime,
      cyclingRoute,
      cyclingRegion,
      locationError,
      dailyCalories,
      sleepHours,
      sleepMinutes,
      waterConsumedMl: waterIntake,
      getHistoricalStats,
      isToday,
      oxygen,
      trainingActive,
      lastUpdate,
      addWater,
      refresh: loadInitialData,
      authorize: NativeHealthManager.authorize,
    }),
    [
      heartRate,
      isWearOsConnected,
      stepsToday,
      stepsLoading,
      isWalking,
      stepsGoal,
      trainingTime,
      cyclingRoute,
      cyclingRegion,
      locationError,
      dailyCalories,
      sleepHours,
      sleepMinutes,
      waterIntake,
      getHistoricalStats,
      isToday,
      oxygen,
      trainingActive,
      lastUpdate,
      addWater,
      loadInitialData,
    ]
  );
};
