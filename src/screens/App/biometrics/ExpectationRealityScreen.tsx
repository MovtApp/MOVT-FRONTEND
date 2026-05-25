import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Flame,
  Heart,
  Droplets,
  Moon,
  Zap,
  Footprints,
  Scale,
  Activity,
  ChevronRight,
  Info,
  Sparkles,
  TrendingUp,
  Brain,
  Layers,
  Dumbbell,
  Target,
  ShieldCheck,
  HelpCircle,
  Clock,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../contexts/AuthContext";
import { useHealthTracking } from "../../../hooks/useHealthTracking";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import BackButton from "../../../components/BackButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";

const { width } = Dimensions.get("window");

const EXPLANATIONS = {
  kinetic: {
    title: "Cinética de Resultados",
    icon: <Brain size={32} color="#BBF246" />,
    text: "Seu corpo é como um super-carro! Quando você se mexe e brinca muito, o seu motor fica cada vez mais forte e aprende a usar o 'combustível' (comida) do jeito certo para você nunca ficar cansado.",
  },
  fat: {
    title: "Gordura Corporal",
    icon: <Layers size={32} color="#FF8C00" />,
    text: "Pense na gordura como uma 'mochila de lanchinhos' que seu corpo guarda. É bom ter um pouco para ter energia, mas se a mochila ficar muito pesada, fica difícil de correr e pular. Queremos a mochila no peso ideal!",
  },
  muscle: {
    title: "Massa Muscular",
    icon: <Dumbbell size={32} color="#1E293B" />,
    text: "Estes são os seus 'super-tijolinhos' de força! Quanto mais tijolinhos você tem, mais forte é o seu castelo (seu corpo). Com muitos tijolinhos, você consegue carregar coisas pesadas e ter muita força nos braços e pernas.",
  },
  method: {
    title: "Método de Coleta",
    icon: <Target size={32} color="#3B82F6" />,
    text: "Usamos uma 'lupa mágica' ou uma balança especial que consegue ver através da pele para contar quantos tijolinhos e quantos lanchinhos você tem guardados lá dentro. É como um raio-x da sua força!",
  },
  protocol: {
    title: "Guia de Avaliação",
    icon: <Target size={32} color="#BBF246" />,
    text: "Para resultados precisos como um relógio suíço, siga os passos do Guia MOVT.",
  },
};

const ExpectationRealityScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<"expectation" | "reality">("expectation");

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeExplanation, setActiveExplanation] = useState<keyof typeof EXPLANATIONS | null>(
    null
  );
  const snapPoints = useMemo(() => ["60%", "85%"], []);
  const [sheetIndex, setSheetIndex] = useState(-1);

  const openExplanation = (type: keyof typeof EXPLANATIONS) => {
    setActiveExplanation(type);
    if (type === "protocol") {
      setSheetIndex(1);
    } else {
      setSheetIndex(0);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const health = useHealthTracking();
  const [biometrics, setBiometrics] = useState({
    weight: 82.5,
    height: 1.75,
    fat: 12,
    muscle: 55,
  });

  useEffect(() => {
    const loadBiometrics = async () => {
      try {
        const saved = await AsyncStorage.getItem(`@MOVT:biometrics:${user?.id}`);
        if (saved) {
          setBiometrics(JSON.parse(saved));
        } else if ((user as any)?.weight) {
          setBiometrics({
            weight: (user as any).weight || 82.5,
            height: (user as any).height || 1.75,
            fat: (user as any).fat_percentage || 12,
            muscle: (user as any).muscle_percentage || 55,
          });
        }
      } catch (e) {
        console.error("Erro ao carregar biometria:", e);
      }
    };
    loadBiometrics();
  }, [user]);

  const headerMarginTop = Platform.OS === "android" ? (insets.top > 0 ? insets.top + 20 : 40) : 0;

  const calculateIMC = (w: number, h: number) => (h ? parseFloat((w / (h * h)).toFixed(1)) : 0);

  const getIMCClassification = (imc: number) => {
    if (imc < 18.5) return { label: "Baixo Peso", color: "#60A5FA" };
    if (imc <= 24.9) return { label: "Peso Normal", color: "#10B981" };
    if (imc <= 29.9) return { label: "Sobrepeso", color: "#F59E0B" };
    return { label: "Obesidade I", color: "#EF4444" };
  };

  const stats = useMemo(() => {
    const realityIMC = calculateIMC(biometrics.weight, biometrics.height);
    const expectationWeight = biometrics.weight * 0.95;
    const expectationIMC = calculateIMC(expectationWeight, biometrics.height);

    return {
      expectation: {
        kcal: 500,
        bpm: 70,
        water: 2000,
        sleep: "8h",
        activityPoints: 35.0,
        steps: "10.000",
        weight: parseFloat(expectationWeight.toFixed(1)),
        fat: "10%",
        muscle: "58%",
        bmi: expectationIMC,
        bmiInfo: getIMCClassification(expectationIMC),
      },
      reality: {
        kcal: Math.round(health.dailyCalories),
        bpm: health.heartRate || 75,
        water: health.waterConsumedMl,
        sleep: `${health.sleepHours}h${health.sleepMinutes > 0 ? health.sleepMinutes : ""}`,
        activityPoints: parseFloat(
          (health.dailyCalories / 20 + health.stepsToday / 1000).toFixed(1)
        ),
        steps: health.stepsToday.toLocaleString("pt-BR"),
        weight: biometrics.weight,
        fat: `${biometrics.fat}%`,
        muscle: `${biometrics.muscle}%`,
        bmi: realityIMC,
        bmiInfo: getIMCClassification(realityIMC),
      },
    };
  }, [health, biometrics]);

  const currentStats = stats[viewMode];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={[styles.header, { marginTop: headerMarginTop }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "expectation" && styles.toggleBtnActive]}
            onPress={() => {
              console.log("Button pressed: Expectation");
              setViewMode("expectation");
            }}
          >
            <Text
              style={[styles.toggleText, viewMode === "expectation" && styles.toggleTextActive]}
            >
              Expectativa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "reality" && styles.toggleBtnActive]}
            onPress={() => {
              console.log("Button pressed: Reality");
              setViewMode("reality");
            }}
          >
            <Text style={[styles.toggleText, viewMode === "reality" && styles.toggleTextActive]}>
              Realidade
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.anatomySection}>
          <View style={styles.leftStats}>
            <StatItem
              icon={<Flame size={18} color="#FF8C00" />}
              value={currentStats.kcal}
              unit="kcal"
              color="#FF8C00"
            />
            <StatItem
              icon={<Droplets size={18} color="#0EA5E9" />}
              value={currentStats.water}
              unit="ml"
              color="#0EA5E9"
              marginTop={40}
            />
            <StatItem
              icon={<Zap size={18} color="#BBF246" />}
              value={currentStats.activityPoints}
              unit="pt"
              color="#BBF246"
              marginTop={40}
            />
          </View>
          <Animated.View entering={FadeIn.duration(800)} style={styles.imageContainer}>
            <Image
              source={require("../../../assets/muscle_anatomy_body_v2.png")}
              style={styles.anatomyImage}
              resizeMode="contain"
            />
          </Animated.View>
          <View style={styles.rightStats}>
            <StatItem
              icon={<Heart size={18} color="#EF4444" />}
              value={currentStats.bpm}
              unit="bpm"
              color="#EF4444"
              align="right"
            />
            <StatItem
              icon={<Moon size={18} color="#6366F1" />}
              value={currentStats.sleep}
              unit=""
              color="#6366F1"
              marginTop={40}
              align="right"
            />
            <StatItem
              icon={<Footprints size={18} color="#1E293B" />}
              value={currentStats.steps}
              unit=""
              color="#1E293B"
              marginTop={40}
              align="right"
            />
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.weightContainer}>
          <View style={styles.weightLabelRow}>
            <Scale size={24} color="#1E293B" />
            <Text style={styles.weightValue}>{currentStats.weight}</Text>
            <Text style={styles.weightUnit}>kg</Text>
          </View>
          <View style={styles.bmiWrapper}>
            <View style={[styles.bmiBadge, { backgroundColor: currentStats.bmiInfo.color }]}>
              <Text style={styles.bmiText}>IMC: {currentStats.bmi}</Text>
            </View>
            <Text style={styles.bmiClassification}>{currentStats.bmiInfo.label}</Text>
          </View>
        </Animated.View>

        <View style={styles.metricsRow}>
          <MetricCard
            icon={<Flame size={20} color="#fff" />}
            value={currentStats.fat}
            label="Gordura"
            bgColor="#FF8C00"
            delay={300}
            onPress={() => openExplanation("fat")}
          />
          <MetricCard
            icon={<Activity size={20} color="#fff" />}
            value={currentStats.muscle}
            label="Massa M."
            bgColor="#1E293B"
            delay={400}
            onPress={() => openExplanation("muscle")}
          />
          <MetricCard
            icon={<Info size={20} color="#fff" />}
            value={viewMode === "reality" ? "BIA" : "Target"}
            label="Método"
            bgColor="#3B82F6"
            delay={500}
            onPress={() => openExplanation("method")}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.physiologistCard}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => openExplanation("kinetic")}>
            <LinearGradient colors={["#1E293B", "#0F172A"]} style={styles.physiologistGradient}>
              <View style={styles.physHeader}>
                <View style={styles.physBadge}>
                  <Sparkles size={14} color="#BBF246" />
                  <Text style={styles.physBadgeText}>FISIOLOGISTA DIGITAL</Text>
                </View>
                <TrendingUp size={18} color="#BBF246" />
              </View>
              <Text style={styles.physTitle}>Cinética de Resultados</Text>
              <Text style={styles.physDescription}>
                {viewMode === "reality"
                  ? health.stepsToday > 5000
                    ? "Seu volume de passos atual sugere uma oxidação lipídica eficiente."
                    : "Aumento na atividade motora detectada."
                  : "Sua meta está alinhada com o protocolo Pollock 3."}
              </Text>
              <View style={styles.clickHint}>
                <Text style={styles.clickHintText}>Clique para entender</Text>
                <ChevronRight size={12} color="#BBF246" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.protocolFooter} onPress={() => openExplanation("protocol")}>
          <Clock size={16} color="#94A3B8" />
          <Text style={styles.protocolFooterText}>Ver recomendações de coleta (Guia MOVT)</Text>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({ icon, value, unit, color, marginTop = 0, align = "left" }: any) => (
  <View
    style={[
      styles.statItem,
      { marginTop, alignItems: align === "left" ? "flex-start" : "flex-end" },
    ]}
  >
    <View style={styles.statHeader}>
      {align === "left" ? icon : null}
      <Text style={[styles.statValue, { color: "#1E293B" }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      {align === "right" ? icon : null}
    </View>
  </View>
);

const MetricCard = ({ icon, value, label, bgColor, delay, onPress }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.metricCardWrap}>
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.metricCardInner}>
      <View style={[styles.metricIconBox, { backgroundColor: bgColor }]}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </TouchableOpacity>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 2,
    flex: 1,
    marginHorizontal: 20,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  toggleTextActive: { color: "#1E293B", fontWeight: "900" },
  infoBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingBottom: 40, alignItems: "center" },
  physiologistCard: {
    width: width - 40,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 50,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  physiologistGradient: { padding: 20 },
  physHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  physBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(187, 242, 70, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  physBadgeText: { color: "#BBF246", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  physTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginBottom: 4 },
  physDescription: { color: "#94A3B8", fontSize: 13, lineHeight: 18, fontWeight: "500" },
  clickHint: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 4 },
  clickHintText: { color: "#BBF246", fontSize: 11, fontWeight: "700" },
  anatomySection: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 400,
    marginTop: -30,
  },
  imageContainer: {
    width: width * 0.45,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  anatomyImage: { width: "100%", height: "100%" },
  leftStats: { paddingLeft: 20, flex: 1 },
  rightStats: { paddingRight: 20, flex: 1 },
  statItem: { width: "100%" },
  statHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "900" },
  statUnit: { fontSize: 12, color: "#64748B", fontWeight: "700", marginTop: 6 },
  weightContainer: { alignItems: "center", marginTop: -30 },
  weightLabelRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  weightValue: { fontSize: 56, fontWeight: "900", color: "#1E293B" },
  weightUnit: { fontSize: 20, color: "#64748B", fontWeight: "700", marginTop: 20 },
  bmiWrapper: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: -4 },
  bmiBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bmiText: { color: "#FFF", fontWeight: "900", fontSize: 14 },
  bmiClassification: { fontSize: 16, color: "#94A3B8", fontWeight: "800" },
  metricsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: 40,
  },
  metricCardWrap: { flex: 1 },
  metricCardInner: { alignItems: "center" },
  metricIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: { fontSize: 22, fontWeight: "900", color: "#1E293B", marginTop: 12 },
  metricLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "700", marginTop: -2 },
  protocolFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    gap: 10,
    marginBottom: 30,
  },
  protocolFooterText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    flex: 1,
    marginLeft: 10,
  },
  sheetContent: { flex: 1, paddingHorizontal: 24, paddingVertical: 10 },
  // Results Pattern Styles
  bsView: { flex: 1 },
  bsHeader: { flexDirection: "row", alignItems: "center", gap: 15, marginBottom: 25 },
  bsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  bsTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  bsSubtitle: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  bsSection: { marginBottom: 25 },
  bsSectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bsText: { fontSize: 14, color: "#475569", lineHeight: 22, fontWeight: "500" },
  metricGuideHorizontal: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  metricCardBS: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricIconBoxBS: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricLabelCard: { fontSize: 12, fontWeight: "900", color: "#1E293B", marginBottom: 2 },
  metricDescCard: { fontSize: 10, color: "#94A3B8", fontWeight: "600", lineHeight: 14 },
  tagsContainerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagTextCompact: { fontSize: 11, fontWeight: "800", color: "#475569" },
  bsFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 15,
    marginBottom: 10,
  },
  bsFooterText: { fontSize: 11, color: "#94A3B8", fontWeight: "600", flex: 1 },
  // Original Explanation Styles
  explanationContainer: { alignItems: "center", paddingTop: 20 },
  explanationIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  explanationTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B", marginBottom: 20 },
  explanationBubble: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  explanationText: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  closeSheetBtn: {
    backgroundColor: "#BBF246",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 120,
  },
  closeSheetBtnText: { color: "#1E293B", fontSize: 16, fontWeight: "900" },
});

export default ExpectationRealityScreen;
