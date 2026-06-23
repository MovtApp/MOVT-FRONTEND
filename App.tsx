import "react-native-url-polyfill/auto";
import "./global.css";
import "./src/i18n";
import React from "react";
import { enableFreeze } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Routes } from "@routes/index";
import { AuthProvider, useAuth } from "@contexts/AuthContext";
import { usePreloadChat } from "@/hooks/useChat";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { LocationProvider } from "@contexts/LocationContext";
import { NotificationProvider } from "@contexts/NotificationContext";
import { BottomNavProvider } from "@contexts/BottomNavContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { UpgradeSheetProvider } from "@components/UpgradeSheetProvider";
import { AppDataProvider } from "@contexts/AppDataContext";
import { ConnectivityProvider } from "@contexts/ConnectivityContext";
import OfflineBanner from "@components/OfflineBanner";
import { StatusBar, ActivityIndicator, View, InteractionManager } from "react-native";
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
import { preloadTodayHealth } from "@/hooks/useHealthTracking";
import { PHONE_VERIFICATION_ENABLED } from "@/config/featureFlags";
// Import por efeito colateral: registra a TaskManager task de rastreamento de
// localização no boot, para o SO conseguir entregar fixes de GPS em background
// (mesmo com a tela apagada / após restart do processo).
import "@services/locationTrackingService";
// Registra os handlers de escrita offline-first (água, missão, …) ANTES de
// ligar a fila, para o flush de boot já encontrar todos os despachantes.
import "@services/registerSyncHandlers";
import { initSyncQueue } from "@services/syncQueue";

// Congela telas fora de foco: elas param de renderizar enquanto não estão
// visíveis, reduzindo o trabalho concorrente na JS thread durante as transições.
enableFreeze(true);

Sentry.init({
  dsn: "https://63a1a4145497ba9b5cf511732a408323@o4511396537106432.ingest.us.sentry.io/4511396541825024",
  debug: __DEV__,
  tracesSampleRate: 1.0,
  enableNative: true,
  // Screenshot só em DEV: em prod capturas vazam PII visual (CPF em forms,
  // valores, mensagens de chat, dados de saúde) para o Sentry.
  attachScreenshot: __DEV__,
  // Defensivo: garante que o SDK não envie email/IP/username junto de eventos.
  sendDefaultPii: false,
  enableAutoSessionTracking: true,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => {
        if (b.data && typeof b.data === "object" && "request_body" in b.data) {
          delete (b.data as any).request_body;
        }
        return b;
      });
    }
    return event;
  },
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
  const [currentRoute, setCurrentRoute] = React.useState<"Auth" | "Verify" | "App" | "Info">(
    "Auth"
  );

  // Inicia o carregamento de chats em background
  usePreloadChat();

  // Liga o motor de sincronização offline-first (fila de escrita) assim que há
  // sessão: reenvia pendências de sessões anteriores e arma os gatilhos de
  // reconexão/foreground. initSyncQueue é idempotente.
  React.useEffect(() => {
    if (!user?.sessionId || user?.isPendingSync) return;
    initSyncQueue();
  }, [user?.sessionId, user?.isPendingSync]);

  // Pré-carrega o resumo de saúde de hoje assim que a sessão está disponível,
  // para que a tela de Dados já abra com os números prontos (sem fetch no mount).
  React.useEffect(() => {
    if (!user?.sessionId || user?.isPendingSync) return;
    const task = InteractionManager.runAfterInteractions(() => {
      preloadTodayHealth();
    });
    return () => task.cancel();
  }, [user?.sessionId, user?.isPendingSync]);

  // Monitora mudanças no estado de autenticação e atualiza a rota atual
  React.useEffect(() => {
    let initialRouteName: "Auth" | "Verify" | "App" | "Info" = "Auth";
    if (user) {
      // Personal trainer (conta CNPJ) precisa passar pela verificação profissional
      // (CREF) antes de acessar o app — bloqueio total até cref_verified=true.
      // Admin é isento: nunca passa pela validação de CNPJ/CREF.
      const isAdmin = user.role?.toLowerCase().includes("admin") ?? false;
      const isTrainer =
        user.documentType === "CNPJ" || user.role === "trainer" || user.role === "personal";
      const needsProfessionalVerification = !isAdmin && isTrainer && !user.cref_verified;
      // Telefone é etapa universal (todas as contas). Contas antigas já vêm com
      // phone_verified=true (grandfather no backend), então não são afetadas.
      // Desativada temporariamente via PHONE_VERIFICATION_ENABLED (ver featureFlags).
      const needsPhoneVerification =
        PHONE_VERIFICATION_ENABLED && !isAdmin && user.phone_verified === false;
      // Dados pessoais (onboarding Info) é o último gate universal, após todas as
      // verificações. Contas antigas já vêm com onboarding_completed=true.
      const needsOnboarding = !isAdmin && user.onboarding_completed === false;

      if (!user.isVerified || needsPhoneVerification || needsProfessionalVerification) {
        initialRouteName = "Verify";
      } else if (needsOnboarding) {
        initialRouteName = "Info";
      } else {
        initialRouteName = "App";
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
          <PushNotificationsBridge />
          <Routes key={currentRoute} initialRouteName={currentRoute} />
        </NotificationProvider>
      </LocationProvider>
    </BottomNavProvider>
  );
}

// Ativa o registro de push + listeners de notificação. Vive dentro do
// NotificationProvider para ler o chat ativo (supressão estilo WhatsApp).
function PushNotificationsBridge() {
  usePushNotifications();
  return null;
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
          <KeyboardProvider>
            <ConnectivityProvider>
              <BottomSheetModalProvider>
                <AuthProvider>
                  <AppDataProvider>
                    <UpgradeSheetProvider>
                      <AppContent />
                    </UpgradeSheetProvider>
                  </AppDataProvider>
                </AuthProvider>
              </BottomSheetModalProvider>
              <OfflineBanner />
            </ConnectivityProvider>
            <FlashMessage position="top" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

export default Sentry.wrap(App);
