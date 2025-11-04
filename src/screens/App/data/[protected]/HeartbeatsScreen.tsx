import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { Heart, Activity, Wind } from "lucide-react-native";

const { width } = Dimensions.get("window");

// Lista ordenada das telas de dados para navegação
const DATA_SCREENS: (keyof AppStackParamList)[] = [
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "TrainingScreen",
  "WaterScreen",
];

const HeartbeatsScreen: React.FC = () => {
  // Valores de exemplo - podem ser substituídos por dados reais
  const heartRate = 112;
  const pressure = 112;
  const oxygen = 95;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.headerTitle}>Frequência cardíaca</Text>
            <View style={{ width: 46 }} />
          </View>

          {/* Heart Rate Info */}
          <View style={styles.heartRateContainer}>
            <View style={styles.heartRatePrimaryInfo}>
              <Heart size={40} color="#FF0000" fill="#FF0000" style={{ marginRight: 15 }} />
              <Text style={styles.heartRateValue}>
                {heartRate}
                <Text style={styles.heartRateUnit}> bpm</Text>
              </Text>
            </View>
          </View>

          {/* Image Section */}
          <View style={styles.imageSection}>
            <Image
              source={require("../../../../assets/woman-running.png")}
              style={styles.womanImage}
              resizeMode="contain"
            />
          </View>

          {/* Cards Section */}
          <View style={styles.cardsSection}>
            {/* Card Pressão */}
            <View style={[styles.card, styles.cardLeft]}>
              <Text style={styles.cardTitle}>Pressão</Text>
              <View style={styles.cardContent}>
                <Activity size={24} color="#FF8C00" style={{ marginRight: 12 }} />
                <View style={styles.cardValueContainer}>
                  <Text style={styles.cardValue}>{pressure}</Text>
                  <Text style={styles.cardUnit}>mmHg</Text>
                </View>
              </View>
            </View>

            {/* Card Oxigênio */}
            <View style={[styles.card, styles.cardRight]}>
              <Text style={styles.cardTitle}>Oxigênio</Text>
              <View style={styles.cardContent}>
                <Wind size={24} color="#00BFFF" style={{ marginRight: 12 }} />
                <View style={styles.cardValueContainer}>
                  <Text style={styles.cardValue}>{oxygen}</Text>
                  <Text style={styles.cardUnit}>Sp02</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Setas de navegação fixas nas laterais */}
      <NavigationArrows currentScreen="HeartbeatsScreen" screens={DATA_SCREENS} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
    textDecorationLine: "underline",
    textDecorationColor: "#00BFFF",
  },
  heartRateContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  heartRatePrimaryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  heartRateValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#192126",
  },
  heartRateUnit: {
    fontSize: 24,
    fontWeight: "normal",
    color: "#797E86",
  },
  imageSection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 300,
  },
  womanImage: {
    width: width * 0.7,
    height: width * 0.9,
    maxHeight: 400,
  },
  cardsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardLeft: {
    marginRight: 7.5,
  },
  cardRight: {
    marginLeft: 7.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#192126",
    marginBottom: 15,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardValueContainer: {
    flexDirection: "column",
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#192126",
  },
  cardUnit: {
    fontSize: 14,
    color: "#797E86",
    marginTop: -4,
  },
});

export default HeartbeatsScreen;
