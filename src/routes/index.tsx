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

interface RoutesProps {
  initialRouteName?: "Auth" | "Verify" | "App"; // Aceita a rota inicial como prop
}

export function Routes({ initialRouteName }: RoutesProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName || "Auth"} // Usa a prop, ou 'Auth' como padrão
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* A SplashScreen será gerenciada pelo App.tsx ou exibida apenas brevemente */}
        {/* <Stack.Screen name="SplashScreen" component={SplashScreen} /> */}
        <Stack.Screen name="App" component={AppRoutes} />
        <Stack.Screen name="Auth" component={AuthRoutes} />
        <Stack.Screen name="Info" component={InfoRoutes} />
        <Stack.Screen name="Verify" component={VerifyRoutes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
