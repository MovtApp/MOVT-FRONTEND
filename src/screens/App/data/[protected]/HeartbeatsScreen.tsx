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
import DeviceSelectorModal from "../../../../components/data/DeviceSelectorModal";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  getLatestWearOsHealthData,
  pollWearOsHealthData,
  getLatestWearOsHealthDataFromAllDevices,
  checkWearOsDeviceRegistered,
} from "../../../../services/wearOsHealthService";

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

  // Estados
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [oxygen, setOxygen] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [connectionMessage, setConnectionMessage] = useState<string>("Buscando...");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [hasWearOsDevice, setHasWearOsDevice] = useState<boolean | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isDeviceModalVisible, setIsDeviceModalVisible] = useState(false);

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

  // Sync Logic (Mantida conforme original)
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      setConnectionStatus("disconnected");
      return;
    }
    const userId = parseInt(user.id, 10);
    if (isNaN(userId)) return;

    if (hasWearOsDevice === null) {
      setConnectionStatus("connecting");
      return;
    }

    if (hasWearOsDevice === false) {
      setIsLoading(false);
      setConnectionStatus("disconnected");
      setConnectionMessage("Nenhum relógio detectado");
      return;
    }

    const loadInitialData = async () => {
      try {
        const data = await getLatestWearOsHealthData(userId);
        if (data) {
          setHeartRate(data.heartRate);
          setPressure(data.pressure);
          setOxygen(data.oxygen);
          setConnectionStatus("connected");
          setConnectionMessage("Monitorando em tempo real");
          setLastUpdate(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } else {
          setConnectionStatus("disconnected");
          setConnectionMessage("Sem dados recentes");
        }
        setIsLoading(false);
      } catch (error) {
        setConnectionStatus("error");
        setIsLoading(false);
      }
    };

    loadInitialData();

    const cancelPolling = pollWearOsHealthData(userId, 5000, async (data) => {
      setHeartRate(data.heartRate);
      setPressure(data.pressure);
      setOxygen(data.oxygen);
      setConnectionStatus("connected");
      setLastUpdate(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    });

    return () => cancelPolling();
  }, [user?.id, hasWearOsDevice]);

  useEffect(() => {
    const verifyDevice = async () => {
      if (!user?.id) return;
      const userId = parseInt(user.id, 10);
      try {
        const device = await checkWearOsDeviceRegistered(userId);
        setHasWearOsDevice(Boolean(device));
      } catch {
        setHasWearOsDevice(false);
      }
    };
    verifyDevice();
  }, [user?.id]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#10B981";
      case "connecting":
        return "#F59E0B";
      default:
        return "#EF4444";
    }
  };

  return (
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
              <SvgXml xml={svgContent} width={svgDimensions.width} height={svgDimensions.height} />
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
              onPress={() => setIsDeviceModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{connectionMessage}</Text>
              {lastUpdate && <Text style={styles.updateText}>• {lastUpdate}</Text>}
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
              <Text style={styles.infoTitle}>Status da Conexão</Text>
              <Text style={styles.infoSubtitle}>
                {connectionStatus === "connected"
                  ? "Seu relógio está sincronizado e enviando dados."
                  : "Por favor, verifique se seu Wear OS está por perto."}
              </Text>
            </View>
            <TouchableOpacity style={styles.syncBtn} onPress={() => setIsDeviceModalVisible(true)}>
              <Watch size={18} color="#2563EB" />
            </TouchableOpacity>
          </ReanimatedView>

          <View style={{ height: 120 }} />
        </ScrollView>

        <DataPillNavigator currentScreen="HeartbeatsScreen" />

        <DeviceSelectorModal
          isVisible={isDeviceModalVisible}
          onClose={() => setIsDeviceModalVisible(false)}
        />
      </View>
    </SafeAreaView>
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
});

export default HeartbeatsScreen;
