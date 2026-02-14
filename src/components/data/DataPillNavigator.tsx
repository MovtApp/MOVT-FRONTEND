import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { Flame, Footprints, Heart, Droplets, Moon, Bike } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../@types/routes";

type DataPillNavigatorProps = {
  currentScreen: keyof AppStackParamList;
};

const SCREEN_MAPPING = [
  { screen: "CaloriesScreen", icon: Flame, color: "#FF7D00" },
  { screen: "StepsScreen", icon: Footprints, color: "#2563EB" },
  { screen: "HeartbeatsScreen", icon: Heart, color: "#EF4444" },
  { screen: "WaterScreen", icon: Droplets, color: "#00BFFF" },
  { screen: "SleepScreen", icon: Moon, color: "#8B5CF6" },
  { screen: "CyclingScreen", icon: Bike, color: "#10B981" },
];

const DataPillNavigator: React.FC<DataPillNavigatorProps> = ({ currentScreen }) => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        {SCREEN_MAPPING.map((item) => {
          const isActive = currentScreen === item.screen;
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.screen}
              style={[styles.iconContainer, isActive && styles.activeIconContainer]}
              onPress={() => navigation.navigate(item.screen as any)}
              activeOpacity={0.7}
            >
              <Icon
                size={20}
                color={isActive ? "#FFFFFF" : "#9CA3AF"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 15 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  pill: {
    flexDirection: "row",
    backgroundColor: "rgba(25, 33, 38, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  activeDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
});

export default DataPillNavigator;
