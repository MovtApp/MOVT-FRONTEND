import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";

// Lista ordenada das telas de dados para navegação
const DATA_SCREENS: (keyof AppStackParamList)[] = [
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "WaterScreen",
];

const CyclingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton to={{ name: "DataScreen" }} />
            <Text style={styles.headerTitle}>Ciclismo</Text>
            <View style={{ width: 46 }} />
          </View>

          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>Dados de Ciclismo</Text>
            <Text style={styles.placeholderSub}>Em breve</Text>
          </View>
        </View>
      </ScrollView>

      <NavigationArrows currentScreen="CyclingScreen" screens={DATA_SCREENS} />
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 16,
    color: "#666",
  },
});

export default CyclingScreen;
