import React, { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import { Bell, Menu, Bike } from "lucide-react-native";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDrawerParamList, AppStackParamList } from "../../../@types/routes";

// Importações das telas de detalhes de dados
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CaloriesScreen from "./[protected]/CaloriesScreen";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CyclingScreen from "./[protected]/CyclingScreen";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HeartbeatsScreen from "./[protected]/HeartbeatsScreen";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SleepScreen from "./[protected]/SleepScreen";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import StepsScreen from "./[protected]/StepsScreen";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TrainingScreen from "./[protected]/TrainingScreen";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WaterScreen from "./[protected]/WaterScreen";
// import { useGoogleFit } from '../../../hooks/useGoogleFit'; // Importa o hook useGoogleFit

const { width } = Dimensions.get("window");

interface MenuButtonProps {
  onPress: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <Menu size={24} color="#192126" />
    </TouchableOpacity>
  );
};

const DataScreen: React.FC = () => {
  type DataScreenNavigationProp = CompositeNavigationProp<
    DrawerNavigationProp<AppDrawerParamList, "HomeStack">,
    NativeStackNavigationProp<AppStackParamList>
  >;
  const navigation = useNavigation<DataScreenNavigationProp>();

  // const { healthData, isAuthorized, isLoading, error, authorizeGoogleFit } = useGoogleFit(); // Usa o hook useGoogleFit

  const healthData = {
    calories: 645,
    steps: 999,
    heartRate: 79,
    sleep: 0,
    cycling: 0,
    water: 6,
  };
  // const isAuthorized = false;
  // const isLoading = false;
  // const error = null;
  // const authorizeGoogleFit = () => {};

  const [currentDate] = useState(new Date(2025, 6, 1)); // Definido para Julho de 2025
  const [selectedDay, setSelectedDay] = useState(new Date().getDate()); // Seleciona automaticamente o dia atual
  const flatListRef = useRef<FlatList>(null);

  const DAY_ITEM_WIDTH = 50 + 4 * 2;

  const handleFlatListLayout = () => {
    if (flatListRef.current) {
      const flatListVisibleWidth = width - 20 * 2;
      const offset =
        (selectedDay - 1) * DAY_ITEM_WIDTH -
        flatListVisibleWidth / 2 +
        DAY_ITEM_WIDTH / 2;
      flatListRef.current.scrollToOffset({
        offset: Math.max(0, offset),
        animated: false,
      });
    }
  };

  const getMonthAndYear = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    const formattedDate = date.toLocaleDateString("pt-BR", options);
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const dayIndex = date.getDay();
    const days = ["D", "S", "T", "Q", "Q", "S", "S"];
    return days[dayIndex];
  };

  const monthNameAndYear = getMonthAndYear(currentDate);
  const totalDaysInMonth = getDaysInMonth(currentDate);
  const daysInMonthArray = Array.from(
    { length: totalDaysInMonth },
    (_, i) => i + 1,
  );
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const renderDay = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.dayContainer,
        item === selectedDay && styles.selectedDayContainer,
      ]}
      onPress={() => setSelectedDay(item)}
    >
      <Text
        style={[
          styles.dayOfWeek,
          item === selectedDay && styles.selectedDayOfWeek,
        ]}
      >
        {getDayOfWeek(currentYear, currentMonth, item)}
      </Text>
      <Text
        style={[
          styles.dayOfMonth,
          item === selectedDay && styles.selectedDayOfMonth,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const getItemLayout = (
    data: ArrayLike<any> | null | undefined,
    index: number,
  ) => ({ length: DAY_ITEM_WIDTH, offset: DAY_ITEM_WIDTH * index, index });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MenuButton onPress={() => navigation.openDrawer()} />
          <Image
            source={{
              uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1758030169/MV_pukwcn.png",
            }}
            style={{ width: 80, height: 40 }}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color="#192126" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

          {/* {error && <Text style={styles.errorText}>Erro: {error}</Text>} */}
          {/* {!isAuthorized && !isLoading && !error && (
                            <TouchableOpacity onPress={authorizeGoogleFit} style={styles.authorizeButton}>
                                <Text style={styles.authorizeButtonText}>Autorizar Google Fit</Text>
                            </TouchableOpacity>
                        )} */}

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
                  <Text
                    style={[styles.cardCategory, styles.trainingTimeCategory]}
                  >
                    Tempo de treino
                  </Text>
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <View style={styles.circularProgressPlaceholder}>
                      <Text
                        style={[styles.cardValue, styles.trainingTimeValue]}
                      >
                        80%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Coluna Direita Superior: Ciclismo */}
              <TouchableOpacity
                style={[styles.card, styles.cyclingCard]}
                onPress={() =>
                  navigation.navigate({
                    name: "CyclingScreen",
                    params: {} as never,
                  })
                }
              >
                <View style={styles.cyclingContent}>
                  <View style={styles.cyclingHeader}>
                    <Bike size={18} color="#ccc" />
                    <Text style={styles.cyclingCategory}>Ciclismo</Text>
                  </View>
                  <View style={styles.cyclingGraphPlaceholder}>
                    <View style={styles.cyclingGraphLine}></View>
                  </View>
                  <Text style={[styles.cardValue, styles.cyclingValue]}>
                    {healthData.cycling} km
                  </Text>
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
                <Text style={[styles.cardCategory, styles.heartRateCategory]}>
                  Batimentos
                </Text>
                <View style={styles.heartRateGraphPlaceholder}></View>
                <Text style={[styles.cardValue, styles.heartRateValue]}>
                  {healthData.heartRate} Bpm
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
                <Text style={[styles.cardCategory, styles.stepsCategory]}>
                  Passos
                </Text>
                <Text style={[styles.cardValue, styles.stepsValue]}>
                  {healthData.steps}/2000
                </Text>
                <View style={styles.progressBarPlaceholder}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, (healthData.steps / 2000) * 100)}%`,
                      },
                    ]}
                  ></View>
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
                <Text style={[styles.cardCategory, styles.sleepCategory]}>
                  Sono
                </Text>
                <View style={styles.sleepGraphPlaceholder}></View>
                <Text style={[styles.cardValue, styles.sleepValue]}>0h 0m</Text>
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
                <Text style={[styles.cardCategory, styles.waterCategory]}>
                  Água
                </Text>
                <View style={styles.waterFillPlaceholder}>
                  <Text style={[styles.cardValue, styles.waterValue]}>
                    {healthData.water}/8 Copos
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
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
    marginBottom: 15,
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
    marginBottom: 15,
  },
  card: {
    width: "48%",
    backgroundColor: "#3A3A3A",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    justifyContent: "center",
  },
  cardCategory: {
    color: "#192126",
    fontSize: 10,
    marginBottom: 5,
  },
  cardValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  caloriesCard: {
    backgroundColor: "#FFFFFF",
    height: 70,
    width: 150,
    padding: 15,
    borderRadius: 8,
    borderColor: "#192126",
    borderWidth: 1,
    marginBottom: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  caloriesValue: {
    color: "#333",
    fontSize: 16,
  },
  cyclingCard: {
    backgroundColor: "#1E1E1E",
    height: 188,
    width: 202,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  cyclingContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: "100%",
  },
  cyclingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  cyclingCategory: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 5,
  },
  cyclingGraphPlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#282828",
    borderRadius: 10,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cyclingGraphLine: {
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
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trainingTimeCategory: {
    color: "#888",
    fontSize: 10,
    marginBottom: 5,
    textAlign: "left",
    width: "100%",
  },
  circularProgressPlaceholder: {
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
    fontSize: 14,
  },
  heartRateCard: {
    backgroundColor: "#FCE7F3",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heartRateCategory: {
    color: "#888",
    fontSize: 10,
    marginBottom: 5,
  },
  heartRateGraphPlaceholder: {
    width: "100%",
    height: 40,
    backgroundColor: "#FFDDEE",
    borderRadius: 5,
  },
  heartRateValue: {
    color: "#FF69B4",
    fontSize: 18,
  },
  cyclingValue: {
    color: "#00C0FF",
    fontSize: 18,
    fontWeight: "bold",
  },
  stepsCard: {
    backgroundColor: "#FFF3E0",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepsCategory: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
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
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sleepCategory: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  sleepGraphPlaceholder: {
    width: "100%",
    height: 40,
    backgroundColor: "#CCEEFF",
    borderRadius: 5,
  },
  sleepValue: {
    color: "#00BFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  waterCard: {
    backgroundColor: "#E3F2FD",
    width: "48%",
    height: 120,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  waterCategory: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  waterFillPlaceholder: {
    width: "100%",
    height: 60,
    backgroundColor: "#BBDEFB",
    borderRadius: 10,
    justifyContent: "flex-end",
  },
  waterValue: {
    color: "#4682B4",
    paddingBottom: 5,
    paddingLeft: 5,
    fontSize: 18,
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
});

export default DataScreen;
