import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { SplashScreen } from "../screens/splashScreen"; // Removida importação não utilizada
import { RootStackParamList } from "../@types/routes"; // Corrigida a importação de RootStackParamList
import { navigationRef } from "../services/navigationRef";
import {
  loadNavState,
  saveNavState,
  markRestoreSettled,
} from "../services/navStatePersistence";

// Import routes
import { AuthRoutes } from "./Auth.routes";
import { AppRoutes } from "./App.routes";
import { VerifyRoutes } from "./Verify.routes";
import { InfoRoutes } from "./Info.routes";

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RoutesProps {
  initialRouteName?: "Auth" | "Verify" | "App" | "Info"; // Aceita a rota inicial como prop
}

export function Routes({ initialRouteName }: RoutesProps) {
  // Restauração de tela só faz sentido no cold start: se o app abre direto na área
  // autenticada "App", recupera a última tela (com os params). Capturado UMA vez no
  // mount via ref — trocas de área depois (login/logout in-app, que agora vêm por
  // resetRoot no App.tsx e não mais por remontagem) nunca re-disparam o restore. As
  // demais áreas (Auth/Verify/Info) renderizam de imediato, sem esperar o AsyncStorage.
  const needsRestoreRef = React.useRef(initialRouteName === "App");
  // O initialRouteName do Navigator também é congelado no mount: o React Navigation só
  // o lê na primeira montagem, e a partir daí a área é dirigida por resetRoot.
  const initialAreaRef = React.useRef(initialRouteName);
  const [isReady, setIsReady] = React.useState(!needsRestoreRef.current);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estado serializado do React Navigation
  const [initialState, setInitialState] = React.useState<any>(undefined);

  React.useEffect(() => {
    if (!needsRestoreRef.current) return;
    let mounted = true;
    (async () => {
      try {
        const state = await loadNavState();
        if (mounted && state) setInitialState(state);
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={initialState}
      onReady={() => {
        // Restauração assentou: libera o crash-guard depois de um respiro,
        // tempo suficiente p/ a tela montar (se fosse quebrar, já teria quebrado
        // e o GlobalErrorBoundary teria assumido, mantendo a flag p/ abrir limpo).
        if (initialState) {
          setTimeout(() => {
            markRestoreSettled();
          }, 4000);
        }
      }}
      onStateChange={(state) => saveNavState(state)}
    >
      <Stack.Navigator
        initialRouteName={initialAreaRef.current || "Auth"} // Área do mount; trocas depois vão por resetRoot
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
