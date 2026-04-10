import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import {
  Bike,
  Timer,
  Navigation,
  Mountain,
  Zap,
  ChevronRight,
  TrendingUp,
  Heart,
  Droplets,
  Flame,
  Play,
  Pause,
  Square,
  Share2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import {
  speedToPace,
  formatDuration,
  estimateCalories,
} from "../../../../utils/workout/performance";

const { width, height } = Dimensions.get("window");

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CyclingScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Ciclismo" | "Corrida" | "Maratona">("Ciclismo");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "85%"], []);

  // Tracking States
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentSpeedMs, setCurrentSpeedMs] = useState(0);
  const [splits, setSplits] = useState<{ km: number; time: string; pace: string }[]>([]);

  const lastSplitDist = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriber = useRef<Location.LocationSubscription | null>(null);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos de acesso ao GPS para o MOVT Performance.");
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setIsAutoPaused(false);
    setSeconds(0);
    setDistance(0);
    setRoute([]);
    setSplits([]);
    lastSplitDist.current = 0;

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    locationSubscriber.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 3,
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;
        setCurrentLocation(location);
        const currentSpeed = speed || 0;
        setCurrentSpeedMs(currentSpeed);

        // Auto-Pause Logic (below 1km/h)
        if (currentSpeed < 0.28 && !isPaused && !isAutoPaused) {
          handleAutoPause(true);
        } else if (currentSpeed >= 1.0 && isAutoPaused) {
          handleAutoPause(false);
        }

        if (isPaused || isAutoPaused) return;

        setRoute((prev) => {
          const newPoint = { latitude, longitude };
          if (prev.length > 0) {
            const lastPoint = prev[prev.length - 1];
            const d = calculateDistance(
              lastPoint.latitude,
              lastPoint.longitude,
              latitude,
              longitude
            );
            if (d > 0.003) {
              const newTotalDistance = distance + d;
              setDistance(newTotalDistance);

              // Marking SPLITS every 1km
              if (Math.floor(newTotalDistance) > lastSplitDist.current) {
                const currentKm = Math.floor(newTotalDistance);
                lastSplitDist.current = currentKm;
                setSplits((prevSplits) => [
                  ...prevSplits,
                  {
                    km: currentKm,
                    time: formatDuration(seconds),
                    pace: speedToPace((distance * 1000) / seconds),
                  },
                ]);
              }
            }
          }
          return [...prev, newPoint];
        });
      }
    );
  };

  const handleAutoPause = (pause: boolean) => {
    if (pause) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsAutoPaused(true);
    } else {
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
      setIsAutoPaused(false);
    }
  };

  const togglePause = () => {
    if (isPaused || isAutoPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
      setIsPaused(false);
      setIsAutoPaused(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
      setCurrentSpeedMs(0);
    }
  };

  const stopTracking = () => {
    Alert.alert("Finalizar Treino", "Deseja salvar e postar seu progresso?", [
      { text: "Continuar", style: "cancel" },
      {
        text: "Finalizar e Analisar",
        style: "destructive",
        onPress: () => {
          setIsTracking(false);
          if (timerRef.current) clearInterval(timerRef.current);
          if (locationSubscriber.current) locationSubscriber.current.remove();
          handleOpenAnalysis();
        },
      },
    ]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (locationSubscriber.current) locationSubscriber.current.remove();
    };
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleOpenAnalysis = () => bottomSheetRef.current?.expand();

  const currentSpeedKmh = (currentSpeedMs * 3.6).toFixed(1);
  const currentPace = speedToPace(currentSpeedMs);
  const estimatedKcal = estimateCalories(distance).toFixed(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <BackButton to={{ name: "DataScreen" }} />
        <Text style={styles.headerTitle}>MOVT Performance</Text>
        <TouchableOpacity onPress={handleOpenAnalysis} style={styles.infoBtn}>
          <TrendingUp size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabSelector}>
          {["Ciclismo", "Corrida"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              style={[
                styles.tab,
                activeTab === tab && {
                  backgroundColor: activeTab === "Ciclismo" ? "#3B82F6" : "#10B981",
                },
              ]}
              disabled={isTracking}
            >
              <Text style={[styles.tabText, activeTab === tab && { color: "#FFF" }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={
              currentLocation
                ? {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }
                : undefined
            }
            initialRegion={{
              latitude: -23.5555,
              longitude: -46.6383,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {route.length > 1 && (
              <Polyline
                coordinates={route}
                strokeColor={activeTab === "Ciclismo" ? "#3B82F6" : "#10B981"}
                strokeWidth={5}
              />
            )}
            {route.length > 0 && <Marker coordinate={route[0]} title="Início" pinColor="green" />}
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
              >
                <View
                  style={[
                    styles.currentLocationMarker,
                    { backgroundColor: activeTab === "Ciclismo" ? "#3B82F6" : "#10B981" },
                  ]}
                />
              </Marker>
            )}
          </MapView>

          {isAutoPaused && (
            <View style={styles.autoPauseOverlay}>
              <Text style={styles.autoPauseText}>| | AUTO-PAUSA</Text>
            </View>
          )}

          <View style={styles.hudOverlay}>
            <View style={styles.hudGrid}>
              <View style={styles.hudCard}>
                <Navigation size={16} color="#3B82F6" />
                <View style={styles.hudCardValueContainer}>
                  <Text style={styles.hudCardValue}>{distance.toFixed(2)}</Text>
                  <Text style={styles.hudCardUnit}>km</Text>
                </View>
              </View>
              <View style={styles.hudCard}>
                <Timer size={16} color="#10B981" />
                <View style={styles.hudCardValueContainer}>
                  <Text style={styles.hudCardValue}>{formatDuration(seconds)}</Text>
                  <Text style={styles.hudCardUnit}>tempo</Text>
                </View>
              </View>
              <View style={styles.hudCard}>
                <Zap size={16} color="#EF4444" />
                <View style={styles.hudCardValueContainer}>
                  <Text style={styles.hudCardValue}>
                    {activeTab === "Ciclismo" ? currentSpeedKmh : currentPace}
                  </Text>
                  <Text style={styles.hudCardUnit}>
                    {activeTab === "Ciclismo" ? "km/h" : "pace/km"}
                  </Text>
                </View>
              </View>
              <View style={styles.hudCard}>
                <Flame size={16} color="#F97316" />
                <View style={styles.hudCardValueContainer}>
                  <Text style={styles.hudCardValue}>{estimatedKcal}</Text>
                  <Text style={styles.hudCardUnit}>kcal</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.controlContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: "#BBF246" }]}
              onPress={startTracking}
              activeOpacity={0.8}
            >
              <Play size={24} color="#000" fill="#000" />
              <Text style={styles.mainButtonText}>INICIAR {activeTab.toUpperCase()}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity style={[styles.roundButton]} onPress={togglePause}>
                {isPaused || isAutoPaused ? (
                  <Play size={24} color="#000" fill="#000" />
                ) : (
                  <Pause size={24} color="#000" fill="#000" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stopButton, { backgroundColor: "#EF4444" }]}
                onPress={stopTracking}
              >
                <Square size={24} color="#FFF" fill="#FFF" />
                <Text style={styles.stopButtonText}>FINALIZAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.insightContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tendências de Esforço</Text>
          </View>

          <TouchableOpacity
            style={styles.mainInsightCard}
            activeOpacity={0.85}
            onPress={handleOpenAnalysis}
          >
            <LinearGradient colors={["#F8FAFC", "#F1F5F9"]} style={styles.insightGradient}>
              <View style={styles.insightLeft}>
                <View style={styles.insightIconCircle}>
                  <TrendingUp size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.insightLabel}>Sua melhor performance</Text>
                  <Text style={styles.insightValue}>+15% em relação à última semana</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#3B82F6" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.smallStatCard}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.smallStatLabel}>BPM Médio</Text>
              <Text style={styles.smallStatValue}>142</Text>
            </View>
            <View style={styles.smallStatCard}>
              <Flame size={20} color="#F97316" />
              <Text style={styles.smallStatLabel}>Calorias</Text>
              <Text style={styles.smallStatValue}>{estimatedKcal}</Text>
            </View>
            <View style={styles.smallStatCard}>
              <Droplets size={20} color="#3B82F6" />
              <Text style={styles.smallStatLabel}>Hidratação</Text>
              <Text style={styles.smallStatValue}>1.2L</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <DataPillNavigator currentScreen="CyclingScreen" />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bsBackground}
      >
        <BottomSheetView style={styles.bsContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.bsHeader}>
              <View
                style={[
                  styles.bsIconContainer,
                  { backgroundColor: activeTab === "Ciclismo" ? "#3B82F6" : "#10B981" },
                ]}
              >
                {activeTab === "Ciclismo" ? (
                  <Bike size={24} color="#FFF" />
                ) : (
                  <TrendingUp size={24} color="#FFF" />
                )}
              </View>
              <View>
                <Text style={styles.bsTitle}>Resumo do Treino</Text>
                <Text style={styles.bsSubtitle}>Histórico e análise de voltas</Text>
              </View>
            </View>

            <View style={styles.bsSection}>
              <Text style={styles.bsSectionTitle}>Métricas Finais</Text>
              <View style={styles.statsRow}>
                <View style={styles.smallStatCard}>
                  <Text style={styles.smallStatLabel}>Distância</Text>
                  <Text style={styles.smallStatValue}>{distance.toFixed(2)} km</Text>
                </View>
                <View style={styles.smallStatCard}>
                  <Text style={styles.smallStatLabel}>Tempo</Text>
                  <Text style={styles.smallStatValue}>{formatDuration(seconds)}</Text>
                </View>
              </View>
            </View>

            {splits.length > 0 && (
              <View style={styles.bsSection}>
                <Text style={styles.bsSectionTitle}>Voltas (Splits por KM)</Text>
                <View style={styles.splitsTable}>
                  <View style={styles.splitRowHeader}>
                    <Text style={styles.splitHeaderText}>KM</Text>
                    <Text style={styles.splitHeaderText}>TEMPO</Text>
                    <Text style={styles.splitHeaderText}>PACE</Text>
                  </View>
                  {splits.map((s, index) => (
                    <View key={index} style={styles.splitRow}>
                      <Text style={styles.splitNum}>{s.km}</Text>
                      <Text style={styles.splitValue}>{s.time}</Text>
                      <Text
                        style={[
                          styles.splitValue,
                          { color: activeTab === "Ciclismo" ? "#3B82F6" : "#10B981" },
                        ]}
                      >
                        {s.pace}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.bsCloseBtn}
              onPress={() => Alert.alert("Compartilhar", "Postando no Feed do MOVT...")}
            >
              <Text style={styles.bsCloseBtnText}>Postar no Feed do App</Text>
            </TouchableOpacity>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B", letterSpacing: -0.5 },
  tabsContainer: { paddingHorizontal: 20, paddingBottom: 15 },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 2,
    width: "100%",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 18 },
  tabText: { fontSize: 14, fontWeight: "800", color: "#64748B" },
  activeTab: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoBtn: { padding: 8 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  mapContainer: {
    height: height * 0.4,
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: "hidden",
    marginTop: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  map: { ...StyleSheet.absoluteFillObject },
  autoPauseOverlay: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  autoPauseText: { color: "#BBF246", fontWeight: "900", fontSize: 12 },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#FFF",
    elevation: 4,
  },
  hudOverlay: { position: "absolute", bottom: 15, left: 15, right: 15 },
  hudGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hudCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hudCardValueContainer: { flex: 1 },
  hudCardValue: { fontSize: 18, fontWeight: "900", color: "#000", letterSpacing: -0.5 },
  hudCardUnit: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: -2,
  },
  controlContainer: { paddingHorizontal: 20, marginTop: 25 },
  mainButton: {
    flexDirection: "row",
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mainButtonText: { fontSize: 18, fontWeight: "900", color: "#000" },
  activeControls: { flexDirection: "row", gap: 15 },
  roundButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  stopButton: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stopButtonText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
  insightContainer: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  mainInsightCard: { borderRadius: 24, overflow: "hidden", marginBottom: 20 },
  insightGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  insightLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  insightIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  insightLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", color: "#3B82F6" },
  insightValue: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12 },
  smallStatCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  smallStatLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
  },
  smallStatValue: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginTop: 4 },
  bsBackground: { backgroundColor: "#FFFFFF", borderRadius: 32 },
  bsContainer: { flex: 1, padding: 24 },
  bsHeader: { flexDirection: "row", alignItems: "center", gap: 15, marginBottom: 30 },
  bsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bsTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  bsSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  bsSection: { marginBottom: 25 },
  bsSectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 15 },
  splitsTable: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  splitRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  splitHeaderText: { fontSize: 10, fontWeight: "900", color: "#94A3B8" },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  splitNum: { fontSize: 14, fontWeight: "900", color: "#1E293B" },
  splitValue: { fontSize: 14, fontWeight: "700", color: "#475569" },
  bsCloseBtn: {
    backgroundColor: "#1E293B",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  bsCloseBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});

export default CyclingScreen;
