import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import { Flame, MapPin, Clock, Footprints, Target, Edit2 } from "lucide-react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Rect,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
  FadeInDown,
} from "react-native-reanimated";

import { getHealthMetricData } from "../../../../services/caloriesService";

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
    console.error("[StepsScreen] Crash interceptado:", error, info);
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
            ⚠️ Erro no Módulo de Passos
          </Text>
          <Text style={{ fontSize: 12, color: "#7F1D1D", textAlign: "center", marginBottom: 10 }}>
            {this.state.error?.message}
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

// Fallback extremamente seguro para Animated.View
const ReanimatedView = typeof Animated !== "undefined" && Animated?.View ? Animated.View : View;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const StepsCircularProgress: React.FC<{
  steps: number;
  goal: number;
  isToday: boolean;
  onEditGoal?: () => void;
}> = ({ steps, goal, isToday, onEditGoal }) => {
  const { width: windowWidth } = useWindowDimensions();
  const size = windowWidth * 0.75;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const rawProgress = goal > 0 ? steps / goal : 0;
  const progress =
    isFinite(rawProgress) && !isNaN(rawProgress) ? Math.min(1.5, Math.max(0, rawProgress)) : 0;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.min(1, animatedProgress.value)),
  }));

  return (
    <View style={chartStyles.container}>
      <Svg width={size} height={size} style={chartStyles.svg}>
        <Defs>
          <LinearGradient id="stepsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#2563EB" />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Fill */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#stepsGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={chartStyles.contentOverlay}>
        <View style={chartStyles.iconCircle}>
          <Footprints size={24} color="#2563EB" />
        </View>
        <Text style={chartStyles.stepsValue}>{steps.toLocaleString("pt-BR")}</Text>
        <Text style={chartStyles.stepsLabel}>PASSOS</Text>

        <TouchableOpacity
          style={chartStyles.goalBadge}
          activeOpacity={isToday ? 0.7 : 1}
          onPress={isToday ? onEditGoal : undefined}
          disabled={!isToday}
        >
          <Target size={14} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={chartStyles.goalText}>Meta: {goal.toLocaleString("pt-BR")}</Text>
          {isToday && (
            <View style={chartStyles.editIconWrapper}>
              <Edit2 size={12} color="#2563EB" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepsScreen: React.FC = () => {
  const route = useRoute<any>();
  const routeDate = (() => {
    try {
      const d = route.params?.date ? new Date(route.params.date) : new Date();
      return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) {
      return new Date();
    }
  })();
  const dateStr = `${routeDate.getFullYear()}-${String(routeDate.getMonth() + 1).padStart(2, "0")}-${String(routeDate.getDate()).padStart(2, "0")}`;

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      routeDate.getDate() === today.getDate() &&
      routeDate.getMonth() === today.getMonth() &&
      routeDate.getFullYear() === today.getFullYear()
    );
  }, [routeDate]);

  const [stepsData, setStepsData] = useState({
    steps: 0,
    goal: 10000,
    calories: 0,
    kilometers: 0,
    minutes: 0,
    rawData: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStepsData = async () => {
    try {
      setIsLoading(true);

      // Sincronização em tempo real com o dispositivo apenas se for hoje
      if (isToday) {
        try {
          const { NativeHealthManager } = require("../../../../services/nativeHealthManager");
          console.log("[StepsScreen] Sincronizando passos com o sistema...");
          await NativeHealthManager.fetchSteps();
        } catch (err) {
          console.warn("Erro ao sincronizar passos nativos:", err);
        }
      }

      const data = await getHealthMetricData("steps", "1d", dateStr);
      if (data && data.data) {
        setStepsData({
          steps: data.totalCalories || 0,
          goal: data.dailyGoal || 10000,
          calories: Math.round((data.totalCalories || 0) * 0.04), // Estimativa de calorias por passo
          kilometers: parseFloat(((data.totalCalories || 0) * 0.000762).toFixed(2)),
          minutes: Math.round((data.totalCalories || 0) / 100),
          rawData: data.data || [],
        });
      }
    } catch (error) {
      console.error("Erro ao buscar passos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStepsData();
  }, [dateStr, isToday]);

  const handleEditGoal = () => {
    if (!isToday) return;
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Alert.prompt(
        "Editar Meta",
        "Defina sua nova meta diária de passos",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salvar",
            onPress: (value?: string) => {
              const newGoal = parseInt(value || "0", 10);
              if (newGoal > 0) {
                setStepsData((prev) => ({ ...prev, goal: newGoal }));
              }
            },
          },
        ],
        "plain-text",
        stepsData.goal.toString(),
        "number-pad"
      );
    }
  };

  const rawProgress = stepsData.goal > 0 ? stepsData.steps / stepsData.goal : 0;
  const progress =
    isFinite(rawProgress) && !isNaN(rawProgress) ? Math.min(1, Math.max(0, rawProgress)) : 0;

  return (
    <DataErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <BackButton to={{ name: "DataScreen" }} />
              <Text style={styles.headerTitle}>Passos</Text>
              <View style={{ width: 46 }} />
            </View>

            {/* Main Chart Area */}
            <ReanimatedView entering={FadeInDown.duration(800)} style={styles.chartSection}>
              <StepsCircularProgress
                steps={stepsData.steps}
                goal={stepsData.goal}
                isToday={isToday}
                onEditGoal={handleEditGoal}
              />
            </ReanimatedView>

            {/* Metrics Quick View */}
            <View style={styles.metricsGrid}>
              <ReanimatedView
                entering={FadeInDown.delay(200).duration(600)}
                style={styles.metricCardWrapper}
              >
                <ExpoLinearGradient colors={["#FFF7ED", "#FFFFFF"]} style={styles.metricCard}>
                  <View style={[styles.iconBox, { backgroundColor: "#FFEDD5" }]}>
                    <Flame size={20} color="#F97316" />
                  </View>
                  <Text style={styles.metricCardValue}>{stepsData.calories}</Text>
                  <Text style={styles.metricCardLabel}>kcal</Text>
                </ExpoLinearGradient>
              </ReanimatedView>

              <ReanimatedView
                entering={FadeInDown.delay(400).duration(600)}
                style={styles.metricCardWrapper}
              >
                <ExpoLinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={styles.metricCard}>
                  <View style={[styles.iconBox, { backgroundColor: "#DBEAFE" }]}>
                    <MapPin size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.metricCardValue}>{stepsData.kilometers.toFixed(1)}</Text>
                  <Text style={styles.metricCardLabel}>km</Text>
                </ExpoLinearGradient>
              </ReanimatedView>

              <ReanimatedView
                entering={FadeInDown.delay(600).duration(600)}
                style={styles.metricCardWrapper}
              >
                <ExpoLinearGradient colors={["#F8FAFC", "#FFFFFF"]} style={styles.metricCard}>
                  <View style={[styles.iconBox, { backgroundColor: "#F1F5F9" }]}>
                    <Clock size={20} color="#64748B" />
                  </View>
                  <Text style={styles.metricCardValue}>{stepsData.minutes}</Text>
                  <Text style={styles.metricCardLabel}>min</Text>
                </ExpoLinearGradient>
              </ReanimatedView>
            </View>

            {/* Insight Section */}
            <ReanimatedView
              entering={FadeInDown.delay(800).duration(600)}
              style={styles.insightCard}
            >
              <View style={styles.insightIcon}>
                <Footprints size={20} color="#2563EB" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Bom trabalho!</Text>
                <Text style={styles.insightText}>
                  Você já completou {Math.round(progress * 100)}% da sua meta diária de passos.
                </Text>
              </View>
            </ReanimatedView>

            <View style={{ height: 120 }} />
          </ScrollView>

          <DataPillNavigator currentScreen="StepsScreen" />
        </View>
      </SafeAreaView>
    </DataErrorBoundary>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 20,
  },
  svg: {
    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  contentOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepsValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -1,
  },
  stepsLabel: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
    marginTop: -4,
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  goalText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  editIconWrapper: {
    marginLeft: 6,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: "#DBEAFE",
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  chartSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },
  metricCardWrapper: {
    flex: 1,
  },
  metricCard: {
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F8FAFC",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  metricCardLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 2,
  },
  insightCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});

export default StepsScreen;
