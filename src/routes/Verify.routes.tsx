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
  // - LEGADO: conta CNPJ ainda não validada → validação da empresa (CNPJ + CNAE);
  // - Personal (CPF + CREF) e CNPJ já validado → vão direto ao CREF.
  // O cadastro novo é sempre Personal (CPF + CREF), então a etapa de empresa só
  // aparece para contas CNPJ antigas que ainda não passaram por ela.
  const initialRouteName: keyof VerifyStackParamList = !user?.isVerified
    ? "VerifyAccountScreen"
    : PHONE_VERIFICATION_ENABLED && user?.phone_verified === false
      ? "VerifyPhoneScreen"
      : user?.documentType === "CNPJ" && !user?.cnpj_verified
        ? "VerifyCompanyScreen"
        : "VerifyCrefScreen";

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VerifyAccountScreen" component={VerifyAccountScreen} />
      <Stack.Screen name="VerifyPhoneScreen" component={VerifyPhoneScreen} />
      <Stack.Screen name="VerifyCompanyScreen" component={VerifyCompanyScreen} />
      <Stack.Screen name="VerifyCrefScreen" component={VerifyCrefScreen} />
      <Stack.Screen name="RecoveryScreen" component={RecoveryScreen} />
    </Stack.Navigator>
  );
}

export default VerifyRoutes;
