import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { VerifyStackParamList } from "../@types/routes";
import VerifyAccountScreen from "../screens/Verify/verifyAccountScreen";
import VerifyPhoneScreen from "../screens/Verify/verifyPhoneScreen";
import VerifyCompanyScreen from "../screens/Verify/verifyCompanyScreen";
import VerifyCrefScreen from "../screens/Verify/VerifyCrefScreen";
import RecoveryScreen from "../screens/Verify/RecoveryScreen";
import { useAuth } from "@contexts/AuthContext";
import { PHONE_VERIFICATION_ENABLED } from "@/config/featureFlags";

const Stack = createNativeStackNavigator<VerifyStackParamList>();

export function VerifyRoutes() {
  const { user } = useAuth();

  // Decide onde o fluxo de verificação abre, na ordem do funil:
  // - e-mail não confirmado → confirmação de conta (código por e-mail);
  // - telefone não validado → validação por SMS (etapa universal, atrás de flag);
  // - trainer/personal sem CREF validado → validação do CREF.
  // A etapa de empresa (VerifyCompanyScreen) foi desativada e fica em stand by:
  // o registro na Stack continua, mas nenhum caminho do funil aponta para ela.
  const initialRouteName: keyof VerifyStackParamList = !user?.isVerified
    ? "VerifyAccountScreen"
    : PHONE_VERIFICATION_ENABLED && user?.phone_verified === false
      ? "VerifyPhoneScreen"
      : "VerifyCrefScreen";

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VerifyAccountScreen" component={VerifyAccountScreen} />
      <Stack.Screen name="VerifyPhoneScreen" component={VerifyPhoneScreen} />
      {/* Stand by: registrada mas fora do fluxo (nenhuma navegação aponta para ela). */}
      <Stack.Screen name="VerifyCompanyScreen" component={VerifyCompanyScreen} />
      <Stack.Screen name="VerifyCrefScreen" component={VerifyCrefScreen} />
      <Stack.Screen name="RecoveryScreen" component={RecoveryScreen} />
    </Stack.Navigator>
  );
}

export default VerifyRoutes;
