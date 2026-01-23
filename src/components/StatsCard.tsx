import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Clock, Flame } from "lucide-react-native";

interface StatsCardProps {
  time: string;
  calories: string;
  style?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({ time, calories, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statItem}>
        <View style={[styles.iconBox, { backgroundColor: "#C2F74D" }]}>
          <Clock size={20} color="#192126" />
        </View>
        <View>
          <Text style={styles.statLabel}>Tempo</Text>
          <Text style={styles.statValue}>{time}</Text>
        </View>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={[styles.iconBox, { backgroundColor: "#C2F74D" }]}>
          <Flame size={20} color="#192126" />
        </View>
        <View>
          <Text style={styles.statLabel}>Calorias</Text>
          <Text style={styles.statValue}>{calories}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#192126",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignSelf: "center",
    width: "80%",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  statValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#374151",
  },
});
