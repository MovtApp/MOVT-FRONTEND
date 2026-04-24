import Header from "@components/Header";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";

export const AnalysisScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Analysis Screen</Text>
      </View>
      <DataPillNavigator currentScreen="ResultsScreen" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
