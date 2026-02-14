import React, { useState, useEffect } from "react";
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
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import { Flame, MapPin, Clock, Footprints, Target, Edit2 } from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
  FadeInDown,
} from "react-native-reanimated";

// Fallback extremamente seguro para Animated.View
const ReanimatedView = typeof Animated !== "undefined" && Animated?.View ? Animated.View : View;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const StepsProgressChart: React.FC<{
  progress: number;
  steps: number;
  goal: number;
  onEditGoal?: () => void;
}> = ({ progress, steps, goal, onEditGoal }) => {
  const { width } = useWindowDimensions();
  const size = Math.min(Math.max(width * 0.85, 280), 340);
  const center = size / 2;
  const strokeWidth = 24;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const clampedProgress = Math.max(0.01, Math.min(1, progress));
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withTiming(clampedProgress, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [clampedProgress, progressAnim]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressAnim.value),
  }));

  return (
    <View style={chartStyles.container}>
      <Svg width={size} height={size} style={chartStyles.svg}>
        <Defs>
          <LinearGradient id="stepsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#60A5FA" />
          </LinearGradient>
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#F3F4F6" />
            <Stop offset="100%" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track with soft shadow internal effect */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Main Progress Ring */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#stepsGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <View style={chartStyles.contentOverlay}>
        <View style={chartStyles.iconCircle}>
          <Footprints size={24} color="#2563EB" />
        </View>
        <Text style={chartStyles.stepsValue}>{steps.toLocaleString("pt-BR")}</Text>
        <Text style={chartStyles.stepsLabel}>passos</Text>

        <TouchableOpacity style={chartStyles.goalBadge} onPress={onEditGoal} activeOpacity={0.7}>
          <Target size={12} color="#2563EB" style={{ marginRight: 4 }} />
          <Text style={chartStyles.goalText}>Meta: {goal.toLocaleString("pt-BR")}</Text>
          <View style={chartStyles.editIconWrapper}>
            <Edit2 size={10} color="#2563EB" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepsScreen: React.FC = () => {
  const [stepsData, setStepsData] = useState({
    steps: 8432,
    goal: 10000,
    calories: 342,
    kilometers: 6.2,
    minutes: 48,
  });

  const handleEditGoal = () => {
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

  const progress = stepsData.steps / stepsData.goal;

  return (
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
            <StepsProgressChart
              progress={progress}
              steps={stepsData.steps}
              goal={stepsData.goal}
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
          <ReanimatedView entering={FadeInDown.delay(800).duration(600)} style={styles.insightCard}>
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
