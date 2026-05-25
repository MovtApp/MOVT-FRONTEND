import "react-native-url-polyfill/auto";
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
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { AppDataProvider } from "@contexts/AppDataContext";
import { StatusBar, ActivityIndicator, View } from "react-native";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import FlashMessage from "react-native-flash-message";
import "react-native-reanimated";
import GlobalErrorBoundary from "./src/components/GlobalErrorBoundary";
import * as Sentry from "@sentry/react-native";
import { preInitializeHC } from "@services/healthConnectService";

Sentry.init({
  dsn: "https://63a1a4145497ba9b5cf511732a408323@o4511396537106432.ingest.us.sentry.io/4511396541825024",
  debug: __DEV__,
  tracesSampleRate: 1.0,
  enableNative: true,
  attachScreenshot: true,
  enableAutoSessionTracking: true,
});

function AppContent() {
  React.useEffect(() => {
    // Inicialização atrasada e super protegida para Health Connect
    const timer = setTimeout(() => {
      try {
        preInitializeHC().catch((err) => {
          console.warn("[App] Falha silenciosa no HC:", err);
          Sentry.captureException(err);
        });
      } catch (err) {
        console.warn("[App] Erro crítico capturado ao iniciar HC:", err);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
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

function App() {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView
          style={{
            flex: 1,
          }}
        >
          <StatusBar barStyle={"dark-content"} />
          <BottomSheetModalProvider>
            <AuthProvider>
              <AppDataProvider>
                <AppContent />
              </AppDataProvider>
            </AuthProvider>
          </BottomSheetModalProvider>
          <FlashMessage position="top" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

export default Sentry.wrap(App);
