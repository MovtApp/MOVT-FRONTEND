import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "../@types/routes";

// Ref global do NavigationContainer — permite navegar de fora de uma tela
// (ex.: do sheet de upgrade, que vive acima do NavigationContainer).
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Navega até a tela de Planos pelo caminho aninhado real:
// App → AppDrawer → HomeStack → PlanScreen.
export function navigateToPlans() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate(
    "App" as never,
    {
      screen: "AppDrawer",
      params: { screen: "HomeStack", params: { screen: "PlanScreen" } },
    } as never
  );
}
