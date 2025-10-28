import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StepsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes de Passos</Text>
      <Text style={styles.subtitle}>
        Informações sobre seus passos diários.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});

export default StepsScreen;
