import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation, CompositeNavigationProp, useFocusEffect } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDrawerParamList, AppStackParamList } from "../../../@types/routes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../../components/Header";
import { Canvas, Path, vec } from "@shopify/react-native-skia";
import MapView, { LatLng, MapStyleElement, Polyline, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Bike, Footprints } from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  ensureGoogleFitPermissions,
  fetchTodayStepCount,
  subscribeToStepUpdates,
} from "../../../services/googleFitService";
import {
  getLatestWearOsHealthDataFromAllDevices,
  pollWearOsHealthData,
} from "../../../services/wearOsHealthService";
import { useAuth } from "../../../contexts/AuthContext";
import ECGDisplay from "../../../components/ECGDisplay";

const { width } = Dimensions.get("window");

const cyclingMapStyle: MapStyleElement[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f3f4f6" }],
  },
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#d1d5db" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e7eb" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }],
  },
];
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);
const STEPS_INACTIVITY_TIMEOUT = 6000;
const DEFAULT_STEPS_GOAL = 10000;

const getTodayKey = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `water:${yyyy}-${mm}-${dd}`;
};

// Componente isolado da onda para evitar re-render do DataScreen
const WaterWave: React.FC<{ progress: number; height?: number }> = React.memo(function WaterWave({
  progress,
  height = 60,
}) {
  const [phase, setPhase] = useState<number>(0);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height });

  const buildWavePath = useCallback(
    (w: number, h: number, phaseValue: number, amplitude: number, prog: number): string => {
      if (w <= 0 || h <= 0) return "";
      const baseY = h * (1 - Math.max(0, Math.min(1, prog)));
      const wavelength = Math.max(60, w / 1.5);
      const k = (2 * Math.PI) / wavelength;
      const step = Math.max(1, Math.floor(w / 120));
      let d = `M 0 ${h} L 0 ${baseY}`;
      for (let x = 0; x <= w; x += step) {
        const y = baseY - amplitude * Math.sin(k * x + phaseValue);
        d += ` L ${x} ${y}`;
      }
      d += ` L ${w} ${h} Z`;
      return d;
    },
    []
  );

  useEffect(() => {
    let rafId: number;
    let last = performance.now();
    const speed = 1.4; // rad/s (mais lento)
    const loop = (now: number) => {
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      setPhase((prev) => (prev + speed * dt) % (Math.PI * 2));
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <View
      style={{ position: "absolute", inset: 0 }}
      onLayout={(e) =>
        setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
      pointerEvents="none"
    >
      <Canvas style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
        <Path
          path={buildWavePath(size.width, size.height, phase, 11, progress)}
          color="#9ED0F5"
          style="fill"
        />
        <Path
          path={buildWavePath(
            size.width,
            size.height,
            phase + Math.PI / 2,
            8,
            Math.max(0, Math.min(1, progress * 0.98))
          )}
          color="#79BDEB"
          style="fill"
        />
      </Canvas>
    </View>
  );
});

const StepProgressRing: React.FC<{ progress: number; size?: number }> = ({
  progress,
  size = 78,
}) => {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="stepsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE0B2" />
          <Stop offset="100%" stopColor="#FF8C00" />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#FFE0B2"
        strokeWidth={10}
        fill="none"
      />
      <AnimatedSvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#stepsGradient)"
        strokeWidth={10}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const DataScreen: React.FC = () => {
  type DataScreenNavigationProp = CompositeNavigationProp<
    DrawerNavigationProp<AppDrawerParamList, "HomeStack">,
    NativeStackNavigationProp<AppStackParamList>
  >;
  const navigation = useNavigation<DataScreenNavigationProp>();
  const { user } = useAuth();

  // Estados para dados de saúde em tempo real do Wear OS
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isWearOsConnected, setIsWearOsConnected] = useState(false);

  // Estado para tempo de treino
  const [trainingTime, setTrainingTime] = useState<number>(0); // em segundos
  const trainingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Estado para calorias diárias
  const [dailyCalories, setDailyCalories] = useState<number>(0);

  // Estado para sono diário
  const [sleepHours, setSleepHours] = useState<number>(0);
  const [sleepMinutes, setSleepMinutes] = useState<number>(0);

  const getTodaySleepKey = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `sleep:${yyyy}-${mm}-${dd}`;
  };

  const getTodayCaloriesKey = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `calories:${yyyy}-${mm}-${dd}`;
  };

  const healthData = {
    calories: dailyCalories,
    steps: 999,
    heartRate: heartRate ?? 0, // Zera o valor até conectar com o relógio
    sleep: 0,
    Results: 0,
    water: 6,
  };

  const [currentDate] = useState(new Date()); // Data atual
  const [selectedDay, setSelectedDay] = useState(new Date().getDate()); // Seleciona automaticamente o dia atual
  const flatListRef = useRef<FlatList>(null);

  const [waterConsumedMl, setWaterConsumedMl] = useState<number>(0);
  const [stepsToday, setStepsToday] = useState<number>(0);
  const [stepsLoading, setStepsLoading] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const lastStepCountRef = useRef<number>(0);
  const stepsInactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsGoal = DEFAULT_STEPS_GOAL;

  const scheduleWalkingTimeout = useCallback(() => {
    if (stepsInactivityTimeoutRef.current) {
      clearTimeout(stepsInactivityTimeoutRef.current);
    }
    stepsInactivityTimeoutRef.current = setTimeout(() => {
      setIsWalking(false);
      stepsInactivityTimeoutRef.current = null;
    }, STEPS_INACTIVITY_TIMEOUT);
  }, []);

  const [cyclingRoute, setCyclingRoute] = useState<LatLng[]>([]);
  const [cyclingRegion, setCyclingRegion] = useState<Region | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const cyclingWatcherRef = useRef<Location.LocationSubscription | null>(null);

  const loadWaterConsumed = useCallback(async () => {
    try {
      const key = getTodayKey();
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { consumedMl?: number };
        setWaterConsumedMl(typeof parsed.consumedMl === "number" ? parsed.consumedMl : 0);
      } else {
        setWaterConsumedMl(0);
      }
    } catch {
      setWaterConsumedMl(0);
    }
  }, []);

  const calculateAndSaveCalories = useCallback(async () => {
    try {
      // Fórmula de gasto calórico baseada em:
      // 1. Passos: ~0.05 kcal por passo
      // 2. Frequência cardíaca: intensidade extra
      // 3. Tempo de treino: 5 kcal por minuto de atividade

      let calories = 0;

      // Calorias por passos (0.05 kcal por passo)
      calories += stepsToday * 0.05;

      // Calorias por frequência cardíaca elevada
      // Se BPM > 60 (repouso), adiciona calorias extras por intensidade
      if (heartRate && heartRate > 60) {
        const excessBpm = heartRate - 60;
        calories += excessBpm * 0.15; // 0.15 kcal por BPM acima do repouso
      }

      // Calorias por tempo de treino (5 kcal por minuto)
      if (trainingTime > 0) {
        const minutesOfTraining = trainingTime / 60;
        calories += minutesOfTraining * 5;
      }

      // Arredondar para 2 casas decimais
      const roundedCalories = Math.round(calories * 100) / 100;
      setDailyCalories(roundedCalories);

      // Salvar no AsyncStorage
      const key = getTodayCaloriesKey();
      await AsyncStorage.setItem(key, JSON.stringify({ calories: roundedCalories }));
    } catch (error) {
      console.error("Erro ao calcular/salvar calorias:", error);
    }
  }, [stepsToday, heartRate, trainingTime]);

  const loadDailyCalories = useCallback(async () => {
    try {
      const key = getTodayCaloriesKey();
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { calories?: number };
        setDailyCalories(typeof parsed.calories === "number" ? parsed.calories : 0);
      } else {
        setDailyCalories(0);
      }
    } catch {
      setDailyCalories(0);
    }
  }, []);

  const loadDailySleep = useCallback(async () => {
    try {
      const key = getTodaySleepKey();
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { hours?: number; minutes?: number };
        setSleepHours(typeof parsed.hours === "number" ? parsed.hours : 0);
        setSleepMinutes(typeof parsed.minutes === "number" ? parsed.minutes : 0);
      } else {
        setSleepHours(0);
        setSleepMinutes(0);
      }
    } catch {
      setSleepHours(0);
      setSleepMinutes(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWaterConsumed();
      loadDailyCalories();
      loadDailySleep();
      return () => {};
    }, [loadWaterConsumed, loadDailyCalories, loadDailySleep])
  );

  // Atualizar calorias quando houver mudanças nos dados (passos, BPM, tempo de treino)
  useEffect(() => {
    calculateAndSaveCalories();
  }, [stepsToday, heartRate, trainingTime, calculateAndSaveCalories]);

  // Controlar timer de treino baseado em movimento
  useEffect(() => {
    if (isWalking) {
      // Iniciar timer quando começar a caminhar
      if (!trainingIntervalRef.current) {
        trainingIntervalRef.current = setInterval(() => {
          setTrainingTime((prev) => prev + 1);
        }, 1000); // Incrementar a cada 1 segundo
      }
    } else {
      // Parar timer quando parar de caminhar
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

  // Carregar dados de batimento cardíaco do Wear OS em tempo real
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadWearOsData = async () => {
        if (!user?.id) return;

        try {
          // Obter dados iniciais
          const data = await getLatestWearOsHealthDataFromAllDevices(parseInt(user.id, 10));
          if (isMounted && data) {
            if (data.heartRate) {
              setHeartRate(data.heartRate);
              setIsWearOsConnected(true);
            }
          }

          // Configurar polling para atualizações em tempo real
          const unsubscribe = pollWearOsHealthData(
            parseInt(user.id, 10),
            5000,
            (newData: {
              heartRate: number | null;
              pressure: number | null;
              oxygen: number | null;
            }) => {
              if (isMounted && newData.heartRate) {
                setHeartRate(newData.heartRate);
                setIsWearOsConnected(true);
              }
            }
          );

          return () => {
            if (unsubscribe) unsubscribe();
          };
        } catch (error) {
          console.error("Erro ao carregar dados do Wear OS:", error);
          setIsWearOsConnected(false);
        }
      };

      const cleanup = loadWearOsData();

      return () => {
        isMounted = false;
        cleanup?.then((cb) => cb?.());
      };
    }, [user?.id])
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let unsubscribeSteps: (() => void) | null = null;

      const start = async () => {
        setStepsLoading(true);
        const authorized = await ensureGoogleFitPermissions();
        if (!authorized) {
          if (isMounted) {
            setStepsLoading(false);
          }
          return;
        }

        try {
          const initialSteps = await fetchTodayStepCount();
          if (!isMounted) {
            return;
          }
          lastStepCountRef.current = initialSteps;
          setStepsToday(initialSteps);
        } catch {
          // Error handled silently
        } finally {
          if (isMounted) {
            setStepsLoading(false);
          }
        }

        unsubscribeSteps = subscribeToStepUpdates((value) => {
          if (!isMounted) {
            return;
          }
          const numericValue = Number(value);
          if (!Number.isFinite(numericValue)) {
            return;
          }

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
        if (unsubscribeSteps) {
          unsubscribeSteps();
        }
        if (stepsInactivityTimeoutRef.current) {
          clearTimeout(stepsInactivityTimeoutRef.current);
          stepsInactivityTimeoutRef.current = null;
        }
        setIsWalking(false);
      };
    }, [scheduleWalkingTimeout])
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const startCyclingTracking = async () => {
        try {
          if (cyclingWatcherRef.current) {
            cyclingWatcherRef.current.remove();
            cyclingWatcherRef.current = null;
          }

          const { status } = await Location.requestForegroundPermissionsAsync();
          if (!isActive) {
            return;
          }

          if (status !== Location.PermissionStatus.GRANTED) {
            setLocationError("Permissão de localização negada.");
            setCyclingRoute([]);
            setCyclingRegion(null);
            return;
          }

          const initialPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (!isActive) {
            return;
          }

          const initialPoint: LatLng = {
            latitude: initialPosition.coords.latitude,
            longitude: initialPosition.coords.longitude,
          };

          setCyclingRoute([initialPoint]);
          setCyclingRegion({
            latitude: initialPoint.latitude,
            longitude: initialPoint.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          setLocationError(null);

          cyclingWatcherRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 5000,
              distanceInterval: 5,
            },
            (update) => {
              if (!isActive) {
                return;
              }

              const newPoint: LatLng = {
                latitude: update.coords.latitude,
                longitude: update.coords.longitude,
              };

              setCyclingRoute((prev) => {
                const next = [...prev, newPoint];
                return next.length > 60 ? next.slice(next.length - 60) : next;
              });

              setCyclingRegion((prev) => {
                if (!prev) {
                  return {
                    latitude: newPoint.latitude,
                    longitude: newPoint.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  };
                }

                return {
                  ...prev,
                  latitude: newPoint.latitude,
                  longitude: newPoint.longitude,
                };
              });
            }
          );
        } catch {
          if (isActive) {
            setLocationError("Não foi possível iniciar o rastreamento de ciclismo.");
          }
        }
      };

      startCyclingTracking();

      return () => {
        isActive = false;
        if (cyclingWatcherRef.current) {
          cyclingWatcherRef.current.remove();
          cyclingWatcherRef.current = null;
        }
        setCyclingRoute([]);
        setCyclingRegion(null);
      };
    }, [])
  );

  // Água - progresso relativo à meta
  const waterGoalMl = 2000; // fallback para 8 copos de 250ml
  const waterProgress = Math.max(0, Math.min(1, waterConsumedMl / waterGoalMl));

  const stepsProgress = stepsGoal > 0 ? Math.min(1, stepsToday / stepsGoal) : 0;
  const stepsProgressPercent = Math.round(Math.max(0, Math.min(1, stepsProgress)) * 100);
  const formattedSteps = useMemo(
    () => (stepsLoading ? "--" : stepsToday.toLocaleString("pt-BR")),
    [stepsLoading, stepsToday]
  );
  const stepsStatusText = useMemo(() => {
    if (stepsLoading) return "Sincronizando...";
    return isWalking ? "Contando agora" : "";
  }, [stepsLoading, isWalking]);
  const stepsStatusStyle = styles.stepsStatusText;

  // Formatar tempo de treino para exibição (mm:ss ou h:mm:ss)
  const formattedTrainingTime = useMemo(() => {
    const hours = Math.floor(trainingTime / 3600);
    const minutes = Math.floor((trainingTime % 3600) / 60);
    const seconds = trainingTime % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [trainingTime]);

  const DAY_ITEM_WIDTH = 50 + 4 * 2;

  const handleFlatListLayout = () => {
    if (flatListRef.current) {
      const flatListVisibleWidth = width - 20 * 2;
      const offset =
        (selectedDay - 1) * DAY_ITEM_WIDTH - flatListVisibleWidth / 2 + DAY_ITEM_WIDTH / 2;
      flatListRef.current.scrollToOffset({
        offset: Math.max(0, offset),
        animated: false,
      });
    }
  };

  const getMonthAndYear = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    const formattedDate = date.toLocaleDateString("pt-BR", options);
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const dayIndex = date.getDay();
    const days = ["D", "S", "T", "Q", "Q", "S", "S"];
    return days[dayIndex];
  };

  // Tamanho interno do card de Resultados (width/height menos padding do card), reduzido levemente para dar respiro aos rótulos
  const RESULTS_CARD_INNER_SIZE = Math.floor(Math.min(202 - 30, 188 - 30) * 0.9);

  // Mini Radar Chart (mesma lógica do ResultsScreen, sem labels para caber no card)
  const MiniRadar: React.FC<{ size?: number }> = ({ size = 150 }) => {
    const center = size / 2;
    const radius = size * 0.32;
    const axisRadius = size * 0.38;
    const gridRadius = size * 0.38;
    const labelRadius = axisRadius + 8;
    const levels = 5;
    const RADAR_LABELS = ["Água", "Sono", "Passos", "BPM", "IMC", "Calorias"] as const;
    const MAX_VALUE = 100;

    type RadarData = {
      water: number;
      sleep: number;
      steps: number;
      bpm: number;
      imc: number;
      calories: number;
    };

    const forcaData: RadarData = {
      water: 92,
      sleep: 88,
      steps: 93,
      bpm: 90,
      imc: 89,
      calories: 94,
    };
    const agilidadeData: RadarData = {
      water: 74,
      sleep: 72,
      steps: 78,
      bpm: 73,
      imc: 77,
      calories: 75,
    };
    const resistenciaData: RadarData = {
      water: 62,
      sleep: 58,
      steps: 65,
      bpm: 64,
      imc: 68,
      calories: 61,
    };

    const getValues = (data: RadarData) => {
      return RADAR_LABELS.map((_, i) => {
        const key = Object.keys(data)[i] as keyof RadarData;
        return (data[key] / MAX_VALUE) * radius;
      });
    };

    const getPolygonPoints = (values: number[]) => {
      return RADAR_LABELS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
        const r = values[i];
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return vec(x, y);
      });
    };

    const createRoundedPolygonPath = (
      points: ReturnType<typeof vec>[],
      cornerRadius: number = 14
    ) => {
      if (points.length < 3) return "";
      const numPoints = points.length;
      const pathSegments: string[] = [];
      const controlPoints: {
        before: { x: number; y: number };
        after: { x: number; y: number };
      }[] = [];
      for (let i = 0; i < numPoints; i++) {
        const prevIndex = (i - 1 + numPoints) % numPoints;
        const nextIndex = (i + 1) % numPoints;
        const p0 = points[prevIndex];
        const p1 = points[i];
        const p2 = points[nextIndex];
        const v1x = p1.x - p0.x;
        const v1y = p1.y - p0.y;
        const v2x = p2.x - p1.x;
        const v2y = p2.y - p1.y;
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
        const nv1x = len1 > 0 ? v1x / len1 : 0;
        const nv1y = len1 > 0 ? v1y / len1 : 0;
        const nv2x = len2 > 0 ? v2x / len2 : 0;
        const nv2y = len2 > 0 ? v2y / len2 : 0;
        const maxRadius = Math.min(len1, len2) / 2;
        const effectiveRadius = Math.min(cornerRadius, maxRadius * 0.8);
        controlPoints.push({
          before: {
            x: p1.x - nv1x * effectiveRadius,
            y: p1.y - nv1y * effectiveRadius,
          },
          after: {
            x: p1.x + nv2x * effectiveRadius,
            y: p1.y + nv2y * effectiveRadius,
          },
        });
      }
      const firstControl = controlPoints[0];
      pathSegments.push(`M ${firstControl.before.x} ${firstControl.before.y}`);
      for (let i = 0; i < numPoints; i++) {
        const control = controlPoints[i];
        const p1 = points[i];
        pathSegments.push(`Q ${p1.x} ${p1.y} ${control.after.x} ${control.after.y}`);
      }
      return pathSegments.join(" ") + " Z";
    };

    const forcaPath = createRoundedPolygonPath(getPolygonPoints(getValues(forcaData)), 16);
    const agilidadePath = createRoundedPolygonPath(getPolygonPoints(getValues(agilidadeData)), 16);
    const resistenciaPath = createRoundedPolygonPath(
      getPolygonPoints(getValues(resistenciaData)),
      16
    );

    return (
      <View style={{ width: size, height: size, position: "relative" }}>
        <Canvas style={{ width: size, height: size }}>
          {[...Array(levels)].map((_, i) => {
            const r = (gridRadius / levels) * (i + 1);
            const levelPoints = [0, 1, 2, 3, 4, 5].map((j) => {
              const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return vec(x, y);
            });
            const path =
              levelPoints.reduce(
                (p, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`),
                ""
              ) + " Z";
            return <Path key={i} path={path} color="#E5E7EB" style="stroke" strokeWidth={1} />;
          })}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const x = center + axisRadius * Math.cos(angle);
            const y = center + axisRadius * Math.sin(angle);
            return (
              <Path
                key={i}
                path={`M ${center} ${center} L ${x} ${y}`}
                color="#F1F5F9"
                style="stroke"
                strokeWidth={2}
              />
            );
          })}
          <Path path={forcaPath} style="fill" color="rgba(209, 161, 122, 0.5)" />
          <Path
            path={forcaPath}
            color="#F97316"
            style="stroke"
            strokeWidth={3}
            strokeJoin="round"
            strokeCap="round"
          />
          <Path path={agilidadePath} style="fill" color="rgba(69, 69, 77, 0.4)" />
          <Path
            path={agilidadePath}
            color="#192126"
            style="stroke"
            strokeWidth={3}
            strokeJoin="round"
            strokeCap="round"
          />
          <Path path={resistenciaPath} style="fill" color="rgba(118, 118, 150, 0.4)" />
          <Path
            path={resistenciaPath}
            color="#3F5EBC"
            style="stroke"
            strokeWidth={3}
            strokeJoin="round"
            strokeCap="round"
          />
        </Canvas>

        {RADAR_LABELS.map((label, i) => {
          const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
          const lx = center + labelRadius * Math.cos(angle);
          const ly = center + labelRadius * Math.sin(angle);
          let textAlign: "left" | "center" | "right" = "center";
          const isSide = Math.abs(Math.cos(angle)) > 0.7;
          if (isSide) {
            textAlign = Math.cos(angle) > 0 ? "left" : "right";
          } else {
            textAlign = "center";
          }
          const lateralSpacing = 16;
          const horizontalNudge = isSide
            ? Math.cos(angle) > 0
              ? lateralSpacing
              : -lateralSpacing
            : 0;
          const verticalNudge = label === "BPM" ? 6 : 0;
          return (
            <Text
              key={i}
              style={[
                styles.resultsAxisLabel,
                {
                  position: "absolute",
                  left: lx - 20 + horizontalNudge,
                  top: ly - 8 + verticalNudge,
                  textAlign,
                },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>
    );
  };

  const monthNameAndYear = getMonthAndYear(currentDate);
  const totalDaysInMonth = getDaysInMonth(currentDate);
  const daysInMonthArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const renderDay = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[styles.dayContainer, item === selectedDay && styles.selectedDayContainer]}
      onPress={() => setSelectedDay(item)}
    >
      <Text style={[styles.dayOfWeek, item === selectedDay && styles.selectedDayOfWeek]}>
        {getDayOfWeek(currentYear, currentMonth, item)}
      </Text>
      <Text style={[styles.dayOfMonth, item === selectedDay && styles.selectedDayOfMonth]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const getItemLayout = (data: ArrayLike<any> | null | undefined, index: number) => ({
    length: DAY_ITEM_WIDTH,
    offset: DAY_ITEM_WIDTH * index,
    index,
  });

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.monthText}>{monthNameAndYear}</Text>
        <View>
          <FlatList
            horizontal
            ref={flatListRef}
            data={daysInMonthArray}
            renderItem={renderDay}
            keyExtractor={(item) => String(item)}
            showsHorizontalScrollIndicator={false}
            style={{ width: "100%", marginBottom: 30, marginTop: 14 }}
            initialScrollIndex={selectedDay - 1}
            getItemLayout={getItemLayout}
            onLayout={handleFlatListLayout}
          />
          <Text style={styles.reportTitle}>Relatório de hoje</Text>

          <View style={styles.cardsContainer}>
            <View style={styles.topRowCardsContainer}>
              {/* Coluna Esquerda: Calorias e Tempo de Treino */}
              <View style={styles.leftColumn}>
                {/* Card de Calorias Gastas */}
                <TouchableOpacity
                  style={[styles.card, styles.caloriesCard]}
                  onPress={() =>
                    navigation.navigate({
                      name: "CaloriesScreen",
                      params: {} as never,
                    })
                  }
                >
                  <Text style={styles.cardCategory}>Calorias gastas</Text>
                  <Text style={[styles.cardValue, styles.caloriesValue]}>
                    {Math.round(healthData.calories)} Kcal
                  </Text>
                </TouchableOpacity>

                {/* Card de Tempo de Treino */}
                <TouchableOpacity
                  style={[styles.card, styles.trainingTimeCard]}
                  onPress={() =>
                    navigation.navigate({
                      name: "TrainingScreen",
                      params: {} as never,
                    })
                  }
                >
                  <Text style={[styles.cardCategory, styles.trainingTimeCategory]}>
                    Tempo de treino
                  </Text>
                  <View style={styles.trainingTimeValueContainer}>
                    <Text style={styles.trainingTimeValue}>{formattedTrainingTime}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Coluna Direita Superior: Resultados (mesma estilização do Ciclismo) */}
              <TouchableOpacity
                style={[styles.card, styles.ResultsCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "ResultsScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.ResultsContent}>
                  <View style={styles.ResultsHeader}>
                    <Text style={styles.ResultsCategory}>Resultados</Text>
                  </View>
                  <View style={styles.ResultsGraphPlaceholder}>
                    <MiniRadar size={RESULTS_CARD_INNER_SIZE} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Linha: Batimentos e Passos */}
            <View style={styles.rowContainer}>
              {/* Card de Batimentos */}
              <TouchableOpacity
                style={[styles.card, styles.heartRateCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "HeartbeatsScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.heartRateHeader}>
                  <Text style={[styles.cardCategory, styles.heartRateCategory]}>Batimentos</Text>
                  {isWearOsConnected && (
                    <View style={styles.connectionIndicator}>
                      <View style={styles.connectionDot} />
                      <Text style={styles.connectionText}>Conectado</Text>
                    </View>
                  )}
                </View>
                <ECGDisplay
                  bpm={healthData.heartRate}
                  width={140}
                  height={45}
                  responsive={false}
                  isConnected={isWearOsConnected && healthData.heartRate > 0}
                />
                <Text style={[styles.cardValue, styles.heartRateValue]}>
                  {isWearOsConnected && healthData.heartRate > 0
                    ? `${healthData.heartRate} Bpm`
                    : "--"}
                </Text>
              </TouchableOpacity>

              {/* Card de Passos */}
              <TouchableOpacity
                style={[styles.card, styles.stepsCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "StepsScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.stepsCardHeader}>
                  <Text style={[styles.cardCategory, styles.stepsCategory]}>Passos</Text>
                  <Text style={styles.stepsGoalText}>{stepsGoal.toLocaleString("pt-BR")} meta</Text>
                </View>
                <View style={styles.stepsCardBody}>
                  <View style={styles.stepsRingContainer}>
                    <StepProgressRing progress={stepsProgress} size={72} />
                    <View style={styles.stepsRingOverlay}>
                      <Footprints size={18} color="#FF8C00" />
                      <Text style={styles.stepsRingPercent}>{stepsProgressPercent}%</Text>
                    </View>
                  </View>
                  <View style={styles.stepsInfoContainer}>
                    <Text style={styles.stepsCountText}>{formattedSteps}</Text>
                    <Text style={styles.stepsMetaText}>
                      de {stepsGoal.toLocaleString("pt-BR")} passos
                    </Text>
                    <Text style={stepsStatusStyle}>{stepsStatusText}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Linha: Sono e Água */}
            <View style={styles.rowContainer}>
              {/* Card de Sono */}
              <TouchableOpacity
                style={[styles.card, styles.sleepCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "SleepScreen",
                    params: {} as never,
                  })
                }
              >
                <Text style={[styles.cardCategory, styles.sleepCategory]}>Sono</Text>
                <View style={styles.sleepStatusContainer}>
                  <Text style={[styles.cardValue, styles.sleepValue]}>
                    {sleepHours}h {String(sleepMinutes).padStart(2, "0")}m
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card de Água */}
              <TouchableOpacity
                style={[styles.card, styles.waterCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "WaterScreen",
                    params: {} as never,
                  })
                }
              >
                <Text style={[styles.cardCategory, styles.waterCategory]}>Água</Text>
                <View style={styles.waterFillPlaceholder}>
                  <WaterWave progress={waterProgress} />
                  <Text style={[styles.cardValue, styles.waterValue]}>{waterConsumedMl} ml</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cyclingCard} activeOpacity={0.9}>
              <View style={styles.cyclingHeader}>
                <View style={styles.cyclingIcon}>
                  <Bike size={20} color="#192126" />
                </View>
                <Text style={styles.cyclingTitle}>Ciclismo</Text>
              </View>
              <View style={styles.cyclingMapWrapper}>
                {cyclingRegion ? (
                  <MapView
                    pointerEvents="none"
                    style={styles.cyclingMap}
                    region={cyclingRegion}
                    customMapStyle={cyclingMapStyle}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    toolbarEnabled={false}
                    showsCompass={false}
                    showsBuildings={false}
                    showsTraffic={false}
                    showsIndoors={false}
                    showsIndoorLevelPicker={false}
                  >
                    {cyclingRoute.length > 1 && (
                      <Polyline
                        coordinates={cyclingRoute}
                        strokeColor="#BBF246"
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                      />
                    )}
                  </MapView>
                ) : (
                  <View style={styles.cyclingMapPlaceholder}>
                    <Text style={styles.cyclingPlaceholderText}>
                      {locationError ?? "Iniciando rastreamento..."}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  monthText: {
    color: "#192126",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 0,
  },
  dayContainer: {
    width: 50,
    height: 70,
    borderRadius: 15,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  selectedDayContainer: {
    backgroundColor: "#192126",
    borderColor: "transparent",
    borderWidth: 0,
  },
  dayOfWeek: {
    color: "#192126",
    fontSize: 14,
    marginBottom: 5,
  },
  selectedDayOfWeek: {
    color: "#BBF246",
  },
  dayOfMonth: {
    color: "#192126",
    fontSize: 20,
    fontWeight: "bold",
  },
  selectedDayOfMonth: {
    color: "#BBF246",
  },
  reportTitle: {
    color: "#192126",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 15,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  topRowCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  leftColumn: {
    width: 112,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  rowContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "#3A3A3A",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    justifyContent: "center",
  },
  cardCategory: {
    color: "#FFF",
    fontSize: 14,
    marginTop: -4,
    marginBottom: 5,
    fontWeight: "bold",
  },
  cardValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  caloriesCard: {
    backgroundColor: "#192126",
    height: 70,
    width: 150,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  caloriesValue: {
    color: "#FFF",
    fontSize: 14,
  },
  ResultsCard: {
    backgroundColor: "#192126",
    height: 188,
    width: 202,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderColor: "#192126",
    borderWidth: 1,
  },
  ResultsContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  ResultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    width: "100%",
  },
  ResultsCategory: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 34,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  ResultsGraphPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  ResultsGraphLine: {
    backgroundColor: "#BBF246",
    height: 2,
    width: "80%",
    borderRadius: 1,
  },
  trainingTimeCard: {
    backgroundColor: "#F5EEFB",
    width: 150,
    height: 108,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  trainingTimeCategory: {
    color: "#8A2BE2",
    fontSize: 14,
    marginBottom: 5,
    textAlign: "left",
    width: "100%",
    fontWeight: "bold",
  },
  trainingTimeValueContainer: {
    width: 54,
    height: 54,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: "#D8BFD8",
    justifyContent: "center",
    alignItems: "center",
  },
  trainingTimeValue: {
    color: "#8A2BE2",
    fontSize: 16,
    fontWeight: "bold",
  },
  heartRateCard: {
    backgroundColor: "#FCE7F3",
    width: "48%",
    height: 130,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heartRateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 3,
  },
  heartRateCategory: {
    color: "red",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  connectionText: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "600",
  },
  heartRateGraphPlaceholder: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  heartRateValue: {
    color: "#FF69B4",
    fontSize: 16,
    marginTop: 2,
  },
  ResultsValue: {
    color: "#00C0FF",
    fontSize: 18,
    fontWeight: "bold",
  },
  stepsCard: {
    backgroundColor: "#FFF3E0",
    width: "48%",
    minHeight: 132,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  stepsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  stepsGoalText: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "600",
  },
  stepsCardBody: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  stepsRingContainer: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepsRingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsRingPercent: {
    marginTop: 2,
    color: "#FF8C00",
    fontSize: 12,
    fontWeight: "700",
  },
  stepsInfoContainer: {
    flex: 1,
  },
  stepsCountText: {
    color: "#FF8C00",
    fontSize: 20,
    fontWeight: "700",
  },
  stepsMetaText: {
    color: "#B45309",
    fontSize: 12,
    marginTop: 2,
  },
  stepsStatusText: {
    color: "#4D7C0F",
    fontSize: 12,
    marginTop: 6,
  },
  stepsStatusError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
  },
  stepsTrailContainer: {
    marginTop: 12,
    width: "100%",
    height: 26,
    borderRadius: 14,
    backgroundColor: "#FFE8CC",
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  stepsTrailAnimatedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepsFootprintIcon: {
    marginHorizontal: 6,
  },
  stepsCategory: {
    color: "#FF8C00",
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  stepsValue: {
    color: "#FF8C00",
    fontSize: 18,
  },
  progressBarPlaceholder: {
    width: "100%",
    height: 10,
    backgroundColor: "#FFE0B2",
    borderRadius: 5,
    marginTop: 10,
  },
  progressBarFill: {
    width: "50%",
    height: "100%",
    backgroundColor: "#FFB74D",
    borderRadius: 5,
  },
  sleepCard: {
    backgroundColor: "#E0F2F7",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sleepCategory: {
    color: "#1F2937",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "bold",
  },
  sleepStatusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 8,
  },
  sleepValue: {
    color: "#1F2937",
    fontSize: 24,
    fontWeight: "bold",
  },
  sleepStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sleepStatusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  waterCard: {
    backgroundColor: "#E3F2FD",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  waterCategory: {
    color: "#192126",
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  waterFillPlaceholder: {
    width: "100%",
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  waterValue: {
    color: "#192126",
    paddingBottom: 5,
    paddingLeft: 5,
    fontSize: 18,
  },
  resultsCard: {
    backgroundColor: "#F3E8FF",
    width: "100%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  resultsCategory: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  resultsValue: {
    color: "#7E22CE",
    fontSize: 18,
  },
  cyclingCard: {
    backgroundColor: "#192126",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 202,
    height: 188,
    alignSelf: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#192126",
    justifyContent: "flex-start",
  },
  cyclingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cyclingIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cyclingIconText: {
    color: "#BBF246",
    fontSize: 12,
    fontWeight: "bold",
  },
  cyclingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cyclingMapWrapper: {
    flex: 1,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  cyclingMap: {
    width: "100%",
    height: "100%",
  },
  cyclingMapPlaceholder: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
  },
  cyclingPlaceholderText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
  bottomNavigationBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#282828",
    paddingVertical: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  navBarItem: {
    padding: 10,
    alignItems: "center",
  },
  navBarText: {
    color: "#fff",
    fontSize: 12,
  },
  navBarIconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: "#555",
    borderRadius: 12,
    marginBottom: 5,
  },
  navBarItemSelected: {
    backgroundColor: "#8BC34A",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  navBarTextSelected: {
    color: "#1E1E1E",
    fontSize: 12,
    fontWeight: "bold",
  },
  navBarIconSelectedPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    marginBottom: 5,
  },
  authorizeButton: {
    backgroundColor: "#8BC34A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  authorizeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
    color: "#666",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
    color: "#FF0000",
  },
  resultsAxisLabel: {
    color: "#FFFFFF",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },
});

export default DataScreen;
