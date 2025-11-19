import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { RootStackParamList, AppStackParamList, AppDrawerParamList } from "../@types/routes";
import { ChartPie, House, Map, MessageCircle, Soup } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useIsFocused } from "@react-navigation/native";

interface NavItem {
  name: keyof AppStackParamList;
  label: string;
  icon: any;
}

// ===== LISTA CONFIGURÁVEL DE TELAS QUE NÃO EXIBEM O BOTTOMNAVIGATIONBAR =====
// Adicione ou remova nomes de telas conforme necessário
const HIDDEN_SCREENS = [
  "ProfileScreen",
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "WaterScreen",
];
// ============================================================================

// Função para verificar se a tela atual deve esconder o BottomNavigationBar
const shouldHideBottomNavigationBar = (currentScreen: string | null): boolean => {
  if (!currentScreen) return false;
  // Normaliza o nome da tela para garantir comparação correta
  const normalizedScreen = currentScreen.trim();
  return HIDDEN_SCREENS.includes(normalizedScreen);
};

const BottomNavigationBar = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList & AppDrawerParamList>>();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<keyof AppStackParamList>("HomeScreen");
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  const appStackScreenNames = useMemo(
    () => ["HomeScreen", "MapScreen", "DietScreen", "DataScreen", "ChatScreen"],
    []
  );

  // Verifica se a tela atual deve ocultar o BottomNavigationBar
  const shouldHide = useMemo(() => {
    return shouldHideBottomNavigationBar(currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    // Obter a rota ativa mais profunda
    const getDeepRoute = (state: any): string | null => {
      if (!state) return null;

      // Tenta pegar a rota ativa mais profunda recursivamente
      let current = state;

      while (current && current.routes && current.index !== undefined) {
        const activeRoute = current.routes[current.index];
        if (!activeRoute) break;

        // Se houver state aninhado, continua descendo
        if (activeRoute.state) {
          current = activeRoute.state;
        } else {
          // Retorna o nome da rota ativa mais profunda
          if (activeRoute.name) {
            return activeRoute.name as string;
          }
          break;
        }
      }

      // Caso o percurso normal não funcione, tenta alternativas
      if (state.routes && state.index !== undefined) {
        const activeRoute = state.routes[state.index];
        if (activeRoute) {
          // Verifica params.screen como fallback
          if (activeRoute.params && typeof activeRoute.params === "object") {
            const screen = (activeRoute.params as any).screen;
            if (screen && typeof screen === "string") {
              return screen;
            }
          }
          return activeRoute.name as string;
        }
      }

      return null;
    };

    if (isFocused) {
      const navState = navigation.getState();
      const deepRoute = getDeepRoute(navState);

      if (deepRoute) {
        setCurrentScreen(deepRoute);

        // Atualiza a aba ativa se for uma tela de navegação
        if (appStackScreenNames.includes(deepRoute as keyof AppStackParamList)) {
          setActiveTab(deepRoute as keyof AppStackParamList);
        }
      }
    }
  }, [isFocused, navigation, appStackScreenNames]);

  const navItems: NavItem[] = [
    {
      name: "HomeScreen",
      label: "Início",
      icon: House,
    },
    {
      name: "MapScreen",
      label: "Mapa",
      icon: Map,
    },
    {
      name: "DietScreen",
      label: "Dieta",
      icon: Soup,
    },
    {
      name: "DataScreen",
      label: "Dados",
      icon: ChartPie,
    },
    {
      name: "ChatScreen",
      label: "Chat",
      icon: MessageCircle,
    },
  ];

  const navigateTo = (screenName: keyof AppStackParamList) => {
    setActiveTab(screenName);
    navigation.navigate("App", {
      screen: "HomeStack",
      params: { screen: screenName },
    });
  };

  // Se deve esconder, retorna null
  if (shouldHide) {
    return null;
  }

  return (
    <View style={styles.container}>
      {navItems.map((item: NavItem) => {
        const isActive = activeTab === item.name;
        return (
          <TouchableOpacity
            key={item.name as string}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => navigateTo(item.name)}
          >
            <item.icon size={24} color={isActive ? "#192126" : "#fff"} />
            {isActive && <Text style={styles.activeNavText}>{item.label}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1E232C",
    height: 60,
    borderRadius: 100,
    marginHorizontal: 20,
    marginBottom: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeNavItem: {
    flexDirection: "row",
    backgroundColor: "#8BC34A",
    borderRadius: 25,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavText: {
    color: "#192126",
    marginLeft: 8,
    fontWeight: "bold",
  },
});

export default BottomNavigationBar;
