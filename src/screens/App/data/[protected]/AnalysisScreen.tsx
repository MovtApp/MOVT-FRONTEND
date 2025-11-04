import Header from "@components/Header";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const AnalysisScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Text>Analysis Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
