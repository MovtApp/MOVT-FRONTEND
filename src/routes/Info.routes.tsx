import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GenderScreen from "../screens/Info/GenderScreen";
import AgeScreen from "../screens/Info/AgeScreen";
import HeightScreen from "../screens/Info/HeightScreen";
import WeightScreen from "../screens/Info/WeightScreen";
import LevelScreen from "../screens/Info/LevelScreen";
import WidthScreen from "../screens/Info/WidthScreen";
import ObjectivesScreen from "../screens/Info/ObjectivesScreen";

const Stack = createNativeStackNavigator();

export function InfoRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="GenderScreen"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GenderScreen" component={GenderScreen} />
      <Stack.Screen name="AgeScreen" component={AgeScreen} />
      <Stack.Screen name="HeightScreen" component={HeightScreen} />
      <Stack.Screen name="WeightScreen" component={WeightScreen} />
      <Stack.Screen name="LevelScreen" component={LevelScreen} />
      <Stack.Screen name="WidthScreen" component={WidthScreen} />
      <Stack.Screen name="ObjectivesScreen" component={ObjectivesScreen} />
    </Stack.Navigator>
  );
}

export default InfoRoutes;
