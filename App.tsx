import "./global.css";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Routes } from "@routes/index";
import { AuthProvider, useAuth } from "@contexts/AuthContext";
import { LocationProvider } from "@contexts/LocationContext";
import { NotificationProvider } from "@contexts/NotificationContext";
import { StatusBar, ActivityIndicator, View } from "react-native";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import "react-native-reanimated";

function AppContent() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });

  const { loading: isLoadingAuth, user } = useAuth();

  if (!fontsLoaded || isLoadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  let initialRouteName: "Auth" | "Verify" | "App" = "Auth";
  if (user) {
    if (user.isVerified) {
      initialRouteName = "App";
    } else {
      initialRouteName = "Verify";
    }
  }

  return (
    <LocationProvider>
      <NotificationProvider>
        <Routes initialRouteName={initialRouteName} />
      </NotificationProvider>
    </LocationProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView
        style={{
          flex: 1,
        }}
      >
        <StatusBar barStyle={"light-content"} translucent />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
