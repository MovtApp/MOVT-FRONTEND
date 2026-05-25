import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Flame, Footprints, Heart, Droplets, Moon, Bike } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  // Estratégia de posicionamento dinâmico:
  // Se o insets.bottom for 0 (celulares com botões físicos/antigos), usamos um valor padrão.
  // Se for maior que 0 (gestos/celulares modernos), usamos o insets + um pequeno respiro.
  const dynamicBottom = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { bottom: dynamicBottom }]}>
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
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999, // Garantir que fique acima de tudo
    elevation: 20, // Sombra extra no Android
  },
  pill: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 15, 20, 0.92)", // Mais escuro e premium
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    // Efeito de desfoque no iOS (opcional, mas bom ter)
    ...(Platform.OS === "ios" && {
      backdropFilter: "blur(20px)",
    }),
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  activeDot: {
    position: "absolute",
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default DataPillNavigator;
