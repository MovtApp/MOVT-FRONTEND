import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { VerifyStackParamList } from "../@types/routes";
import VerifyAccountScreen from "../screens/Verify/verifyAccountScreen";
import VerifyPhoneScreen from "../screens/Verify/verifyPhoneScreen";
import VerifyCompanyScreen from "../screens/Verify/verifyCompanyScreen";
import VerifyCNPJScreen from "../screens/Verify/VerifyCNPJScreen";
import VerifyCrefScreen from "../screens/Verify/VerifyCrefScreen";
import RecoveryScreen from "../screens/Verify/RecoveryScreen";
import { useAuth } from "@contexts/AuthContext";

const Stack = createNativeStackNavigator<VerifyStackParamList>();

export function VerifyRoutes() {
  const { user } = useAuth();

  // Se o e-mail já está confirmado e o que falta é a verificação profissional
  // (personal trainer / CNPJ), o fluxo abre direto na validação da empresa/CREF.
  // Caso contrário, abre na confirmação de conta (código por e-mail).
  const initialRouteName: keyof VerifyStackParamList = user?.isVerified
    ? "VerifyCompanyScreen"
    : "VerifyAccountScreen";

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VerifyAccountScreen" component={VerifyAccountScreen} />
      <Stack.Screen name="VerifyPhoneScreen" component={VerifyPhoneScreen} />
      <Stack.Screen name="VerifyCompanyScreen" component={VerifyCompanyScreen} />
      <Stack.Screen name="VerifyCNPJScreen" component={VerifyCNPJScreen} />
      <Stack.Screen name="VerifyCrefScreen" component={VerifyCrefScreen} />
      <Stack.Screen name="RecoveryScreen" component={RecoveryScreen} />
    </Stack.Navigator>
  );
}

export default VerifyRoutes;
