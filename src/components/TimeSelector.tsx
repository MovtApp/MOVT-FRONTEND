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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  timeSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    paddingVertical: screenWidth * 0.02, // padding vertical proporcional
    paddingHorizontal: screenWidth * 0.03, // padding horizontal proporcional
    marginBottom: screenWidth * 0.05, // margem inferior responsiva
    height: 50,
    width: screenWidth * 0.8, // largura ocupa 80% da tela
  },

  timeButton: {
    paddingVertical: screenWidth * 0.015,
    paddingHorizontal: screenWidth * 0.03,
    borderRadius: 10,
  },

  selectedTimeButton: {
    backgroundColor: "#192126",
  },

  timeButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: screenWidth * 0.04, // tamanho de texto também responsivo
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
