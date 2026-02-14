import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";

// Captura largura da tela
const { width: screenWidth } = Dimensions.get("window");

export type TimeframeType = "1d" | "1s" | "1m" | "1a" | "Tudo";

interface TimeSelectorProps {
  selectedTimeframe: TimeframeType;
  onTimeframeChange: (timeframe: TimeframeType) => void;
  isLoading?: boolean;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  selectedTimeframe,
  onTimeframeChange,
  isLoading = false,
}) => {
  const timeframeOptions: TimeframeType[] = ["1d", "1s", "1m", "1a", "Tudo"];

  return (
    <View style={styles.wrapper}>
      <View style={styles.timeSelectorContainer}>
        {timeframeOptions.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeButton,
              selectedTimeframe === timeframe && styles.selectedTimeButton,
            ]}
            onPress={() => onTimeframeChange(timeframe)}
            disabled={isLoading}
          >
            <View style={styles.buttonContent}>
              <Text
                style={[
                  styles.timeButtonText,
                  selectedTimeframe === timeframe && styles.selectedTimeButtonText,
                ]}
              >
                {timeframe}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Valores proporcionais à largura da tela (responsivos)
const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },

  timeSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 20,
    width: "80%",
  },

  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
  },

  selectedTimeButton: {
    backgroundColor: "#192126",
  },

  timeButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 14,
  },

  selectedTimeButtonText: {
    color: "#fff",
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TimeSelector;
