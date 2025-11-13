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
import { Flame, MapPin, Clock, Footprints } from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from "react-native-svg";
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

const StepsProgressChart: React.FC<{ 
  progress: number;
  steps: number;
}> = ({ progress, steps }) => {
  const { width } = useWindowDimensions();
  const size = Math.min(Math.max(width * 0.85, 260), 340);
  const center = size / 2;
  const radius = center - 40;
  const circumference = 2 * Math.PI * radius;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const orangeProgress = 0.65;

  const innerAnim = useSharedValue(0);
  const orangeAnim = useSharedValue(0);

  useEffect(() => {
    innerAnim.value = withTiming(clampedProgress, { 
      duration: 1200, 
      easing: Easing.out(Easing.cubic) 
    });
    orangeAnim.value = withTiming(orangeProgress, { 
      duration: 1200, 
      easing: Easing.out(Easing.cubic) 
    });
  }, [clampedProgress]);

  const innerProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - innerAnim.value),
  }));

  const orangeProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - orangeAnim.value),
  }));

  return (
    <View style={{ alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#2563EB" />
          </LinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#393C43"
            strokeWidth={22}
            fill="none"
          />

          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F97316"
            strokeWidth={18}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={orangeProps}
            strokeLinecap="round"
          />

          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#blueGrad)"
            strokeWidth={14}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={innerProps}
            strokeLinecap="round"
          />
        </G>

        <Circle cx={center} cy={center} r={50} fill="#FFFFFF" />
      </Svg>

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
        <Footprints size={32} color="#2563EB" />
        <View style={{ height: 4 }} />
        <Text
          style={{
            fontSize: 28,
            fontWeight: "600",
            color: "#1A1A1A",
          }}
        >
          {steps.toLocaleString("pt-BR")}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#666666",
            marginTop: 2,
            fontWeight: "bold"
          }}
        >
          Total de passos
        </Text>
      </View>
    </View>
  );
};

const StepsScreen: React.FC = () => {
  // Dados mockados - substituir por dados reais quando disponível
  const [stepsData] = useState({
    steps: 140,
    goal: 10000,
    calories: 100,
    kilometers: 7.8,
    minutes: 25,
  });

  // Calcular progresso (0 a 1)
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
            <BackButton />
            <Text style={styles.headerTitle}>Passos</Text>
            <View style={{ width: 46 }} />
          </View>

          {/* Gráfico de Progresso */}
          <View style={styles.chartContainer}>
            <StepsProgressChart progress={progress} steps={stepsData.steps} />
          </View>

          {/* Contador de Passos */}
          <View style={styles.stepsCounterContainer}>
            <Text style={styles.stepsValue}>
              {stepsData.steps.toLocaleString("pt-BR")}
            </Text>
            <Text style={styles.stepsLabel}>Total de passos</Text>
          </View>

          {/* Cartões de Métricas */}
          <View style={styles.metricsContainer}>
            {/* Card Kcal */}
            <View style={[styles.metricCard]}>
              <View style={styles.metricIconContainerKcal}>
                <Flame size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{stepsData.calories}</Text>
              <Text style={styles.metricUnit}>Kcal</Text>
            </View>

            {/* Card Kilometro */}
            <View style={[styles.metricCard]}>
              <View style={styles.metricIconContainerKm}>
                <MapPin size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{stepsData.kilometers.toFixed(1)}</Text>
              <Text style={styles.metricUnit}>Kilometro</Text>
            </View>

            {/* Card Minutos */}
            <View style={[styles.metricCard]}>
              <View style={styles.metricIconContainerMinutes}>
                <Clock size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{stepsData.minutes}</Text>
              <Text style={styles.metricUnit}>Minutos</Text>
            </View>
          </View>

          {/* Espaço para não ficar coberto pelas setas */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Setas de navegação */}
        <NavigationArrows currentScreen="StepsScreen" screens={DATA_SCREENS} />
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
    paddingHorizontal: 20,
  },
  stepsCounterContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  stepsValue: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#192126",
  },
  stepsLabel: {
    fontSize: 22,
    color: "#797E86",
    fontWeight: "bold"
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 30,
    alignSelf: "center",
    width: "100%",
    maxWidth: 320, // controla a largura total, mantendo tudo centralizado
  },
  metricCard: {
    width: "30%", // ocupa apenas 30% da largura do container limitado
    minWidth: 90,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F8F9FB",
    alignItems: "center",
  },
  metricIconContainerKcal: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricIconContainerKm: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricIconContainerMinutes: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#393C43",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#192126",
    marginTop: 6,
    textAlign: "center",
  },
  metricUnit: {
    fontSize: 16,
    color: "#797E86",
    marginTop: 2,
    textAlign: "center",
    fontWeight: "bold"
  },
});

export default StepsScreen;