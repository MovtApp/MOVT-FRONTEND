import { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LatLng, Region } from "@components/MapComponent";
import {
  getLatestWearOsHealthDataFromAllDevices,
  pollWearOsHealthData,
  checkWearOsDeviceRegistered,
} from "../services/wearOsHealthService";
import { NativeHealthManager } from "../services/nativeHealthManager";
import { getTodayKey } from "../utils/formatters";
import { Platform } from "react-native";

const STEPS_INACTIVITY_TIMEOUT = 6000;
const DEFAULT_STEPS_GOAL = 10000;

export const useHealthTracking = (userId: string | undefined, targetDate?: Date) => {
  const isToday = !targetDate || targetDate.toDateString() === new Date().toDateString();
  // Wear OS State
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isWearOsConnected, setIsWearOsConnected] = useState(false);
  const [hasWearOsDevice, setHasWearOsDevice] = useState<boolean | null>(null);

  // Steps State
  const [stepsToday, setStepsToday] = useState<number>(0);
  const [stepsLoading, setStepsLoading] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const lastStepCountRef = useRef<number>(0);
  const stepsInactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsGoal = DEFAULT_STEPS_GOAL;

  // Training Time State
  const [trainingTime, setTrainingTime] = useState<number>(0);
  const trainingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycling State
  const [cyclingRoute, setCyclingRoute] = useState<LatLng[]>([]);
  const [cyclingRegion, setCyclingRegion] = useState<Region | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const cyclingWatcherRef = useRef<Location.LocationSubscription | null>(null);

  // Calories & Sleep & Water (Fetched from storage)
  const [dailyCalories, setDailyCalories] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<number>(0);
  const [sleepMinutes, setSleepMinutes] = useState<number>(0);
  const [waterConsumedMl, setWaterConsumedMl] = useState<number>(0);

  const scheduleWalkingTimeout = useCallback(() => {
    if (stepsInactivityTimeoutRef.current) {
      clearTimeout(stepsInactivityTimeoutRef.current);
    }
    stepsInactivityTimeoutRef.current = setTimeout(() => {
      setIsWalking(false);
      stepsInactivityTimeoutRef.current = null;
    }, STEPS_INACTIVITY_TIMEOUT);
  }, []);

  // Calculation for calories
  const calculateAndSaveCalories = useCallback(async () => {
    if (!isToday) return; // Never recalculate for past days
    try {
      let calories = 0;
      calories += stepsToday * 0.05;
      if (heartRate && heartRate > 60) {
        const excessBpm = heartRate - 60;
        calories += excessBpm * 0.15;
      }
      if (trainingTime > 0) {
        const minutesOfTraining = trainingTime / 60;
        calories += minutesOfTraining * 5;
      }
      const roundedCalories = Math.round(calories * 100) / 100;
      setDailyCalories(roundedCalories);

      const key = getTodayKey("calories", targetDate);
      await AsyncStorage.setItem(key, JSON.stringify({ calories: roundedCalories }));
    } catch (error) {
      console.error("Erro ao calcular/salvar calorias:", error);
    }
  }, [stepsToday, heartRate, trainingTime, isToday, targetDate]);

  useEffect(() => {
    calculateAndSaveCalories();
  }, [stepsToday, heartRate, trainingTime, calculateAndSaveCalories]);

  // Load static daily data
  const loadDailyData = useCallback(async () => {
    try {
      const waterKey = getTodayKey("water", targetDate);
      const calKey = getTodayKey("calories", targetDate);
      const sleepKey = getTodayKey("sleep", targetDate);
      const stepsKey = getTodayKey("steps", targetDate);
      const trainingKey = getTodayKey("training", targetDate);
      const hrKey = getTodayKey("heartRate", targetDate);

      const [waterRaw, calRaw, sleepRaw, stepsRaw, trainingRaw, hrRaw] = await Promise.all([
        AsyncStorage.getItem(waterKey),
        AsyncStorage.getItem(calKey),
        AsyncStorage.getItem(sleepKey),
        AsyncStorage.getItem(stepsKey),
        AsyncStorage.getItem(trainingKey),
        AsyncStorage.getItem(hrKey),
      ]);

      if (waterRaw) {
        const parsed = JSON.parse(waterRaw);
        setWaterConsumedMl(parsed.consumedMl || 0);
      } else {
        setWaterConsumedMl(0);
      }

      if (calRaw) {
        const parsed = JSON.parse(calRaw);
        setDailyCalories(parsed.calories || 0);
      } else {
        setDailyCalories(0);
      }

      if (sleepRaw) {
        const parsed = JSON.parse(sleepRaw);
        setSleepHours(parsed.hours || 0);
        setSleepMinutes(parsed.minutes || 0);
      } else {
        setSleepHours(0);
        setSleepMinutes(0);
      }

      if (!isToday) {
        if (stepsRaw) {
          const parsed = JSON.parse(stepsRaw);
          setStepsToday(parsed.steps || 0);
        } else {
          setStepsToday(0);
        }

        if (trainingRaw) {
          const parsed = JSON.parse(trainingRaw);
          setTrainingTime(parsed.duration || 0);
        } else {
          setTrainingTime(0);
        }

        if (hrRaw) {
          const parsed = JSON.parse(hrRaw);
          setHeartRate(parsed.heartRate || 0);
        } else {
          setHeartRate(0);
        }
      }
    } catch (e) {
      console.error("Error loading daily health data:", e);
    }
  }, [targetDate, isToday]);

  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [loadDailyData])
  );

  // Training Timer Logic
  useEffect(() => {
    if (isWalking && isToday) {
      if (!trainingIntervalRef.current) {
        trainingIntervalRef.current = setInterval(() => {
          setTrainingTime((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (trainingIntervalRef.current) {
        clearInterval(trainingIntervalRef.current);
        trainingIntervalRef.current = null;
      }
    }
    return () => {
      if (trainingIntervalRef.current) {
        clearInterval(trainingIntervalRef.current);
        trainingIntervalRef.current = null;
      }
    };
  }, [isWalking, isToday]);

  // Native Health Verification (Google Fit/HealthKit)
  useFocusEffect(
    useCallback(() => {
      NativeHealthManager.authorize();
    }, [])
  );

  // Wear OS Real-time Polling
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "ios") {
        // No iOS, podemos tentar buscar dados do HealthKit se não houver WearOS
        if (!heartRate) {
          NativeHealthManager.fetchHeartRate().then((rate) => {
            if (rate > 0) setHeartRate(rate);
          });
        }
      }

      if (!userId || hasWearOsDevice !== true || !isToday) {
        setIsWearOsConnected(false);
        return;
      }
      const uId = parseInt(userId, 10);
      if (isNaN(uId)) return;

      let isMounted = true;
      let unsubscribe: (() => void) | undefined;

      const loadWearOsData = async () => {
        try {
          const data = await getLatestWearOsHealthDataFromAllDevices(uId);
          if (isMounted) {
            if (data && data.heartRate) {
              setHeartRate(data.heartRate);
              setIsWearOsConnected(true);
            } else {
              setIsWearOsConnected(false);
            }
          }
          unsubscribe = pollWearOsHealthData(uId, 5000, (newData) => {
            if (isMounted && newData.heartRate) {
              setHeartRate(newData.heartRate);
              setIsWearOsConnected(true);
            }
          });
        } catch (error) {
          if (isMounted) setIsWearOsConnected(false);
        }
      };
      loadWearOsData();
      return () => {
        isMounted = false;
        if (unsubscribe) unsubscribe();
      };
    }, [userId, hasWearOsDevice])
  );

  // Steps Tracking
  useFocusEffect(
    useCallback(() => {
      if (!isToday) return;

      let isMounted = true;
      let unsubscribeSteps: (() => void) | null = null;
      const start = async () => {
        setStepsLoading(true);
        let authorized = false;
        try {
          authorized = await NativeHealthManager.authorize();
        } catch (err) {
          console.warn("Plataforma de saúde não disponível ou permissão negada:", err);
        }

        if (!authorized) {
          if (isMounted) setStepsLoading(false);
          return;
        }
        try {
          const initialSteps = await NativeHealthManager.fetchSteps();
          if (isMounted) {
            lastStepCountRef.current = initialSteps;
            setStepsToday(initialSteps);
          }
        } finally {
          if (isMounted) setStepsLoading(false);
        }
        unsubscribeSteps = NativeHealthManager.subscribeSteps((value) => {
          if (!isMounted) return;
          const numericValue = Number(value);
          if (!Number.isFinite(numericValue)) return;
          if (numericValue > lastStepCountRef.current) {
            setIsWalking(true);
            scheduleWalkingTimeout();
          }
          lastStepCountRef.current = numericValue;
          setStepsToday(numericValue);
        });
      };
      start();
      return () => {
        isMounted = false;
        if (unsubscribeSteps) unsubscribeSteps();
        if (stepsInactivityTimeoutRef.current) clearTimeout(stepsInactivityTimeoutRef.current);
        setIsWalking(false);
      };
    }, [scheduleWalkingTimeout])
  );

  // Cycling Tracking
  useFocusEffect(
    useCallback(() => {
      if (!isToday) return;

      let isActive = true;
      const startCyclingTracking = async () => {
        try {
          if (cyclingWatcherRef.current) cyclingWatcherRef.current.remove();
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (!isActive || status !== Location.PermissionStatus.GRANTED) {
            setLocationError("Permissão de localização negada.");
            return;
          }
          const initialPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!isActive) return;
          const initialPoint = {
            latitude: initialPosition.coords.latitude,
            longitude: initialPosition.coords.longitude,
          };
          setCyclingRoute([initialPoint]);
          setCyclingRegion({ ...initialPoint, latitudeDelta: 0.005, longitudeDelta: 0.005 });
          setLocationError(null);

          cyclingWatcherRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 5000,
              distanceInterval: 5,
            },
            (update) => {
              if (!isActive) return;
              const newPoint = {
                latitude: update.coords.latitude,
                longitude: update.coords.longitude,
              };
              setCyclingRoute((prev) => {
                const next = [...prev, newPoint];
                return next.length > 60 ? next.slice(next.length - 60) : next;
              });
              setCyclingRegion((prev) =>
                prev
                  ? { ...prev, ...newPoint }
                  : { ...newPoint, latitudeDelta: 0.005, longitudeDelta: 0.005 }
              );
            }
          );
        } catch {
          if (isActive) setLocationError("Não foi possível iniciar o rastreamento de ciclismo.");
        }
      };
      startCyclingTracking();
      return () => {
        isActive = false;
        if (cyclingWatcherRef.current) cyclingWatcherRef.current.remove();
        setCyclingRoute([]);
        setCyclingRegion(null);
      };
    }, [])
  );

  const getHistoricalStats = useCallback(
    async (timeframe: string) => {
      let daysToFetch = 1;
      if (timeframe === "1s") daysToFetch = 7;
      else if (timeframe === "1m") daysToFetch = 30;
      else if (timeframe === "1a") daysToFetch = 365;
      else if (timeframe === "Tudo") daysToFetch = 1095; // 3 anos

      const end = targetDate || new Date();
      const prefixes = ["water", "calories", "sleep", "steps", "training", "heartRate"];
      const allKeys: string[] = [];
      const dateList: Date[] = [];

      for (let i = 0; i < daysToFetch; i++) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        dateList.push(d);

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        prefixes.forEach((p) => allKeys.push(`${p}:${dateStr}`));
      }

      const results = await AsyncStorage.multiGet(allKeys);
      const dataMap: { [key: string]: any } = {};
      results.forEach(([key, val]) => {
        if (val) dataMap[key] = JSON.parse(val);
      });

      // Agregação
      const stats = {
        water: 0,
        calories: 0,
        sleep: 0,
        steps: 0,
        training: 0,
        heartRate: 0,
        hrCount: 0,
        daysWithData: 0,
        dailyScores: [] as number[],
      };

      for (let i = 0; i < daysToFetch; i++) {
        const d = dateList[i];
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const dayWater = dataMap[`water:${dateStr}`]?.consumedMl || 0;
        const dayCal = dataMap[`calories:${dateStr}`]?.calories || 0;
        const daySleep =
          (dataMap[`sleep:${dateStr}`]?.hours || 0) * 60 +
          (dataMap[`sleep:${dateStr}`]?.minutes || 0);
        const daySteps = dataMap[`steps:${dateStr}`]?.steps || 0;
        const dayTrain = dataMap[`training:${dateStr}`]?.duration || 0;
        const dayHR = dataMap[`heartRate:${dateStr}`]?.heartRate || 0;

        stats.water += dayWater;
        stats.calories += dayCal;
        stats.sleep += daySleep;
        stats.steps += daySteps;
        stats.training += dayTrain;
        if (dayHR > 0) {
          stats.heartRate += dayHR;
          stats.hrCount++;
        }

        // Pontuação diária simples para o gráfico de linha (0-100)
        let dayScore = 0;
        if (daySteps > 0 || dayWater > 0 || daySleep > 0) {
          dayScore = Math.min(
            100,
            (daySteps / 10000) * 40 + (dayWater / 2000) * 30 + (daySleep / 480) * 30
          );
        }
        stats.dailyScores.unshift(Math.round(dayScore));
      }

      return {
        totalWater: stats.water,
        totalCalories: stats.calories,
        avgSleep: stats.hrCount > 0 ? stats.sleep / daysToFetch : stats.sleep, // min/day
        totalSteps: stats.steps,
        totalTraining: stats.training,
        avgHeartRate: stats.hrCount > 0 ? stats.heartRate / stats.hrCount : 0,
        dailyScores: stats.dailyScores,
        // Radar Mapping (0-100)
        radar: {
          forca: Math.min(100, (stats.steps / (daysToFetch * 8000)) * 100),
          agilidade: Math.min(100, (stats.training / (daysToFetch * 30 * 60)) * 100), // 30min/dia meta
          resistencia: Math.min(100, (stats.sleep / (daysToFetch * 420)) * 100), // 7h/dia meta
        },
      };
    },
    [targetDate]
  );

  return {
    heartRate,
    isWearOsConnected,
    hasWearOsDevice,
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
    waterConsumedMl,
    loadDailyData,
    getHistoricalStats,
    isToday,
  };
};
