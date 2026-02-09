import "./global.css";
import "./src/i18n";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Routes } from "@routes/index";
import { AuthProvider, useAuth } from "@contexts/AuthContext";
import { usePreloadChat } from "@/hooks/useChat";
import { LocationProvider } from "@contexts/LocationContext";
import { NotificationProvider } from "@contexts/NotificationContext";
import { BottomNavProvider } from "@contexts/BottomNavContext";
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
  const [currentRoute, setCurrentRoute] = React.useState<"Auth" | "Verify" | "App">("Auth");

  // Inicia o carregamento de chats em background
  usePreloadChat();

  // Monitora mudanças no estado de autenticação e atualiza a rota atual
  React.useEffect(() => {
    let initialRouteName: "Auth" | "Verify" | "App" = "Auth";
    if (user) {
      if (user.isVerified) {
        initialRouteName = "App";
      } else {
        initialRouteName = "Verify";
      }
    }
    setCurrentRoute(initialRouteName);
  }, [user]);

  if (!fontsLoaded || isLoadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <BottomNavProvider>
      <LocationProvider>
        <NotificationProvider>
          <Routes key={currentRoute} initialRouteName={currentRoute} />
        </NotificationProvider>
      </LocationProvider>
    </BottomNavProvider>
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
