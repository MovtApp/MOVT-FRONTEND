import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  Bike,
  Timer,
  Navigation,
  Mountain,
  Zap,
  ChevronRight,
  Info,
  TrendingUp,
  Heart,
  Droplets,
  Flame,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";

const { width, height } = Dimensions.get("window");

// Mock route data (simulating a professional cycling route)
const MOCK_ROUTE = [
  { latitude: -23.5505, longitude: -46.6333 },
  { latitude: -23.5515, longitude: -46.6353 },
  { latitude: -23.5535, longitude: -46.6373 },
  { latitude: -23.5555, longitude: -46.6403 },
  { latitude: -23.5585, longitude: -46.6433 },
  { latitude: -23.5605, longitude: -46.6453 },
  { latitude: -23.5625, longitude: -46.6423 },
  { latitude: -23.5645, longitude: -46.6393 },
];

const METRIC_CARDS = [
  { id: "dist", label: "Distância", value: "32.4", unit: "km", icon: Navigation, color: "#3B82F6" },
  { id: "time", label: "Tempo", value: "01:24", unit: "h", icon: Timer, color: "#10B981" },
  { id: "elev", label: "Elevação", value: "450", unit: "m", icon: Mountain, color: "#F59E0B" },
  { id: "speed", label: "Vel. Média", value: "24.5", unit: "km/h", icon: Zap, color: "#EF4444" },
];

const CyclingScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Ciclismo" | "Corrida" | "Maratona">("Ciclismo");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "85%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleOpenAnalysis = () => bottomSheetRef.current?.expand();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <BackButton to={{ name: "DataScreen" }} />
        <Text style={styles.headerTitle}>Atividades de Rota</Text>
        <TouchableOpacity onPress={handleOpenAnalysis} style={styles.infoBtn}>
          <Info size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabSelector}>
          {["Ciclismo", "Corrida"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map View Section */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: -23.5555,
              longitude: -46.6383,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Polyline
              coordinates={MOCK_ROUTE}
              strokeColor="#3B82F6"
              strokeWidth={4}
              lineCap="round"
            />
            <Marker coordinate={MOCK_ROUTE[0]}>
              <View style={styles.markerStart} />
            </Marker>
            <Marker coordinate={MOCK_ROUTE[MOCK_ROUTE.length - 1]}>
              <View style={styles.markerEnd}>
                <Bike size={12} color="#FFF" />
              </View>
            </Marker>
          </MapView>

          {/* HUD Overlay Metrics */}
          <View style={styles.hudOverlay}>
            <View style={styles.hudGrid}>
              {METRIC_CARDS.map((card) => (
                <View key={card.id} style={styles.hudCard}>
                  <card.icon size={16} color={card.color} />
                  <View style={styles.hudCardValueContainer}>
                    <Text style={styles.hudCardValue}>{card.value}</Text>
                    <Text style={styles.hudCardUnit}>{card.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Insight Section */}
        <View style={styles.insightContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Análise do Percurso</Text>
            <TouchableOpacity onPress={handleOpenAnalysis}>
              <Text style={styles.seeMore}>Ver detalhes</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.mainInsightCard} activeOpacity={0.9} onPress={handleOpenAnalysis}>
            <LinearGradient
              colors={["#EFF6FF", "#DBEAFE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightGradient}
            >
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

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.smallStatCard}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.smallStatLabel}>BPM Médio</Text>
              <Text style={styles.smallStatValue}>142</Text>
            </View>
            <View style={styles.smallStatCard}>
              <Flame size={20} color="#F97316" />
              <Text style={styles.smallStatLabel}>Calorias</Text>
              <Text style={styles.smallStatValue}>840</Text>
            </View>
            <View style={styles.smallStatCard}>
              <Droplets size={20} color="#3B82F6" />
              <Text style={styles.smallStatLabel}>Hidratação</Text>
              <Text style={styles.smallStatValue}>1.2L</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <DataPillNavigator currentScreen="CyclingScreen" />

      {/* Analysis Bottom Sheet */}
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
              <View style={styles.bsIconContainer}>
                <Bike size={24} color="#FFF" />
              </View>
              <View>
                <Text style={styles.bsTitle}>Análise de Desempenho</Text>
                <Text style={styles.bsSubtitle}>Resumo técnico da sua última atividade</Text>
              </View>
            </View>

            <View style={styles.bsSection}>
              <Text style={styles.bsSectionTitle}>Zonas de Intensidade</Text>
              <View style={styles.intensityBar}>
                <View style={[styles.intensitySegment, { flex: 0.2, backgroundColor: "#3B82F6" }]} />
                <View style={[styles.intensitySegment, { flex: 0.5, backgroundColor: "#10B981" }]} />
                <View style={[styles.intensitySegment, { flex: 0.2, backgroundColor: "#F59E0B" }]} />
                <View style={[styles.intensitySegment, { flex: 0.1, backgroundColor: "#EF4444" }]} />
              </View>
              <View style={styles.intensityLabels}>
                <Text style={styles.intensityText}>Aeróbico (50%)</Text>
                <Text style={styles.intensityText}>Limiar (20%)</Text>
              </View>
            </View>

            <View style={styles.bsSection}>
              <Text style={styles.bsSectionTitle}>Recomendações</Text>
              <View style={styles.tipCard}>
                <Zap size={18} color="#F59E0B" />
                <Text style={styles.tipText}>
                  Seu esforço foi intenso. Recomendamos <Text style={{ fontWeight: "700" }}>24h de recuperação</Text> antes da próxima sessão de alta carga.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bsCloseBtn}
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text style={styles.bsCloseBtnText}>Fechar Análise</Text>
            </TouchableOpacity>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 2,
    width: "100%",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#1E293B",
  },
  infoBtn: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapContainer: {
    height: height * 0.45,
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: "hidden",
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  hudOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  hudGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  hudCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hudCardValueContainer: {
    flex: 1,
  },
  hudCardValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  hudCardUnit: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  markerStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  markerEnd: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  insightContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  seeMore: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "700",
  },
  mainInsightCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  insightGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  insightLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  insightIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
    textTransform: "uppercase",
  },
  insightValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
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
  smallStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 4,
  },
  bsBackground: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
  },
  bsContainer: {
    flex: 1,
    padding: 24,
  },
  bsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 30,
  },
  bsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  bsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  bsSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  bsSection: {
    marginBottom: 25,
  },
  bsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 15,
  },
  intensityBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  intensitySegment: {
    height: "100%",
  },
  intensityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  intensityText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  bsCloseBtn: {
    backgroundColor: "#1E293B",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  bsCloseBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});

export default CyclingScreen;
