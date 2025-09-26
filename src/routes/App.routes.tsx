import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/App/homeScreen";
import MapScreen from "../screens/App/mapScreen";
import DietScreen from "../screens/App/dietScreen";
import DataScreen from "../screens/App/dataScreen";
import ChatScreen from "../screens/App/chatScreen";
import BottomNavigationBar from "../components/BottomNavigationBar";
import { View, StyleSheet } from "react-native";
import DietDetailsScreen from "../screens/App/dietDetailsScreen";

const Stack = createNativeStackNavigator();

function AppLayout() {
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
      </Stack.Navigator>
      <BottomNavigationBar />
    </View>
  );
}

export function AppRoutes() {
  return <AppLayout />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppRoutes;
