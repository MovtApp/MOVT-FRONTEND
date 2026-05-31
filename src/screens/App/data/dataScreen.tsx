import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDrawerParamList, AppStackParamList } from "../../../@types/routes";
import Header from "../../../components/Header";
import MapView, { MapStyleElement, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import {
  Bike,
  Footprints,
  Flame,
  Timer,
  Heart,
  Moon,
  Droplets,
  Activity,
  ArrowRight,
  ScanFace,
  Sparkles,
} from "lucide-react-native";
import { useAuth } from "../../../contexts/AuthContext";
import ECGDisplay from "../../../components/ECGDisplay";
import MiniRadarChart, { RadarData } from "../../../components/MiniRadarChart";
import WaterWave from "../../../components/WaterWave";
import StepProgressRing from "../../../components/StepProgressRing";
import { useHealthTracking } from "../../../hooks/useHealthTracking";
import { formatTrainingTime } from "../../../utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

// ─── Error Boundary ────────────────────────────────────────────────────────────

interface EBState {
  hasError: boolean;
  error: Error | null;
}
class DataErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[DataScreen] Crash interceptado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#FEF2F2",
            margin: 12,
            borderRadius: 16,
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#DC2626", marginBottom: 10 }}>
            ⚠️ Erro no Módulo de Saúde
          </Text>
          <Text style={{ fontSize: 12, color: "#7F1D1D", textAlign: "center", marginBottom: 10 }}>
            {this.state.error?.message || "Erro de renderização desconhecido."}
          </Text>
          <Text style={{ fontSize: 10, color: "#991B1B", textAlign: "center" }}>
            {this.state.error?.stack?.slice(0, 300)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const width = screenWidth > 0 ? screenWidth : 360; // Fallback para largura padrão

const cyclingMapStyle: MapStyleElement[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

const formatNumberBR = (num: number): string => {
  if (!isFinite(num) || isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const DAY_ITEM_WIDTH = 60;

// keyExtractor estável (sem dependências) para a lista de dias.
const keyExtractorDay = (item: number) => String(item);

const getMonthAndYear = (date: Date) => {
  try {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    if (!date || isNaN(date.getTime())) return "";
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
  } catch (e) {
    return "";
  }
};

const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getDayOfWeek = (year: number, month: number, day: number) => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return days[new Date(year, month, day).getDay()];
};

const DataScreen: React.FC = () => {
  type DataScreenNavigationProp = CompositeNavigationProp<
    DrawerNavigationProp<AppDrawerParamList, "HomeStack">,
    NativeStackNavigationProp<AppStackParamList>
  >;
  const navigation = useNavigation<DataScreenNavigationProp>();
  const { user } = useAuth();
  const userId = user?.id;

  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const targetDate = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(selectedDay);
    return d;
  }, [currentDate, selectedDay]);

  const monthNameAndYear = getMonthAndYear(currentDate);
  const totalDaysInMonth = getDaysInMonth(currentDate);
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
  const displayEndDay = isCurrentMonth ? today.getDate() : totalDaysInMonth;

  const daysInMonthArray = Array.from({ length: displayEndDay }, (_, i) => i + 1);

  const flatListRef = useRef<FlatList>(null);

  const handleFlatListLayout = () => {
    if (flatListRef.current) {
      const flatListVisibleWidth = width - 40; // 20px padding cada lado
      // Scroll para que o dia selecionado fique alinhado à direita
      const offset = selectedDay * DAY_ITEM_WIDTH - flatListVisibleWidth;
      flatListRef.current.scrollToOffset({
        offset: Math.max(0, offset),
        animated: false,
      });
    }
  };

  const renderDay = useCallback(
    ({ item }: { item: number }) => {
      const isSelected = item === selectedDay;
      const today = new Date();
      const isFuture =
        currentYear > today.getFullYear() ||
        (currentYear === today.getFullYear() && currentMonth > today.getMonth()) ||
        (currentYear === today.getFullYear() &&
          currentMonth === today.getMonth() &&
          item > today.getDate());

      return (
        <TouchableOpacity
          style={[
            styles.dayContainer,
            isSelected && styles.selectedDayContainer,
            isFuture && styles.disabledDayContainer,
          ]}
          onPress={() => !isFuture && setSelectedDay(item)}
          activeOpacity={isFuture ? 1 : 0.7}
          disabled={isFuture}
        >
          <Text
            style={[
              styles.dayOfWeek,
              isSelected && styles.selectedDayText,
              isFuture && styles.disabledDayText,
            ]}
          >
            {getDayOfWeek(currentYear, currentMonth, item)}
          </Text>
          <Text
            style={[
              styles.dayOfMonth,
              isSelected && styles.selectedDayText,
              isFuture && styles.disabledDayText,
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedDay, currentYear, currentMonth]
  );

  const getItemLayout = (data: ArrayLike<any> | null | undefined, index: number) => ({
    length: DAY_ITEM_WIDTH,
    offset: DAY_ITEM_WIDTH * index,
    index,
  });

  return (
    <DataErrorBoundary>
      <View style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Header />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateHeader}>
            <Text style={styles.monthText}>{monthNameAndYear}</Text>
          </View>

          <FlatList
            horizontal
            ref={flatListRef}
            data={daysInMonthArray}
            renderItem={renderDay}
            keyExtractor={keyExtractorDay}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysListContent}
            style={styles.daysList}
            getItemLayout={getItemLayout}
            onLayout={handleFlatListLayout}
          />

          <DataContent userId={userId} targetDate={targetDate} navigation={navigation} />
        </ScrollView>
      </View>
    </DataErrorBoundary>
  );
};

// ─── Sub-Component for Daily Content (Remounts on Date Change) ──────────────────

interface DataContentProps {
  userId: string | undefined;
  targetDate: Date;
  navigation: any;
}

const DataContent: React.FC<DataContentProps> = ({ userId, targetDate, navigation }) => {
  const {
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
    waterConsumedMl,
    getHistoricalStats,
    isToday,
    authorize,
  } = useHealthTracking(targetDate);

  const [forcaData, setForcaData] = useState<RadarData | undefined>();
  const [agilidadeData, setAgilidadeData] = useState<RadarData | undefined>();
  const [resistenciaData, setResistenciaData] = useState<RadarData | undefined>();

  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        const stats = await getHistoricalStats("1d");

        const sNum = (val: any) => {
          const n = typeof val === "number" ? val : parseFloat(val);
          return isFinite(n) && !isNaN(n) ? n : 0;
        };

        // Usa os dados do HC/Hook local em vez do backend (se disponíveis),
        // o que garante que a UI reflita a performance real-time
        const totalWater = Math.max(waterConsumedMl, sNum(stats?.totalWater));
        const currentSleepMins = sleepHours * 60 + sleepMinutes;
        const avgSleep = Math.max(currentSleepMins, sNum(stats?.avgSleep));
        const avgHeartRate = Math.max(heartRate || 0, sNum(stats?.avgHeartRate));
        const totalCalories = Math.max(dailyCalories, sNum(stats?.totalCalories));
        const totalSteps = Math.max(stepsToday, sNum(stats?.totalSteps));

        setForcaData({
          water: Math.max(0, Math.min(100, (totalWater / 2000) * 100 || 0)),
          sleep: Math.max(0, Math.min(100, (avgSleep / 480) * 100 || 0)),
          steps: Math.max(0, Math.min(100, sNum(stats?.radar?.forca))),
          bpm: Math.max(0, Math.min(100, (avgHeartRate / 120) * 100 || 0)),
          imc: 92,
          calories: Math.max(0, Math.min(100, (totalCalories / 500) * 100 || 0)),
        });

        setAgilidadeData({
          water: Math.max(0, Math.min(100, (totalWater / 1500) * 100 || 0)),
          sleep: Math.max(0, Math.min(100, (avgSleep / 420) * 100 || 0)),
          steps: Math.max(0, Math.min(100, (totalSteps / 5000) * 100 || 0)),
          bpm: avgHeartRate > 0 ? 80 : 0,
          imc: 85,
          calories: Math.max(0, Math.min(100, sNum(stats?.radar?.agilidade))),
        });

        setResistenciaData({
          water: Math.max(0, Math.min(100, (totalWater / 1000) * 100 || 0)),
          sleep: Math.max(0, Math.min(100, sNum(stats?.radar?.resistencia))),
          steps: Math.max(0, Math.min(100, (totalSteps / 3000) * 100 || 0)),
          bpm: avgHeartRate > 0 ? 60 : 0,
          imc: 70,
          calories: Math.max(0, Math.min(100, (totalCalories / 300) * 100 || 0)),
        });
      } catch (error) {
        console.error("Error fetching radar data in dataScreen:", error);
      }
    };

    fetchRadarData();
  }, [
    getHistoricalStats,
    targetDate,
    userId,
    waterConsumedMl,
    sleepHours,
    sleepMinutes,
    heartRate,
    dailyCalories,
    stepsToday,
  ]);

  const healthData = {
    calories: isFinite(dailyCalories) && !isNaN(dailyCalories) ? dailyCalories : 0,
    steps: isFinite(stepsToday) && !isNaN(stepsToday) ? stepsToday : 0,
    heartRate: heartRate !== null && isFinite(heartRate) && !isNaN(heartRate) ? heartRate : 0,
    sleep: isFinite(sleepHours) && !isNaN(sleepHours) ? sleepHours : 0,
    water: isFinite(waterConsumedMl) && !isNaN(waterConsumedMl) ? waterConsumedMl / 250 : 0,
  };

  const waterGoalMl = 2000;
  const rawWaterProgress = waterConsumedMl / waterGoalMl;
  const waterProgress =
    isFinite(rawWaterProgress) && !isNaN(rawWaterProgress)
      ? Math.max(0, Math.min(1, rawWaterProgress))
      : 0;

  const rawStepsProgress = stepsGoal > 0 ? stepsToday / stepsGoal : 0;
  const stepsProgress =
    stepsGoal > 0 && isFinite(rawStepsProgress) && !isNaN(rawStepsProgress)
      ? Math.max(0, Math.min(1, rawStepsProgress))
      : 0;
  const stepsProgressPercent = Math.round(stepsProgress * 100);

  const formattedSteps = useMemo(() => {
    // Só exibe '--' quando ainda está carregando E não temos nenhum valor ainda
    if (stepsLoading && stepsToday === 0) return "--";
    try {
      const safeSteps = isFinite(stepsToday) && !isNaN(stepsToday) ? stepsToday : 0;
      return formatNumberBR(safeSteps);
    } catch (e) {
      return String(stepsToday || 0);
    }
  }, [stepsLoading, stepsToday]);

  const formattedTrainingTime = formatTrainingTime(trainingTime);

  /* Dynamic Sizing - Sanitized */
  const SAFE_WIDTH = width > 0 ? width : 360;
  const CARD_WIDTH = Math.max(100, (SAFE_WIDTH - 40 - 20) / 2);
  const RADAR_SIZE = Math.max(80, Math.min(CARD_WIDTH * 0.85, 140));
  const RADAR_MARGIN_TOP = Math.max(5, CARD_WIDTH * 0.12);

  const safeCyclingRoute = useMemo(() => {
    if (!Array.isArray(cyclingRoute)) return [];
    return cyclingRoute.filter(
      (c) =>
        c &&
        typeof c.latitude === "number" &&
        typeof c.longitude === "number" &&
        isFinite(c.latitude) &&
        isFinite(c.longitude) &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude)
    );
  }, [cyclingRoute]);

  const hasValidMapRegion = useMemo(() => {
    return (
      cyclingRegion &&
      typeof cyclingRegion.latitude === "number" &&
      !isNaN(cyclingRegion.latitude) &&
      typeof cyclingRegion.longitude === "number" &&
      !isNaN(cyclingRegion.longitude) &&
      isFinite(cyclingRegion.latitude) &&
      isFinite(cyclingRegion.longitude)
    );
  }, [cyclingRegion]);

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
          marginTop: 10,
        }}
      >
        <Text style={[styles.sectionTitle, { marginBottom: 0, marginTop: 0 }]}>Resumo diário</Text>
      </View>

      <View style={styles.gridContainer}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          {/* Calories Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.card, styles.smallCard]}
            onPress={() =>
              navigation.navigate(
                "CaloriesScreen" as never,
                { date: targetDate.toISOString() } as never
              )
            }
          >
            <LinearGradient
              colors={["rgba(255, 140, 0, 0.1)", "rgba(255, 140, 0, 0.05)"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(255, 140, 0, 0.15)" }]}>
                <Flame size={18} color="#FF8C00" />
              </View>
              <ArrowRight size={16} color="#9CA3AF" />
            </View>
            <View>
              <Text style={styles.cardLabel}>Calorias</Text>
              <Text style={styles.cardValueLarge}>
                {Math.round(healthData.calories)}
                <Text style={styles.unitText}> kcal</Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Training Time Card - Now passive display only */}
          <View style={[styles.card, styles.smallCard]}>
            <LinearGradient
              colors={["rgba(138, 43, 226, 0.1)", "rgba(138, 43, 226, 0.05)"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(138, 43, 226, 0.15)" }]}>
                <Timer size={18} color="#8A2BE2" />
              </View>
              {isWalking && (
                <Animated.View entering={FadeInDown} style={styles.activePulse}>
                  <View style={styles.pulseDot} />
                </Animated.View>
              )}
            </View>
            <View>
              <Text style={styles.cardLabel}>Tempo Ativo</Text>
              <Text style={styles.cardValueMedium}>{formattedTrainingTime}</Text>
            </View>
          </View>
        </View>

        {/* Right Column - Results (Radar) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.tallCard]}
          onPress={() => navigation.navigate("ResultsScreen" as never)}
        >
          <LinearGradient
            colors={["rgba(187, 242, 70, 0.15)", "rgba(187, 242, 70, 0.05)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Performance</Text>
            <ArrowRight size={16} color="#4B5563" />
          </View>
          <View style={[styles.radarContainer, { marginTop: RADAR_MARGIN_TOP }]}>
            <MiniRadarChart
              size={RADAR_SIZE}
              forcaData={forcaData}
              agilidadeData={agilidadeData}
              resistenciaData={resistenciaData}
            />
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardLabel}>Análise completa</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Expectation x Reality Card - Professional Clean Version */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.comparisonCard}
        onPress={() => navigation.navigate("ExpectationRealityScreen" as never)}
      >
        <LinearGradient
          colors={["rgba(99, 102, 241, 0.08)", "rgba(167, 139, 250, 0.03)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.comparisonContent}>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.comparisonTitle}>Expectativa x Realidade</Text>
            <Text style={styles.comparisonSubTitle}>Comparativo anatômico e metas físicas</Text>
          </View>

          <ArrowRight size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>

      {/* Row 2: Steps & Heart Rate */}
      <View style={styles.rowContainer}>
        {/* Steps Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.mediumCard]}
          onPress={() =>
            navigation.navigate("StepsScreen" as never, { date: targetDate.toISOString() } as never)
          }
        >
          <LinearGradient
            colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.02)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Passos</Text>
            <Footprints size={18} color="#22C55E" />
          </View>

          <View style={styles.stepsContent}>
            <View style={styles.stepsRingWrapper}>
              <StepProgressRing progress={stepsProgress} size={60} strokeWidth={6} />
              <View style={styles.stepsRingInner}>
                <Text style={styles.stepsPercent}>{stepsProgressPercent}%</Text>
              </View>
            </View>
            <View style={styles.stepsData}>
              <Text style={styles.cardValueMove}>{formattedSteps}</Text>
              <Text style={styles.cardSubText}>
                Meta:{" "}
                {(() => {
                  try {
                    const safeGoal =
                      isFinite(stepsGoal) && !isNaN(stepsGoal) ? stepsGoal : DEFAULT_STEPS_GOAL;
                    return formatNumberBR(safeGoal);
                  } catch (e) {
                    return String(stepsGoal || 0);
                  }
                })()}
              </Text>
              {isWalking && <Text style={styles.liveTag}>• Andando</Text>}
            </View>
          </View>
        </TouchableOpacity>

        {/* Heart Rate Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.mediumCard]}
          onPress={() =>
            navigation.navigate(
              "HeartbeatsScreen" as never,
              { date: targetDate.toISOString() } as never
            )
          }
        >
          <LinearGradient
            colors={["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.02)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>BPM</Text>
            <Heart
              size={18}
              color="#EF4444"
              fill={healthData.heartRate > 0 ? "#EF4444" : "transparent"}
            />
          </View>

          <View style={styles.ecgContainer}>
            <ECGDisplay
              bpm={healthData.heartRate}
              width={width * 0.35}
              height={50}
              responsive={false}
              isConnected={isWearOsConnected && healthData.heartRate > 0}
              color="#EF4444"
            />
          </View>
          <View style={styles.bpmFooter}>
            <Text style={[styles.cardValueLarge, { color: "#EF4444" }]}>
              {healthData.heartRate > 0 ? healthData.heartRate : "--"}
            </Text>
            {isWearOsConnected && (
              <View style={styles.connectedBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.connectedText}>Sync</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Row 3: Sleep & Water */}
      <View style={styles.rowContainer}>
        {/* Sleep Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.halfCard]}
          onPress={() =>
            navigation.navigate("SleepScreen" as never, { date: targetDate.toISOString() } as never)
          }
        >
          <LinearGradient
            colors={["rgba(99, 102, 241, 0.15)", "rgba(99, 102, 241, 0.05)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: "#818CF8" }]}>Sono</Text>
            <Moon size={18} color="#818CF8" />
          </View>
          <View style={styles.sleepContent}>
            <Text style={styles.cardValueLarge}>
              {sleepHours}
              <Text style={styles.unitText}>h</Text> {String(sleepMinutes).padStart(2, "0")}
              <Text style={styles.unitText}>m</Text>
            </Text>
          </View>
        </TouchableOpacity>

        {/* Water Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.halfCard]}
          onPress={() =>
            navigation.navigate("WaterScreen" as never, { date: targetDate.toISOString() } as never)
          }
        >
          <LinearGradient
            colors={["rgba(6, 182, 212, 0.15)", "rgba(6, 182, 212, 0.05)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: "#22D3EE" }]}>Hidratação</Text>
            <Droplets size={18} color="#22D3EE" />
          </View>
          <View style={styles.waterContent}>
            <View style={styles.waterWaveContainer}>
              <WaterWave progress={waterProgress} height={40} width={40} />
            </View>
            <Text style={styles.cardValueMediumWater}>
              {waterConsumedMl}
              <Text style={styles.unitTextSmall}>ml</Text>
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Cycling Map Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cyclingCard}
        onPress={() =>
          navigation.navigate("CyclingScreen" as never, { date: targetDate.toISOString() } as never)
        }
      >
        <View style={styles.cyclingHeader}>
          <View style={styles.cyclingIconBox}>
            <Bike size={20} color="#111827" />
          </View>
          <Text style={styles.cyclingTitle}>Atividade de Ciclismo</Text>
        </View>

        <View style={styles.mapContainer}>
          {hasValidMapRegion &&
          cyclingRegion &&
          Number.isFinite(cyclingRegion.latitude) &&
          Number.isFinite(cyclingRegion.longitude) ? (
            <MapView
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              pointerEvents="none"
              style={styles.map}
              region={{
                latitude: cyclingRegion.latitude,
                longitude: cyclingRegion.longitude,
                latitudeDelta: cyclingRegion.latitudeDelta || 0.005,
                longitudeDelta: cyclingRegion.longitudeDelta || 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsCompass={false}
              showsBuildings={false}
              showsTraffic={false}
              showsIndoors={false}
              moveOnMarkerPress={false}
            >
              {safeCyclingRoute.length > 1 && (
                <Polyline
                  coordinates={safeCyclingRoute}
                  strokeColor="#BBF246"
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <View style={styles.radarEffect} />
              <Text style={styles.mapPlaceholderText}>
                {!isToday
                  ? "Sem rota registrada"
                  : locationError
                    ? "Localização indisponível"
                    : "Aguardando GPS..."}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </Animated.View>
  );
};

const DEFAULT_STEPS_GOAL = 10000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  monthText: {
    color: "#1F2937",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  daysList: {
    marginBottom: 20,
  },
  daysListContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  dayContainer: {
    width: 50,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledDayContainer: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.5,
  },
  disabledDayText: {
    color: "#D1D5DB",
  },
  selectedDayContainer: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.1,
  },
  dayOfWeek: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  dayOfMonth: {
    color: "#1F2937",
    fontSize: 20,
    fontWeight: "700",
  },
  selectedDayText: {
    color: "#111827",
  },
  sectionTitle: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 15,
  },
  leftColumn: {
    width: "48%",
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  smallCard: {
    height: 110,
    justifyContent: "space-between",
  },
  tallCard: {
    width: "48%",
    height: 232, // Matches 2 small cards + gap
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    width: "100%",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },
  performanceHeader: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  performanceTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
  },
  cardValueLarge: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
  },
  cardValueMedium: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  cardValueMediumWater: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
  },
  cardValueMove: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
  },
  unitText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  unitTextSmall: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  radarContainer: {
    transform: [{ scale: 1.0 }],
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 15,
  },
  mediumCard: {
    width: "48%",
    height: 150,
  },
  halfCard: {
    width: "48%",
    height: 100,
    justifyContent: "space-between",
  },
  stepsContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  stepsRingWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepsRingInner: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  stepsPercent: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "800",
  },
  stepsData: {
    flex: 1,
    justifyContent: "center",
  },
  cardSubText: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 2,
  },
  liveTag: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  ecgContainer: {
    marginVertical: 5,
    height: 40,
    justifyContent: "center",
  },
  bpmFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },
  connectedText: {
    color: "#22C55E",
    fontSize: 8,
    fontWeight: "700",
  },
  sleepContent: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  waterContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waterWaveContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E0F2FE",
  },
  cyclingCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cyclingHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cyclingIconBox: {
    backgroundColor: "#BBF246",
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cyclingTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    color: "#9CA3AF",
    marginTop: 10,
    fontSize: 12,
  },
  radarEffect: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(187, 242, 70, 0.5)",
  },
  comparisonCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    height: 88,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3F4FB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  comparisonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  comparisonIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  comparisonSubTitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  activePulse: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8A2BE2",
  },
});

export default DataScreen;
