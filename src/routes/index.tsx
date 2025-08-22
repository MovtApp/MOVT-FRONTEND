import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/splashScreen";
import RootStackParamList from "../@types/routes";

// Import routes
import AuthRoutes from "./Auth.routes";
import AppRoutes from "./App.routes";
import VerifyRoutes from "./Verify.routes";
import InfoRoutes from "./Info.routes";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="App" component={AppRoutes} />
        <Stack.Screen name="Auth" component={AuthRoutes} />
        <Stack.Screen name="Info" component={InfoRoutes} />
        <Stack.Screen name="Verify" component={VerifyRoutes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
