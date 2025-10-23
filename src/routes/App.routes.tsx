import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer"; // Importar createDrawerNavigator
import HomeScreen from "../screens/App/home/homeScreen"; // Caminho corrigido
import MapScreen from "../screens/App/map/mapScreen";
import DietScreen from "../screens/App/diet/dietScreen";
import DataScreen from "../screens/App/data/dataScreen";
import ChatScreen from "../screens/App/chat/chatScreen"; // Caminho corrigido
import BottomNavigationBar from "../components/BottomNavigationBar";
import { View, StyleSheet } from "react-native";
import DietDetailsScreen from "../screens/App/diet/dietDetailsScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent"; // Importar CustomDrawerContent
import { AppStackParamList } from "../@types/routes";

// Importações das telas de detalhes de dados
import CaloriesScreen from "../screens/App/data/[protected]/CaloriesScreen";
import CyclingScreen from "../screens/App/data/[protected]/CyclingScreen";
import HeartbeatsScreen from "../screens/App/data/[protected]/HeartbeatsScreen";
import SleepScreen from "../screens/App/data/[protected]/SleepScreen";
import StepsScreen from "../screens/App/data/[protected]/StepsScreen";
import TrainingScreen from "../screens/App/data/[protected]/TrainingScreen";
import WaterScreen from "../screens/App/data/[protected]/WaterScreen";


const Stack = createNativeStackNavigator<AppStackParamList>();
const Drawer = createDrawerNavigator(); // Definir o Drawer Navigator

function AppLayout() {
  // Removendo isDietSheetOpen e setIsDietSheetOpen, pois não são mais usados para controlar a visibilidade da BottomNavigationBar.
  return (
    <View style={styles.container}>
      <Stack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="DietScreen" component={DietScreen} />
        <Stack.Screen name="DietDetails" component={DietDetailsScreen} />
        <Stack.Screen name="DataScreen" component={DataScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="CaloriesScreen" component={CaloriesScreen} />
        <Stack.Screen name="CyclingScreen" component={CyclingScreen} />
        <Stack.Screen name="HeartbeatsScreen" component={HeartbeatsScreen} />
        <Stack.Screen name="SleepScreen" component={SleepScreen} />
        <Stack.Screen name="StepsScreen" component={StepsScreen} />
        <Stack.Screen name="TrainingScreen" component={TrainingScreen} />
        <Stack.Screen name="WaterScreen" component={WaterScreen} />
      </Stack.Navigator>
      <BottomNavigationBar /> {/* Renderizando BottomNavigationBar diretamente, pois isDietSheetOpen não a controla mais. */}
    </View>
  );
}

function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerStyle: { backgroundColor: '#192126' }, // Definir a cor de fundo do drawer
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />} // Usar o CustomDrawerContent
    >
      <Drawer.Screen name="HomeStack" component={AppLayout} />
    </Drawer.Navigator>
  );
}

export function AppRoutes() {
  return <AppDrawerNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppRoutes;
