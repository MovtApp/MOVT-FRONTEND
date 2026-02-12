import { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LatLng, Region } from "react-native-maps";
import {
  ensureGoogleFitPermissions,
  fetchTodayStepCount,
  subscribeToStepUpdates,
} from "../services/googleFitService";
import {
  getLatestWearOsHealthDataFromAllDevices,
  pollWearOsHealthData,
  checkWearOsDeviceRegistered,
} from "../services/wearOsHealthService";
import { getTodayKey } from "../utils/formatters";

const STEPS_INACTIVITY_TIMEOUT = 6000;
const DEFAULT_STEPS_GOAL = 10000;

export const useHealthTracking = (userId: string | undefined) => {
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
      const key = getTodayKey("calories");
      await AsyncStorage.setItem(key, JSON.stringify({ calories: roundedCalories }));
    } catch (error) {
      console.error("Erro ao calcular/salvar calorias:", error);
    }
  }, [stepsToday, heartRate, trainingTime]);

  useEffect(() => {
    calculateAndSaveCalories();
  }, [stepsToday, heartRate, trainingTime, calculateAndSaveCalories]);

  // Load static daily data
  const loadDailyData = useCallback(async () => {
    try {
      const waterKey = getTodayKey("water");
      const calKey = getTodayKey("calories");
      const sleepKey = getTodayKey("sleep");

      const [waterRaw, calRaw, sleepRaw] = await Promise.all([
        AsyncStorage.getItem(waterKey),
        AsyncStorage.getItem(calKey),
        AsyncStorage.getItem(sleepKey),
      ]);

      if (waterRaw) {
        const parsed = JSON.parse(waterRaw);
        setWaterConsumedMl(parsed.consumedMl || 0);
      }
      if (calRaw) {
        const parsed = JSON.parse(calRaw);
        setDailyCalories(parsed.calories || 0);
      }
      if (sleepRaw) {
        const parsed = JSON.parse(sleepRaw);
        setSleepHours(parsed.hours || 0);
        setSleepMinutes(parsed.minutes || 0);
      }
    } catch (e) {
      console.error("Error loading daily health data:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [loadDailyData])
  );

  // Training Timer Logic
  useEffect(() => {
    if (isWalking) {
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
  }, [isWalking]);

  // Wear OS Verification
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const verifyWearDevice = async () => {
        if (!userId) {
          setHasWearOsDevice(false);
          return;
        }
        const parsedId = parseInt(userId, 10);
        if (isNaN(parsedId)) {
          setHasWearOsDevice(false);
          return;
        }
        try {
          const device = await checkWearOsDeviceRegistered(parsedId);
          if (isActive) setHasWearOsDevice(Boolean(device));
        } catch {
          if (isActive) setHasWearOsDevice(false);
        }
      };
      verifyWearDevice();
      return () => {
        isActive = false;
      };
    }, [userId])
  );

  // Wear OS Real-time Polling
  useFocusEffect(
    useCallback(() => {
      if (!userId || hasWearOsDevice !== true) {
        setIsWearOsConnected(false);
        setHeartRate(null);
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
      let isMounted = true;
      let unsubscribeSteps: (() => void) | null = null;
      const start = async () => {
        setStepsLoading(true);
        const authorized = await ensureGoogleFitPermissions();
        if (!authorized) {
          if (isMounted) setStepsLoading(false);
          return;
        }
        try {
          const initialSteps = await fetchTodayStepCount();
          if (isMounted) {
            lastStepCountRef.current = initialSteps;
            setStepsToday(initialSteps);
          }
        } finally {
          if (isMounted) setStepsLoading(false);
        }
        unsubscribeSteps = subscribeToStepUpdates((value) => {
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
  };
};
