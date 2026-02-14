import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDrawerParamList, AppStackParamList } from "../../../@types/routes";
import Header from "../../../components/Header";
import MapView, { MapStyleElement, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import {
  Bike,
  Footprints,
  Flame,
  Timer,
  Heart,
  Moon,
  Droplets,
  Activity,
  ArrowRight,
} from "lucide-react-native";
import { useAuth } from "../../../contexts/AuthContext";
import ECGDisplay from "../../../components/ECGDisplay";
import MiniRadarChart from "../../../components/MiniRadarChart";
import WaterWave from "../../../components/WaterWave";
import StepProgressRing from "../../../components/StepProgressRing";
import { useHealthTracking } from "../../../hooks/useHealthTracking";
import { formatTrainingTime } from "../../../utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const cyclingMapStyle: MapStyleElement[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

const DataScreen: React.FC = () => {
  type DataScreenNavigationProp = CompositeNavigationProp<
    DrawerNavigationProp<AppDrawerParamList, "HomeStack">,
    NativeStackNavigationProp<AppStackParamList>
  >;
  const navigation = useNavigation<DataScreenNavigationProp>();
  const { user } = useAuth();

  const {
    heartRate,
    isWearOsConnected,
    stepsToday,
    stepsLoading,
    isWalking,
    stepsGoal,
    trainingTime,
    cyclingRoute,
    cyclingRegion,
    locationError,
    dailyCalories,
    sleepHours,
    sleepMinutes,
    waterConsumedMl,
  } = useHealthTracking(user?.id);

  const healthData = {
    calories: dailyCalories,
    steps: stepsToday,
    heartRate: heartRate ?? 0,
    sleep: sleepHours,
    water: waterConsumedMl / 250,
  };

  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const flatListRef = useRef<FlatList>(null);

  const waterGoalMl = 2000;
  const waterProgress = Math.max(0, Math.min(1, waterConsumedMl / waterGoalMl));
  const stepsProgress = stepsGoal > 0 ? Math.min(1, stepsToday / stepsGoal) : 0;
  const stepsProgressPercent = Math.round(Math.max(0, Math.min(1, stepsProgress)) * 100);
  const formattedSteps = stepsLoading ? "--" : stepsToday.toLocaleString("pt-BR");
  const stepsStatusText = stepsLoading ? "Sincronizando..." : isWalking ? "Contando agora" : "";
  const formattedTrainingTime = formatTrainingTime(trainingTime);

  const DAY_ITEM_WIDTH = 60; // Increased touch area

  const handleFlatListLayout = () => {
    if (flatListRef.current) {
      const flatListVisibleWidth = width - 40; // 20px padding each side
      const offset =
        (selectedDay - 1) * DAY_ITEM_WIDTH - flatListVisibleWidth / 2 + DAY_ITEM_WIDTH / 2;
      flatListRef.current.scrollToOffset({
        offset: Math.max(0, offset),
        animated: false,
      });
    }
  };

  const getMonthAndYear = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    const formattedDate = date.toLocaleDateString("pt-BR", options);
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[new Date(year, month, day).getDay()];
  };

  /* Dynamic Sizing */
  const CARD_WIDTH = (width - 40 - 20) / 2; // (Screen - PaddingHorizontal - Gap) / 2
  const RADAR_SIZE = Math.min(CARD_WIDTH * 0.8, 140); // Max size 140, but scales down
  const RADAR_MARGIN_TOP = CARD_WIDTH * 0.15;

  const RESULTS_CARD_INNER_SIZE = Math.floor(Math.min(202 - 30, 188 - 30) * 0.9);

  const monthNameAndYear = getMonthAndYear(currentDate);
  const totalDaysInMonth = getDaysInMonth(currentDate);
  const daysInMonthArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const renderDay = ({ item }: { item: number }) => {
    const isSelected = item === selectedDay;
    return (
      <TouchableOpacity
        style={[styles.dayContainer, isSelected && styles.selectedDayContainer]}
        onPress={() => setSelectedDay(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayOfWeek, isSelected && styles.selectedDayText]}>
          {getDayOfWeek(currentYear, currentMonth, item)}
        </Text>
        <Text style={[styles.dayOfMonth, isSelected && styles.selectedDayText]}>{item}</Text>
      </TouchableOpacity>
    );
  };

  const getItemLayout = (data: ArrayLike<any> | null | undefined, index: number) => ({
    length: DAY_ITEM_WIDTH,
    offset: DAY_ITEM_WIDTH * index,
    index,
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Header />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateHeader}>
          <Text style={styles.monthText}>{monthNameAndYear}</Text>
        </View>

        <FlatList
          horizontal
          ref={flatListRef}
          data={daysInMonthArray}
          renderItem={renderDay}
          keyExtractor={(item) => String(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysListContent}
          style={styles.daysList}
          initialScrollIndex={Math.max(0, selectedDay - 1)}
          getItemLayout={getItemLayout}
          onLayout={handleFlatListLayout}
        />

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.sectionTitle}>Resumo Diário</Text>

          <View style={styles.gridContainer}>
            {/* Left Column */}
            <View style={styles.leftColumn}>
              {/* Calories Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.card, styles.smallCard]}
                onPress={() => navigation.navigate("CaloriesScreen" as never)}
              >
                <LinearGradient
                  colors={["rgba(255, 140, 0, 0.1)", "rgba(255, 140, 0, 0.05)"]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.iconContainer, { backgroundColor: "rgba(255, 140, 0, 0.15)" }]}
                  >
                    <Flame size={18} color="#FF8C00" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <View>
                  <Text style={styles.cardLabel}>Calorias</Text>
                  <Text style={styles.cardValueLarge}>
                    {Math.round(healthData.calories)}
                    <Text style={styles.unitText}> kcal</Text>
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Training Time Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.card, styles.smallCard]}
                onPress={() => navigation.navigate("TrainingScreen" as never)}
              >
                <LinearGradient
                  colors={["rgba(138, 43, 226, 0.1)", "rgba(138, 43, 226, 0.05)"]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.iconContainer, { backgroundColor: "rgba(138, 43, 226, 0.15)" }]}
                  >
                    <Timer size={18} color="#8A2BE2" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <View>
                  <Text style={styles.cardLabel}>Tempo</Text>
                  <Text style={styles.cardValueMedium}>{formattedTrainingTime}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Right Column - Results (Radar) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, styles.tallCard]}
              onPress={() => navigation.navigate("ResultsScreen" as never)}
            >
              <LinearGradient
                colors={["rgba(187, 242, 70, 0.15)", "rgba(187, 242, 70, 0.05)"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceTitle}>Performance</Text>
                <ArrowRight size={16} color="#4B5563" />
              </View>
              <View style={[styles.radarContainer, { marginTop: RADAR_MARGIN_TOP }]}>
                <MiniRadarChart size={RADAR_SIZE} />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardLabel}>Análise completa</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Steps & Heart Rate */}
          <View style={styles.rowContainer}>
            {/* Steps Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, styles.mediumCard]}
              onPress={() => navigation.navigate("StepsScreen" as never)}
            >
              <LinearGradient
                colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.02)"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Passos</Text>
                <Footprints size={18} color="#22C55E" />
              </View>

              <View style={styles.stepsContent}>
                <View style={styles.stepsRingWrapper}>
                  <StepProgressRing progress={stepsProgress} size={60} strokeWidth={6} />
                  <View style={styles.stepsRingInner}>
                    <Text style={styles.stepsPercent}>{stepsProgressPercent}%</Text>
                  </View>
                </View>
                <View style={styles.stepsData}>
                  <Text style={styles.cardValueMove}>{formattedSteps}</Text>
                  <Text style={styles.cardSubText}>Meta: {stepsGoal.toLocaleString("pt-BR")}</Text>
                  {isWalking && <Text style={styles.liveTag}>• Andando</Text>}
                </View>
              </View>
            </TouchableOpacity>

            {/* Heart Rate Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, styles.mediumCard]}
              onPress={() => navigation.navigate("HeartbeatsScreen" as never)}
            >
              <LinearGradient
                colors={["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.02)"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>BPM</Text>
                <Heart
                  size={18}
                  color="#EF4444"
                  fill={healthData.heartRate > 0 ? "#EF4444" : "transparent"}
                />
              </View>

              <View style={styles.ecgContainer}>
                <ECGDisplay
                  bpm={healthData.heartRate}
                  width={width * 0.35}
                  height={50}
                  responsive={false}
                  isConnected={isWearOsConnected && healthData.heartRate > 0}
                  color="#EF4444"
                />
              </View>
              <View style={styles.bpmFooter}>
                <Text style={[styles.cardValueLarge, { color: "#EF4444" }]}>
                  {isWearOsConnected && healthData.heartRate > 0 ? healthData.heartRate : "--"}
                </Text>
                {isWearOsConnected && (
                  <View style={styles.connectedBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.connectedText}>Sync</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3: Sleep & Water */}
          <View style={styles.rowContainer}>
            {/* Sleep Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, styles.halfCard]}
              onPress={() => navigation.navigate("SleepScreen" as never)}
            >
              <LinearGradient
                colors={["rgba(99, 102, 241, 0.15)", "rgba(99, 102, 241, 0.05)"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.cardHeader}>
                <Text style={[styles.cardLabel, { color: "#818CF8" }]}>Sono</Text>
                <Moon size={18} color="#818CF8" />
              </View>
              <View style={styles.sleepContent}>
                <Text style={styles.cardValueLarge}>
                  {sleepHours}
                  <Text style={styles.unitText}>h</Text> {String(sleepMinutes).padStart(2, "0")}
                  <Text style={styles.unitText}>m</Text>
                </Text>
              </View>
            </TouchableOpacity>

            {/* Water Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, styles.halfCard]}
              onPress={() => navigation.navigate("WaterScreen" as never)}
            >
              <LinearGradient
                colors={["rgba(6, 182, 212, 0.15)", "rgba(6, 182, 212, 0.05)"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.cardHeader}>
                <Text style={[styles.cardLabel, { color: "#22D3EE" }]}>Hidratação</Text>
                <Droplets size={18} color="#22D3EE" />
              </View>
              <View style={styles.waterContent}>
                <View style={styles.waterWaveContainer}>
                  <WaterWave progress={waterProgress} height={40} width={40} />
                </View>
                <Text style={styles.cardValueMediumWater}>
                  {waterConsumedMl}
                  <Text style={styles.unitTextSmall}>ml</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cycling Map Card */}
          <TouchableOpacity activeOpacity={0.9} style={styles.cyclingCard}>
            <View style={styles.cyclingHeader}>
              <View style={styles.cyclingIconBox}>
                <Bike size={20} color="#111827" />
              </View>
              <Text style={styles.cyclingTitle}>Atividade de Ciclismo</Text>
            </View>

            <View style={styles.mapContainer}>
              {cyclingRegion ? (
                <MapView
                  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                  pointerEvents="none"
                  style={styles.map}
                  region={cyclingRegion}
                  customMapStyle={cyclingMapStyle}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                  showsCompass={false}
                  showsBuildings={false}
                  showsTraffic={false}
                  showsIndoors={false}
                >
                  {cyclingRoute.length > 1 && (
                    <Polyline
                      coordinates={cyclingRoute}
                      strokeColor="#BBF246"
                      strokeWidth={4}
                      lineCap="round"
                      lineJoin="round"
                    />
                  )}
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <View style={styles.radarEffect} />
                  <Text style={styles.mapPlaceholderText}>
                    {locationError ? "Localização indisponível" : "Aguardando GPS..."}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  monthText: {
    color: "#1F2937",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  daysList: {
    marginBottom: 20,
  },
  daysListContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  dayContainer: {
    width: 50,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDayContainer: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.1,
  },
  dayOfWeek: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  dayOfMonth: {
    color: "#1F2937",
    fontSize: 20,
    fontWeight: "700",
  },
  selectedDayText: {
    color: "#111827",
  },
  sectionTitle: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 15,
  },
  leftColumn: {
    width: "48%",
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  smallCard: {
    height: 110,
    justifyContent: "space-between",
  },
  tallCard: {
    width: "48%",
    height: 232, // Matches 2 small cards + gap
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    width: "100%",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },
  performanceHeader: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  performanceTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
  },
  cardValueLarge: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
  },
  cardValueMedium: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  cardValueMediumWater: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
  },
  cardValueMove: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
  },
  unitText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  unitTextSmall: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  radarContainer: {
    transform: [{ scale: 1.0 }],
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 15,
  },
  mediumCard: {
    width: "48%",
    height: 150,
  },
  halfCard: {
    width: "48%",
    height: 100,
    justifyContent: "space-between",
  },
  stepsContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  stepsRingWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepsRingInner: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  stepsPercent: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "800",
  },
  stepsData: {
    flex: 1,
    justifyContent: "center",
  },
  cardSubText: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 2,
  },
  liveTag: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  ecgContainer: {
    marginVertical: 5,
    height: 40,
    justifyContent: "center",
  },
  bpmFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },
  connectedText: {
    color: "#22C55E",
    fontSize: 8,
    fontWeight: "700",
  },
  sleepContent: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  waterContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waterWaveContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E0F2FE",
  },
  cyclingCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cyclingHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cyclingIconBox: {
    backgroundColor: "#BBF246",
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cyclingTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    color: "#9CA3AF",
    marginTop: 10,
    fontSize: 12,
  },
  radarEffect: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(187, 242, 70, 0.5)",
  },
});

export default DataScreen;
