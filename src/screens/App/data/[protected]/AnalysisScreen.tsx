import Header from "@components/Header";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";

export const AnalysisScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Text>Analysis Screen</Text>
      <DataPillNavigator currentScreen="ResultsScreen" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
