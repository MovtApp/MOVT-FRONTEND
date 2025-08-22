import "./src/styles/global.css";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Routes } from "@routes/index";
import { AuthProvider } from "@contexts/AuthContext";
import { StatusBar, ActivityIndicator, View } from "react-native";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView
        style={{
          flex: 1,
        }}
      >
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </GestureHandlerRootView>
      <StatusBar barStyle={"light-content"} translucent />
    </SafeAreaProvider>
  );
}
