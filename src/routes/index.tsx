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
  // Só a área autenticada "App" restaura a última tela (com os params). As demais
  // áreas (Auth/Verify/Info) renderizam de imediato, sem esperar o AsyncStorage.
  const needsRestore = initialRouteName === "App";
  const [isReady, setIsReady] = React.useState(!needsRestore);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estado serializado do React Navigation
  const [initialState, setInitialState] = React.useState<any>(undefined);

  React.useEffect(() => {
    if (!needsRestore) return;
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
  }, [needsRestore]);

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
