import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation, CompositeNavigationProp, useFocusEffect } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDrawerParamList, AppStackParamList } from "../../../@types/routes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../../components/Header";
import MapView, { LatLng, MapStyleElement, Polyline, Region } from "react-native-maps";
import { Bike, Footprints } from "lucide-react-native";
import { useAuth } from "../../../contexts/AuthContext";
import ECGDisplay from "../../../components/ECGDisplay";
import MiniRadarChart from "../../../components/MiniRadarChart";
import WaterWave from "../../../components/WaterWave";
import StepProgressRing from "../../../components/StepProgressRing";
import { useHealthTracking } from "../../../hooks/useHealthTracking";
import { formatTrainingTime } from "../../../utils/formatters";

const { width } = Dimensions.get("window");

const cyclingMapStyle: MapStyleElement[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f3f4f6" }],
  },
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#d1d5db" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e7eb" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }],
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

  const DAY_ITEM_WIDTH = 50 + 4 * 2;

  const handleFlatListLayout = () => {
    if (flatListRef.current) {
      const flatListVisibleWidth = width - 20 * 2;
      const offset =
        (selectedDay - 1) * DAY_ITEM_WIDTH - flatListVisibleWidth / 2 + DAY_ITEM_WIDTH / 2;
      flatListRef.current.scrollToOffset({ offset: Math.max(0, offset), animated: false });
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
    const days = ["D", "S", "T", "Q", "Q", "S", "S"];
    return days[new Date(year, month, day).getDay()];
  };

  const RESULTS_CARD_INNER_SIZE = Math.floor(Math.min(202 - 30, 188 - 30) * 0.9);

  const monthNameAndYear = getMonthAndYear(currentDate);
  const totalDaysInMonth = getDaysInMonth(currentDate);
  const daysInMonthArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const renderDay = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[styles.dayContainer, item === selectedDay && styles.selectedDayContainer]}
      onPress={() => setSelectedDay(item)}
    >
      <Text style={[styles.dayOfWeek, item === selectedDay && styles.selectedDayOfWeek]}>
        {getDayOfWeek(currentYear, currentMonth, item)}
      </Text>
      <Text style={[styles.dayOfMonth, item === selectedDay && styles.selectedDayOfMonth]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const getItemLayout = (data: ArrayLike<any> | null | undefined, index: number) => ({
    length: DAY_ITEM_WIDTH,
    offset: DAY_ITEM_WIDTH * index,
    index,
  });

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.monthText}>{monthNameAndYear}</Text>
        <View>
          <FlatList
            horizontal
            ref={flatListRef}
            data={daysInMonthArray}
            renderItem={renderDay}
            keyExtractor={(item) => String(item)}
            showsHorizontalScrollIndicator={false}
            style={{ width: "100%", marginBottom: 30, marginTop: 14 }}
            initialScrollIndex={selectedDay - 1}
            getItemLayout={getItemLayout}
            onLayout={handleFlatListLayout}
          />
          <Text style={styles.reportTitle}>Relatório de hoje</Text>

          <View style={styles.cardsContainer}>
            <View style={styles.topRowCardsContainer}>
              {/* Coluna Esquerda: Calorias e Tempo de Treino */}
              <View style={styles.leftColumn}>
                {/* Card de Calorias Gastas */}
                <TouchableOpacity
                  style={[styles.card, styles.caloriesCard]}
                  onPress={() =>
                    navigation.navigate({
                      name: "CaloriesScreen",
                      params: {} as never,
                    })
                  }
                >
                  <Text style={styles.cardCategory}>Calorias gastas</Text>
                  <Text style={[styles.cardValue, styles.caloriesValue]}>
                    {Math.round(healthData.calories)} Kcal
                  </Text>
                </TouchableOpacity>

                {/* Card de Tempo de Treino */}
                <TouchableOpacity
                  style={[styles.card, styles.trainingTimeCard]}
                  onPress={() =>
                    navigation.navigate({
                      name: "TrainingScreen",
                      params: {} as never,
                    })
                  }
                >
                  <Text style={[styles.cardCategory, styles.trainingTimeCategory]}>
                    Tempo de treino
                  </Text>
                  <View style={styles.trainingTimeValueContainer}>
                    <Text style={styles.trainingTimeValue}>{formattedTrainingTime}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Coluna Direita Superior: Resultados (mesma estilização do Ciclismo) */}
              <TouchableOpacity
                style={[styles.card, styles.ResultsCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "ResultsScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.ResultsContent}>
                  <View style={styles.ResultsHeader}>
                    <Text style={styles.ResultsCategory}>Resultados</Text>
                  </View>
                  <View style={styles.ResultsGraphPlaceholder}>
                    <MiniRadarChart size={RESULTS_CARD_INNER_SIZE} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Linha: Batimentos e Passos */}
            <View style={styles.rowContainer}>
              {/* Card de Batimentos */}
              <TouchableOpacity
                style={[styles.card, styles.heartRateCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "HeartbeatsScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.heartRateHeader}>
                  <Text style={[styles.cardCategory, styles.heartRateCategory]}>Batimentos</Text>
                  {isWearOsConnected && (
                    <View style={styles.connectionIndicator}>
                      <View style={styles.connectionDot} />
                      <Text style={styles.connectionText}>Conectado</Text>
                    </View>
                  )}
                </View>
                <ECGDisplay
                  bpm={healthData.heartRate}
                  width={140}
                  height={45}
                  responsive={false}
                  isConnected={isWearOsConnected && healthData.heartRate > 0}
                />
                <Text style={[styles.cardValue, styles.heartRateValue]}>
                  {isWearOsConnected && healthData.heartRate > 0
                    ? `${healthData.heartRate} Bpm`
                    : "--"}
                </Text>
              </TouchableOpacity>

              {/* Card de Passos */}
              <TouchableOpacity
                style={[styles.card, styles.stepsCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "StepsScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.stepsCardHeader}>
                  <Text style={[styles.cardCategory, styles.stepsCategory]}>Passos</Text>
                  <Text style={styles.stepsGoalText}>{stepsGoal.toLocaleString("pt-BR")} meta</Text>
                </View>
                <View style={styles.stepsCardBody}>
                  <View style={styles.stepsRingContainer}>
                    <StepProgressRing progress={stepsProgress} size={72} />
                    <View style={styles.stepsRingOverlay}>
                      <Footprints size={18} color="#FF8C00" />
                      <Text style={styles.stepsRingPercent}>{stepsProgressPercent}%</Text>
                    </View>
                  </View>
                  <View style={styles.stepsInfoContainer}>
                    <Text style={styles.stepsCountText}>{formattedSteps}</Text>
                    <Text style={styles.stepsMetaText}>
                      de {stepsGoal.toLocaleString("pt-BR")} passos
                    </Text>
                    <Text style={styles.stepsStatusText}>{stepsStatusText}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Linha: Sono e Água */}
            <View style={styles.rowContainer}>
              {/* Card de Sono */}
              <TouchableOpacity
                style={[styles.card, styles.sleepCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "SleepScreen",
                    params: {} as never,
                  })
                }
              >
                <Text style={[styles.cardCategory, styles.sleepCategory]}>Sono</Text>
                <View style={styles.sleepStatusContainer}>
                  <Text style={[styles.cardValue, styles.sleepValue]}>
                    {sleepHours}h {String(sleepMinutes).padStart(2, "0")}m
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Card de Água */}
              <TouchableOpacity
                style={[styles.card, styles.waterCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "WaterScreen",
                    params: {} as never,
                  })
                }
              >
                <Text style={[styles.cardCategory, styles.waterCategory]}>Água</Text>
                <View style={styles.waterFillPlaceholder}>
                  <WaterWave progress={waterProgress} />
                  <Text style={[styles.cardValue, styles.waterValue]}>{waterConsumedMl} ml</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cyclingCard} activeOpacity={0.9}>
              <View style={styles.cyclingHeader}>
                <View style={styles.cyclingIcon}>
                  <Bike size={20} color="#192126" />
                </View>
                <Text style={styles.cyclingTitle}>Ciclismo</Text>
              </View>
              <View style={styles.cyclingMapWrapper}>
                {cyclingRegion ? (
                  <MapView
                    pointerEvents="none"
                    style={styles.cyclingMap}
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
                    showsIndoorLevelPicker={false}
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
                  <View style={styles.cyclingMapPlaceholder}>
                    <Text style={styles.cyclingPlaceholderText}>
                      {locationError ?? "Iniciando rastreamento..."}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  monthText: {
    color: "#192126",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 0,
  },
  dayContainer: {
    width: 50,
    height: 70,
    borderRadius: 15,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  selectedDayContainer: {
    backgroundColor: "#192126",
    borderColor: "transparent",
    borderWidth: 0,
  },
  dayOfWeek: {
    color: "#192126",
    fontSize: 14,
    marginBottom: 5,
  },
  selectedDayOfWeek: {
    color: "#BBF246",
  },
  dayOfMonth: {
    color: "#192126",
    fontSize: 20,
    fontWeight: "bold",
  },
  selectedDayOfMonth: {
    color: "#BBF246",
  },
  reportTitle: {
    color: "#192126",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 15,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  topRowCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  leftColumn: {
    width: 112,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  rowContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "#3A3A3A",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    justifyContent: "center",
  },
  cardCategory: {
    color: "#FFF",
    fontSize: 14,
    marginTop: -4,
    marginBottom: 5,
    fontWeight: "bold",
  },
  cardValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  caloriesCard: {
    backgroundColor: "#192126",
    height: 70,
    width: 150,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  caloriesValue: {
    color: "#FFF",
    fontSize: 14,
  },
  ResultsCard: {
    backgroundColor: "#192126",
    height: 188,
    width: 202,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderColor: "#192126",
    borderWidth: 1,
  },
  ResultsContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  ResultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    width: "100%",
  },
  ResultsCategory: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 34,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  ResultsGraphPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  ResultsGraphLine: {
    backgroundColor: "#BBF246",
    height: 2,
    width: "80%",
    borderRadius: 1,
  },
  trainingTimeCard: {
    backgroundColor: "#F5EEFB",
    width: 150,
    height: 108,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  trainingTimeCategory: {
    color: "#8A2BE2",
    fontSize: 14,
    marginBottom: 5,
    textAlign: "left",
    width: "100%",
    fontWeight: "bold",
  },
  trainingTimeValueContainer: {
    width: 54,
    height: 54,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: "#D8BFD8",
    justifyContent: "center",
    alignItems: "center",
  },
  trainingTimeValue: {
    color: "#8A2BE2",
    fontSize: 16,
    fontWeight: "bold",
  },
  heartRateCard: {
    backgroundColor: "#FCE7F3",
    width: "48%",
    height: 130,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heartRateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 3,
  },
  heartRateCategory: {
    color: "red",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  connectionText: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "600",
  },
  heartRateGraphPlaceholder: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  heartRateValue: {
    color: "#FF69B4",
    fontSize: 16,
    marginTop: 2,
  },
  ResultsValue: {
    color: "#00C0FF",
    fontSize: 18,
    fontWeight: "bold",
  },
  stepsCard: {
    backgroundColor: "#FFF3E0",
    width: "48%",
    minHeight: 132,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  stepsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  stepsGoalText: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "600",
  },
  stepsCardBody: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  stepsRingContainer: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepsRingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsRingPercent: {
    marginTop: 2,
    color: "#FF8C00",
    fontSize: 12,
    fontWeight: "700",
  },
  stepsInfoContainer: {
    flex: 1,
  },
  stepsCountText: {
    color: "#FF8C00",
    fontSize: 20,
    fontWeight: "700",
  },
  stepsMetaText: {
    color: "#B45309",
    fontSize: 12,
    marginTop: 2,
  },
  stepsStatusText: {
    color: "#4D7C0F",
    fontSize: 12,
    marginTop: 6,
  },
  stepsStatusError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
  },
  stepsTrailContainer: {
    marginTop: 12,
    width: "100%",
    height: 26,
    borderRadius: 14,
    backgroundColor: "#FFE8CC",
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  stepsTrailAnimatedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepsFootprintIcon: {
    marginHorizontal: 6,
  },
  stepsCategory: {
    color: "#FF8C00",
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  stepsValue: {
    color: "#FF8C00",
    fontSize: 18,
  },
  progressBarPlaceholder: {
    width: "100%",
    height: 10,
    backgroundColor: "#FFE0B2",
    borderRadius: 5,
    marginTop: 10,
  },
  progressBarFill: {
    width: "50%",
    height: "100%",
    backgroundColor: "#FFB74D",
    borderRadius: 5,
  },
  sleepCard: {
    backgroundColor: "#E0F2F7",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sleepCategory: {
    color: "#1F2937",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "bold",
  },
  sleepStatusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 8,
  },
  sleepValue: {
    color: "#1F2937",
    fontSize: 24,
    fontWeight: "bold",
  },
  sleepStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sleepStatusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  waterCard: {
    backgroundColor: "#E3F2FD",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  waterCategory: {
    color: "#192126",
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  waterFillPlaceholder: {
    width: "100%",
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  waterValue: {
    color: "#192126",
    paddingBottom: 5,
    paddingLeft: 5,
    fontSize: 18,
  },
  resultsCard: {
    backgroundColor: "#F3E8FF",
    width: "100%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  resultsCategory: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  resultsValue: {
    color: "#7E22CE",
    fontSize: 18,
  },
  cyclingCard: {
    backgroundColor: "#192126",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 202,
    height: 188,
    alignSelf: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#192126",
    justifyContent: "flex-start",
  },
  cyclingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cyclingIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cyclingIconText: {
    color: "#BBF246",
    fontSize: 12,
    fontWeight: "bold",
  },
  cyclingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cyclingMapWrapper: {
    flex: 1,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  cyclingMap: {
    width: "100%",
    height: "100%",
  },
  cyclingMapPlaceholder: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
  },
  cyclingPlaceholderText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
  bottomNavigationBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#282828",
    paddingVertical: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  navBarItem: {
    padding: 10,
    alignItems: "center",
  },
  navBarText: {
    color: "#fff",
    fontSize: 12,
  },
  navBarIconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: "#555",
    borderRadius: 12,
    marginBottom: 5,
  },
  navBarItemSelected: {
    backgroundColor: "#8BC34A",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  navBarTextSelected: {
    color: "#1E1E1E",
    fontSize: 12,
    fontWeight: "bold",
  },
  navBarIconSelectedPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    marginBottom: 5,
  },
  authorizeButton: {
    backgroundColor: "#8BC34A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  authorizeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
    color: "#666",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
    color: "#FF0000",
  },
  resultsAxisLabel: {
    color: "#FFFFFF",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },
});

export default DataScreen;
