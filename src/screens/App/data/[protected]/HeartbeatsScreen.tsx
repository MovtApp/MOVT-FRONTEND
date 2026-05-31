import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import {
  Activity,
  Wind,
  Watch,
  Wifi,
  AlertTriangle,
  Heart,
  ChevronRight,
} from "lucide-react-native";
import { SvgXml } from "react-native-svg";
import { Asset } from "expo-asset";
import { useAuth } from "../../../../contexts/AuthContext";
import ECGDisplay from "../../../../components/ECGDisplay";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { NativeHealthManager } from "../../../../services/nativeHealthManager";
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
    console.error("[HeartbeatsScreen] Crash interceptado:", error, info);
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
            ⚠️ Erro no Módulo de Batimentos
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

// Fallback seguro para ReanimatedView
const ReanimatedView = Animated ? Animated.View : View;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Dimensões originais do SVG (do arquivo running.svg)
const SVG_ORIGINAL_WIDTH = 390;
const SVG_ORIGINAL_HEIGHT = 796;
const SVG_ASPECT_RATIO = SVG_ORIGINAL_HEIGHT / SVG_ORIGINAL_WIDTH;

const calculateSvgDimensions = (screenWidth: number, screenHeight: number) => {
  let svgDisplayWidth = screenWidth;
  let svgDisplayHeight = screenWidth * SVG_ASPECT_RATIO;
  const maxHeight = screenHeight * 0.8;
  if (svgDisplayHeight > maxHeight) {
    svgDisplayHeight = maxHeight;
    svgDisplayWidth = svgDisplayHeight / SVG_ASPECT_RATIO;
  }
  return { width: svgDisplayWidth, height: svgDisplayHeight };
};

const HeartbeatsScreen: React.FC = () => {
  const { user } = useAuth();
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

  // Estados
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [oxygen, setOxygen] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error" | "simulation"
  >("disconnected");
  const [connectionMessage, setConnectionMessage] = useState<string>("Buscando...");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  const scale = useSharedValue(1);

  // Animação de pulsação suave
  useEffect(() => {
    if (connectionStatus === "connected") {
      scale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 400 }), withTiming(1, { duration: 600 })),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [connectionStatus]);

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const svgDimensions = useMemo(() => calculateSvgDimensions(SCREEN_WIDTH, SCREEN_HEIGHT), []);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const svgModule = require("../../../../assets/running.svg");
        // Tentativa silenciosa de carregar o asset
        if (typeof svgModule === "number") {
          const asset = Asset.fromModule(svgModule);
          await asset.downloadAsync();
          if (asset.localUri) {
            const response = await fetch(asset.localUri);
            const text = await response.text();
            setSvgContent(text);
          }
        }
      } catch (error) {
        // Silencia erro de SVG para evitar poluição no console
      }
    };
    loadSvg();
  }, []);

  // Iniciar checagem de autorização nativa ao abrir a tela
  useEffect(() => {
    const checkNativeConnection = async () => {
      setIsLoading(true);
      // Primeiro, tenta buscar histórico do nosso backend
      try {
        const [hrData, oxyData] = await Promise.all([
          getHealthMetricData("heartrate", "1d", dateStr),
          getHealthMetricData("oxygen", "1d", dateStr),
        ]);

        if (hrData && hrData.totalCalories) setHeartRate(hrData.totalCalories);
        if (oxyData && oxyData.totalCalories) setOxygen(oxyData.totalCalories);
      } catch (error) {
        console.error("Erro ao buscar histórico do backend:", error);
      }

      // REMOVIDO: NativeHealthManager.authorize() automático.
      // O usuário deve clicar no botão 'Conectar' para autorizar manualmente.

      setIsLoading(false);
    };
    checkNativeConnection();
  }, [user?.id, dateStr]);

  // Handle subscription to heart rate if authorized and isToday
  useEffect(() => {
    if (!isAuthorized || !isToday) return;

    const cancelSubscription = NativeHealthManager.subscribeHeartRate((bpm) => {
      if (typeof bpm === "number" && !isNaN(bpm) && isFinite(bpm)) {
        setHeartRate(bpm);
        try {
          setLastUpdate(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } catch (e) {
          const d = new Date();
          setLastUpdate(
            `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
          );
        }
      }
    });

    return () => cancelSubscription();
  }, [isAuthorized, isToday]);

  // Conecta o relógio via agregador nativo da plataforma:
  // Health Connect (Android) ou Apple HealthKit (iOS). NativeHealthManager
  // resolve a plataforma internamente. Sem caminho Bluetooth direto.
  const platformHealthName =
    Platform.OS === "ios" ? "Apple Saúde (HealthKit)" : "Google Health Connect";

  const handleConnectDevice = async () => {
    setConnectionStatus("connecting");
    setConnectionMessage("Autorizando conexão...");
    try {
      const success = await NativeHealthManager.authorize();
      if (success) {
        setIsAuthorized(true);
        setConnectionStatus("connected");
        setConnectionMessage(`Conectado via ${platformHealthName}`);
        Alert.alert("Sucesso", `Conectado ao ${platformHealthName} com sucesso.`);
      } else {
        setConnectionStatus("error");
        setConnectionMessage("Falha na autorização");
        Alert.alert(
          "Permissão necessária",
          `Para sincronizar os dados do seu relógio, autorize o MOVT no ${platformHealthName}.`
        );
      }
    } catch (err) {
      setConnectionStatus("error");
      setConnectionMessage("Falha na autorização");
      console.error(err);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#10B981";
      case "connecting":
        return "#F59E0B";
      case "simulation":
        return "#6366F1";
      default:
        return "#EF4444";
    }
  };

  return (
    <DataErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          {/* SVG Background */}
          <View pointerEvents="none" style={styles.background}>
            <View
              style={[
                styles.svgContainer,
                { width: svgDimensions.width, height: svgDimensions.height },
              ]}
            >
              {svgContent ? (
                <SvgXml
                  xml={svgContent}
                  width={svgDimensions.width}
                  height={svgDimensions.height}
                />
              ) : null}
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <BackButton to={{ name: "DataScreen" }} />
              <Text style={styles.headerTitle}>Batimentos cardíacos</Text>
              <View style={{ width: 46 }} />
            </View>

            {/* Connection Status Badge */}
            <ReanimatedView
              entering={FadeInDown.delay(100).duration(600)}
              style={styles.statusSection}
            >
              <TouchableOpacity
                style={[styles.statusBadge, { borderColor: getStatusColor() + "40" }]}
                onPress={isToday ? handleConnectDevice : undefined}
                activeOpacity={isToday ? 0.7 : 1}
                disabled={!isToday}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={styles.statusText}>
                  {isToday ? connectionMessage : "Histórico Registrado"}
                </Text>
                {lastUpdate && isToday && <Text style={styles.updateText}>• {lastUpdate}</Text>}
              </TouchableOpacity>
            </ReanimatedView>

            {/* Heart Rate Display */}
            <ReanimatedView
              entering={FadeInDown.delay(300).duration(800)}
              style={styles.heartDisplaySection}
            >
              <ReanimatedView style={[styles.heartIconWrapper, animatedHeartStyle]}>
                <Heart size={32} color="#EF4444" fill="#EF4444" />
              </ReanimatedView>

              <View style={styles.valueContainer}>
                <Text style={styles.bpmValue}>{heartRate ? Math.round(heartRate) : "--"}</Text>
                <Text style={styles.bpmLabel}>BPM</Text>
              </View>

              <View style={styles.ecgWrapper}>
                <ECGDisplay
                  bpm={heartRate}
                  width={SCREEN_WIDTH * 0.7}
                  height={80}
                  responsive={false}
                  isConnected={connectionStatus === "connected"}
                  color="#EF4444"
                />
              </View>
            </ReanimatedView>

            {/* Secondary Metrics */}
            <View style={styles.metricsGrid}>
              <ReanimatedView
                entering={FadeInDown.delay(500).duration(600)}
                style={styles.metricWrapper}
              >
                <LinearGradient colors={["#FFF1F2", "#FFFFFF"]} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.iconBox, { backgroundColor: "#FFE4E6" }]}>
                      <Activity size={20} color="#E11D48" />
                    </View>
                    <Text style={styles.metricTitle}>Pressão</Text>
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{pressure ? Math.round(pressure) : "--"}</Text>
                    <Text style={styles.metricUnit}>mmHg</Text>
                  </View>
                </LinearGradient>
              </ReanimatedView>

              <ReanimatedView
                entering={FadeInDown.delay(700).duration(600)}
                style={styles.metricWrapper}
              >
                <LinearGradient colors={["#F0F9FF", "#FFFFFF"]} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.iconBox, { backgroundColor: "#E0F2FE" }]}>
                      <Wind size={20} color="#0284C7" />
                    </View>
                    <Text style={styles.metricTitle}>Oxigênio</Text>
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{oxygen ? Math.round(oxygen) : "--"}</Text>
                    <Text style={styles.metricUnit}>SpO2</Text>
                  </View>
                </LinearGradient>
              </ReanimatedView>
            </View>

            {/* Info Card */}
            <ReanimatedView entering={FadeInDown.delay(900).duration(600)} style={styles.infoCard}>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  {isToday ? "Status da Conexão" : "Registro Histórico"}
                </Text>
                <Text style={styles.infoSubtitle}>
                  {isToday
                    ? connectionStatus === "connected"
                      ? "Seu relógio está sincronizado diretamente."
                      : "Por favor, autorize a conexão com o Health Connect/HealthKit."
                    : "Os batimentos e oxigênio mostrados acima correspondem a este dia do histórico."}
                </Text>
              </View>

              {connectionStatus === "simulation" && isToday && (
                <View style={styles.simulationWarning}>
                  <AlertTriangle size={16} color="#4338CA" />
                  <Text style={styles.simulationWarningText}>
                    Expo Go detectado. Sensores reais exigem Build de Desenvolvimento.
                  </Text>
                </View>
              )}

              {isToday ? (
                connectionStatus !== "connected" && connectionStatus !== "simulation" ? (
                  <TouchableOpacity style={styles.connectBtnAction} onPress={handleConnectDevice}>
                    <Text style={styles.connectBtnText}>Conectar</Text>
                    <Watch size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.syncBtn} onPress={handleConnectDevice}>
                    <Watch size={18} color="#2563EB" />
                  </TouchableOpacity>
                )
              ) : (
                <View
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: "#F1F5F9",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#475569", fontSize: 12, fontWeight: "bold" }}>
                    Apenas Leitura
                  </Text>
                </View>
              )}
            </ReanimatedView>

            <View style={{ height: 120 }} />
          </ScrollView>

          <DataPillNavigator currentScreen="HeartbeatsScreen" />
        </View>
      </SafeAreaView>
    </DataErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  background: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15, // Mais discreto
  },
  svgContainer: {
    position: "absolute",
    top: -200,
  },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  statusSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  updateText: {
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 4,
  },
  heartDisplaySection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  heartIconWrapper: {
    marginBottom: 10,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  bpmValue: {
    fontSize: 72,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -2,
  },
  bpmLabel: {
    fontSize: 20,
    color: "#94A3B8",
    fontWeight: "600",
    marginLeft: 4,
  },
  ecgWrapper: {
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 40,
  },
  metricWrapper: { flex: 1 },
  metricCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F8FAFC",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  metricContent: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  metricUnit: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
    marginLeft: 2,
  },
  infoCard: {
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
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  syncBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  connectBtnAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  connectBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  simulationWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  simulationWarningText: {
    fontSize: 11,
    color: "#4338CA",
    fontWeight: "600",
    flex: 1,
  },
});

export default HeartbeatsScreen;
