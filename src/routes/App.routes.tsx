import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer"; // Importar createDrawerNavigator
import HomeScreen from "../screens/App/homeScreen";
import MapScreen from "../screens/App/mapScreen";
import DietScreen from "../screens/App/dietScreen";
import DataScreen from "../screens/App/dataScreen";
import ChatScreen from "../screens/App/chatScreen";
import BottomNavigationBar from "../components/BottomNavigationBar";
import { View, StyleSheet } from "react-native";
import DietDetailsScreen from "../screens/App/dietDetailsScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent"; // Importar CustomDrawerContent
import { AppStackParamList } from "../@types/routes";

const Stack = createNativeStackNavigator<AppStackParamList>();
const Drawer = createDrawerNavigator(); // Definir o Drawer Navigator

function AppLayout() {
  const [isDietSheetOpen, setIsDietSheetOpen] = useState(false);

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
        <Stack.Screen name="DietScreen" component={DietScreen} initialParams={{ setIsDietSheetOpen }} />
        <Stack.Screen name="DietDetails" component={DietDetailsScreen} />
        <Stack.Screen name="DataScreen" component={DataScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
      </Stack.Navigator>
      {!isDietSheetOpen && <BottomNavigationBar />}
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
