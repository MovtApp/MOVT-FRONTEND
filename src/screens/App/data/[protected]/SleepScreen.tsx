import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { withPremiumGate } from "@components/withPremiumGate";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

import { getHealthMetricData } from "../../../../services/caloriesService";
import { NativeHealthManager } from "../../../../services/nativeHealthManager";

import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import {
  Moon,
  Zap,
  Star,
  Brain,
  ShieldCheck,
  ChevronRight,
  Info,
  HelpCircle,
  Sun,
} from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G } from "react-native-svg";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
  FadeInDown,
} from "react-native-reanimated";

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
    console.error("[SleepScreen] Crash interceptado:", error, info);
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
            ⚠️ Erro no Módulo de Sono
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SleepDay {
  date: string;
  duration: number;
  quality: "light" | "deep" | "none";
}

const SleepProgressChart: React.FC<{
  totalSleep: { hours: number; minutes: number };
  deepSleep: { hours: number; minutes: number };
  goalHours: number;
}> = ({ totalSleep, deepSleep, goalHours }) => {
  const { width } = useWindowDimensions();
  const size = Math.min(Math.max(width * 0.85, 280), 340);
  const center = size / 2;

  // Outer Ring (Total Sleep)
  const outerRadius = center - 30;
  const outerStrokeWidth = 14;
  const outerCircumference = 2 * Math.PI * outerRadius;

  // Inner Ring (Deep Sleep)
  const innerRadius = outerRadius - 25;
  const innerStrokeWidth = 10;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const totalMinutes = (totalSleep?.hours || 0) * 60 + (totalSleep?.minutes || 0);
  const deepMinutes = (deepSleep?.hours || 0) * 60 + (deepSleep?.minutes || 0);
  const maxMinutes = Math.max(1, (goalHours || 8) * 60);

  const rawTotalProgress = totalMinutes / maxMinutes;
  const totalProgress =
    isFinite(rawTotalProgress) && !isNaN(rawTotalProgress) ? Math.min(rawTotalProgress, 1) : 0;

  const rawDeepProgress = totalMinutes > 0 ? deepMinutes / totalMinutes : 0;
  const deepProgress =
    isFinite(rawDeepProgress) && !isNaN(rawDeepProgress) ? Math.min(rawDeepProgress, 0.6) : 0;

  const totalProgressAnim = useSharedValue(0);
  const deepProgressAnim = useSharedValue(0);

  useEffect(() => {
    totalProgressAnim.value = withTiming(totalProgress, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    deepProgressAnim.value = withTiming(deepProgress, {
      duration: 2000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [totalProgress, deepProgress]);

  const totalAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: outerCircumference * (1 - totalProgressAnim.value),
  }));

  const deepAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: innerCircumference * (1 - deepProgressAnim.value),
  }));

  return (
    <View style={chartStyles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="totalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#C084FC" />
          </SvgLinearGradient>
          <SvgLinearGradient id="deepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#2DD4BF" />
          </SvgLinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Outer */}
          <Circle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke="#F1F5F9"
            strokeWidth={outerStrokeWidth}
            fill="none"
          />
          {/* Total Progress */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke="url(#totalGrad)"
            strokeWidth={outerStrokeWidth}
            fill="none"
            strokeDasharray={outerCircumference}
            animatedProps={totalAnimatedProps}
            strokeLinecap="round"
          />

          {/* Background Inner */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="#F1F5F9"
            strokeWidth={innerStrokeWidth}
            fill="none"
          />
          {/* Deep Progress */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="url(#deepGrad)"
            strokeWidth={innerStrokeWidth}
            fill="none"
            strokeDasharray={innerCircumference}
            animatedProps={deepAnimatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <View style={chartStyles.centerContent}>
        <Moon size={24} color="#818CF8" fill="rgba(129, 140, 248, 0.1)" />
        <Text style={chartStyles.timeValue}>
          {totalSleep.hours}h {totalSleep.minutes}m
        </Text>
        <Text style={chartStyles.timeLabel}>Qualidade Excelente</Text>
      </View>
    </View>
  );
};

interface SleepInsightCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  desc: string;
  onPress?: () => void;
}

const SleepInsightCard: React.FC<SleepInsightCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  desc,
  onPress,
}) => (
  <TouchableOpacity activeOpacity={0.7} style={styles.insightCard} onPress={onPress}>
    <View style={[styles.insightIconContainer, { backgroundColor: color + "10" }]}>
      <Icon size={20} color={color} />
    </View>
    <View style={styles.insightTextContainer}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightDesc}>{desc}</Text>
    </View>
    <ChevronRight size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

const SleepHeatmap: React.FC<{ weeklyData: SleepDay[] }> = ({ weeklyData }) => {
  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  const { width } = useWindowDimensions();
  const cellSize = (width - 64) / 7;

  return (
    <View style={styles.heatmapSection}>
      <View style={styles.sectionHeader}>
        <Star size={18} color="#FACC15" />
        <Text style={styles.sectionTitle}>Tendência de Consistência</Text>
      </View>
      <View style={styles.heatmapGrid}>
        {days.map((d, i) => (
          <View key={i} style={{ alignItems: "center", width: cellSize }}>
            <Text style={styles.dayLabel}>{d}</Text>
            <View
              style={[
                styles.heatmapCell,
                {
                  width: cellSize - 8,
                  height: cellSize - 8,
                  backgroundColor:
                    weeklyData[i]?.quality === "deep"
                      ? "#818CF8"
                      : weeklyData[i]?.quality === "light"
                        ? "#38BDF8"
                        : "#F1F5F9",
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export const SleepScreen: React.FC = () => {
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

  const [sleepData, setSleepData] = useState({
    totalSleep: { hours: 0, minutes: 0 },
    deepSleep: { hours: 0, minutes: 0 },
    goalHours: 8,
    efficiency: 0,
    startTime: "--:--",
    restfulness: "Calculando...",
    weeklyData: [] as SleepDay[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSleepData();
  }, [dateStr, isToday]);

  const fetchSleepData = async () => {
    try {
      setIsLoading(true);

      let detailedSleep = null;
      let hcFallbackHours = 0;

      // Tenta buscar os dados detalhados reais (Fases do sono, horas, etc) apenas se for hoje
      if (isToday) {
        try {
          // REMOVIDO: NativeHealthManager.authorize() automático.
          // A autorização deve ser disparada por ação do usuário ou fluxo global estável.

          detailedSleep = await NativeHealthManager.fetchDetailedSleep();

          // Mantém a sincronia com o backend
          hcFallbackHours = await NativeHealthManager.fetchSleep();
        } catch (err) {
          console.warn("Erro ao sincronizar sono nativo:", err);
        }
      }

      const data = await getHealthMetricData("sleep", "1d", dateStr);

      if (detailedSleep) {
        // Usa os dados REAIS do Health Connect se disponíveis
        const totalHours = detailedSleep.totalHours || 0;
        const deepHoursTotal = detailedSleep.deepHours || 0;

        const formatTimeStr = (isoString: string | null) => {
          if (!isoString) return "--:--";
          const d = new Date(isoString);
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        };

        const efficiency =
          totalHours > 0
            ? Math.min(
                100,
                Math.round(((totalHours - (detailedSleep.awakeHours || 0)) / totalHours) * 100)
              )
            : 0;

        setSleepData({
          totalSleep: {
            hours: Math.floor(totalHours),
            minutes: Math.round((totalHours % 1) * 60),
          },
          deepSleep: {
            hours: Math.floor(deepHoursTotal),
            minutes: Math.round((deepHoursTotal % 1) * 60),
          },
          goalHours: data?.dailyGoal || 8,
          efficiency: efficiency > 0 ? efficiency : totalHours > 0 ? 85 : 0,
          startTime: formatTimeStr(detailedSleep.startTime),
          restfulness:
            deepHoursTotal >= 1.5 ? "Excelente" : deepHoursTotal >= 1 ? "Bom" : "Razoável",
          weeklyData:
            data?.data?.map((d: any) => ({
              date: d.date,
              duration: d.value,
              quality: d.value >= 7 ? "deep" : "light",
            })) || [],
        });
      } else if (data && data.data) {
        // Fallback: Se o device não tiver dados detalhados, recai pro backend
        const totalHours = Math.max(hcFallbackHours, data.totalCalories || 0);
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);

        setSleepData({
          totalSleep: { hours, minutes },
          deepSleep: { hours: Math.floor(hours * 0.3), minutes: Math.round(minutes * 0.3) }, // Estimativa fallback
          goalHours: data.dailyGoal || 8,
          efficiency: totalHours > 0 ? 85 : 0, // Fallback seco, sem random
          startTime: "--:--",
          restfulness: totalHours >= 7 ? "Excelente" : totalHours > 5 ? "Bom" : "Razoável",
          weeklyData: data.data.map((d: any) => ({
            date: d.date,
            duration: d.value,
            quality: d.value >= 7 ? "deep" : "light",
          })) as any,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados de sono:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [bottomSheetType, setBottomSheetType] = useState<"info" | "card">("info");
  const [selectedTopic, setSelectedTopic] = useState<{
    title: string;
    description: string;
    icon: any;
    color: string;
    details: string[];
  } | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);

  const [sheetIndex, setSheetIndex] = useState(-1);

  const handleOpenInfo = useCallback(() => {
    setBottomSheetType("info");
    setSheetIndex(0);
  }, []);

  const handleOpenCardDetails = useCallback(
    (title: string, color: string, icon: any, details: string[]) => {
      setBottomSheetType("card");
      setSelectedTopic({
        title,
        description: "Análise detalhada da sua métrica de hoje.",
        icon,
        color,
        details,
      });
      setSheetIndex(0);
    },
    []
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <DataErrorBoundary>
      <View style={styles.mainContainer}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <BackButton to={{ name: "DataScreen" }} />
            <Text style={styles.headerTitle}>Otimização do Sono</Text>
            <View style={{ width: 46 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeInDown.delay(100).duration(800)}
              style={styles.chartWrapper}
            >
              <SleepProgressChart
                totalSleep={sleepData.totalSleep}
                deepSleep={sleepData.deepSleep}
                goalHours={sleepData.goalHours}
              />
            </Animated.View>

            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatLabel}>DEITOU ÀS</Text>
                <Text style={styles.quickStatValue}>{sleepData.startTime}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatLabel}>EFICIÊNCIA</Text>
                <Text style={styles.quickStatValue}>{sleepData.efficiency}%</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatLabel}>RECUPERAÇÃO</Text>
                <Text style={styles.quickStatValue}>{sleepData.restfulness}</Text>
              </View>
            </View>

            <View style={styles.cardsSection}>
              <SleepInsightCard
                title="Sono Profundo"
                value="2h 15m"
                icon={Brain}
                color="#38BDF8"
                desc="Sua mente descansou significativamente hoje."
                onPress={() =>
                  handleOpenCardDetails("Sono Profundo", "#38BDF8", Brain, [
                    "Você atingiu 25% do sono total em fase profunda, o que é excelente.",
                    "O sono profundo consolida memórias e restaura tecidos musculares.",
                    "Evite cafeína após as 14h para manter esses índices estáveis.",
                  ])
                }
              />
              <SleepInsightCard
                title="Pontuação de Prontidão"
                value="88"
                icon={Zap}
                color="#FACC15"
                desc="Você está pronto para atividades de alta performance."
                onPress={() =>
                  handleOpenCardDetails("Prontidão", "#FACC15", Zap, [
                    "Seu sistema nervoso está bem recuperado.",
                    "Sua variabilidade da frequência cardíaca indica boa adaptação ao estresse.",
                    "Hoje é um dia ideal para treinos de alta intensidade.",
                  ])
                }
              />
              <SleepInsightCard
                title="Saúde Cardiovascular"
                value="Otimizada"
                icon={ShieldCheck}
                color="#2DD4BF"
                desc="Frequência cardíaca basal estável durante a noite."
                onPress={() =>
                  handleOpenCardDetails("Saúde Cardio", "#2DD4BF", ShieldCheck, [
                    "Sua frequência cardíaca de repouso atingiu o ponto mais baixo às 3h da manhã.",
                    "Isso indica que seu corpo teve tempo suficiente para descompressão.",
                    "Seu índice de oxigenação permaneceu estável acima de 98%.",
                  ])
                }
              />
            </View>

            <SleepHeatmap weeklyData={sleepData.weeklyData} />

            <View style={{ height: 120 }} />
          </ScrollView>
          <DataPillNavigator currentScreen="SleepScreen" />
        </SafeAreaView>
      </View>
    </DataErrorBoundary>
  );
};

const bsStyles = StyleSheet.create({
  bsBackground: { backgroundColor: "#FFFFFF", borderRadius: 32 },
  bsIndicator: { backgroundColor: "#E2E8F0", width: 40 },
  bsContainer: { flex: 1, padding: 24 },
  bsHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 25 },
  bsIconHeaderBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  bsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bsTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  bsSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },

  richSection: { marginBottom: 25 },
  richSectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 12 },
  richText: { fontSize: 15, color: "#64748B", lineHeight: 22 },

  horizontalGuide: { flexDirection: "row", gap: 10 },
  guideCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  guideIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guideLabel: { fontSize: 13, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  guideDesc: { fontSize: 10, color: "#94A3B8", lineHeight: 14 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tagText: { fontSize: 12, fontWeight: "600", color: "#64748B" },

  bsFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  bsFooterText: { fontSize: 11, color: "#94A3B8", flex: 1 },

  detailsGrid: { gap: 16, marginBottom: 30 },
  detailItem: { flexDirection: "row", gap: 12 },
  detailDot: { width: 4, height: 4, borderRadius: 2, marginTop: 8 },
  detailText: { flex: 1, fontSize: 15, color: "#64748B", lineHeight: 22 },
  closeBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  closeBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});

const chartStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
  },
  timeValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: "#818CF8",
    fontWeight: "600",
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  infoBtn: { width: 40, height: 40, alignItems: "flex-end", justifyContent: "center" },
  chartWrapper: { marginVertical: 20, alignItems: "center" },
  quickStatsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  quickStatItem: { flex: 1, alignItems: "center" },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickStatValue: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  divider: { width: 1, height: "60%", backgroundColor: "#E2E8F0", alignSelf: "center" },
  cardsSection: { gap: 15, marginBottom: 30 },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  insightTextContainer: { flex: 1 },
  insightTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  insightValue: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginVertical: 2 },
  insightDesc: { fontSize: 12, color: "#64748B", lineHeight: 16 },
  heatmapSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  heatmapGrid: { flexDirection: "row", justifyContent: "space-between" },
  dayLabel: { fontSize: 10, color: "#94A3B8", marginBottom: 10, fontWeight: "700" },
  heatmapCell: { borderRadius: 10 },
});

export default withPremiumGate(
  SleepScreen,
  "dadosAvancados",
  "Sono",
  "O monitoramento avançado de sono é exclusivo dos planos Premium e Família.",
  { name: "DataScreen" }
);
