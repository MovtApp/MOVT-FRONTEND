import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { Moon, Clock } from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, G } from "react-native-svg";
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from "react-native-reanimated";

const DATA_SCREENS: (keyof AppStackParamList)[] = [
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "WaterScreen",
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SleepDay {
  date: string;
  duration: number;
  quality: "light" | "deep" | "none";
}

const SleepProgressChart: React.FC<{
  totalSleep: { hours: number; minutes: number };
  goalHours: number;
}> = ({ totalSleep, goalHours }) => {
  const { width } = useWindowDimensions();
  const size = Math.min(Math.max(width * 0.85, 260), 340);
  const center = size / 2;
  const radius = center - 40;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  const totalMinutes = totalSleep.hours * 60 + totalSleep.minutes;
  const maxMinutes = goalHours * 60;
  const progress = Math.min(totalMinutes / maxMinutes, 1);

  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressAnim.value),
  }));

  const startAngle = -90;
  const endAngle = startAngle + 360 * progress;

  const getIconPosition = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const x = center + radius * Math.cos(rad);
    const y = center + radius * Math.sin(rad);
    return { x, y };
  };

  const startPos = getIconPosition(startAngle);
  const endPos = getIconPosition(endAngle);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#FB923C" />
          </LinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />

          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#sleepGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>

        <Circle cx={center} cy={center} r={55} fill="#FFFFFF" />
      </Svg>

      <View
        style={{
          position: "absolute",
          left: startPos.x - 23,
          top: startPos.y - 23,
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: "#3B82F6",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "#3B82F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Moon size={18} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      </View>

      {progress > 0 && (
        <View
          style={{
            position: "absolute",
            left: endPos.x - 23,
            top: endPos.y - 23,
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: "#FB923C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#FB923C",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>
      )}

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "600",
            color: "#1F2937",
          }}
        >
          {totalSleep.hours}h {totalSleep.minutes.toString().padStart(2, "0")}min
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            marginTop: 4,
            fontWeight: "bold"
          }}
        >
          Duração do sono
        </Text>
      </View>
    </View>
  );
};

const SleepHeatmap: React.FC<{ weeklyData: SleepDay[] }> = ({ weeklyData }) => {
  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  const { width } = useWindowDimensions();
  
  const horizontalPadding = 20;
  const availableWidth = width - (horizontalPadding * 2);
  const maxWidth = 300;
  const containerWidth = Math.min(availableWidth, maxWidth);
  
  const gap = 6;
  const totalGaps = (7 - 1) * gap;
  const cellSize = Math.floor((containerWidth - totalGaps) / 7);

  return (
    <View style={[styles.heatmapContainer, { alignItems: "center" }]}>
      <View style={{ width: containerWidth }}>
        <View style={[styles.daysHeader, { justifyContent: "space-around" }]}>
          {days.map((d, i) => (
            <Text 
              key={i} 
              style={[styles.dayText, { width: cellSize }]}
            >
              {d}
            </Text>
          ))}
        </View>

        <View 
          style={[
            styles.heatmapGrid,
            { 
              gap,
              justifyContent: "flex-start",
            }
          ]}
        >
          {weeklyData.map((day, i) => {
            let backgroundColor = "#F3F4F6";
            if (day.quality === "deep") backgroundColor = "#3B82F6";
            if (day.quality === "light") backgroundColor = "#FB923C";

            return (
              <View
                key={i}
                style={[
                  styles.heatmapCell,
                  { 
                    backgroundColor, 
                    opacity: day.duration > 0 ? 1 : 0.3,
                    width: cellSize,
                    height: cellSize,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const SleepScreen: React.FC = () => {
  const [sleepData] = useState({
    totalSleep: { hours: 7, minutes: 30 },
    goalHours: 8,
    weeklyData: Array.from({ length: 35 }, (_, i) => ({
      date: `2025-04-${String((i % 30) + 1).padStart(2, "0")}`,
      duration: Math.random() > 0.2 ? Math.floor(Math.random() * 480) : 0,
      quality: (Math.random() > 0.6 ? "deep" : Math.random() > 0.3 ? "light" : "none") as
        | "light"
        | "deep"
        | "none",
    })),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.headerTitle}>Sono</Text>
            <View style={{ width: 46 }} />
          </View>

          <View style={styles.chartContainer}>
            <SleepProgressChart
              totalSleep={sleepData.totalSleep}
              goalHours={sleepData.goalHours}
            />
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FB923C" }]} />
              <Text style={styles.legendText}>Interrupções ou Sono Leve</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.legendText}>Duração do Sono</Text>
            </View>
          </View>

          <SleepHeatmap weeklyData={sleepData.weeklyData} />

          <View style={{ height: 100 }} />
        </ScrollView>

        <NavigationArrows currentScreen="SleepScreen" screens={DATA_SCREENS} />
      </View>
    </SafeAreaView>
  );
};

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
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  heatmapContainer: {
    marginTop: 30,
    width: "100%",
  },
  daysHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dayText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "500",
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  heatmapCell: {
    borderRadius: 8,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 6,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#6B7280",
  },
});

export default SleepScreen;
