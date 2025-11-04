import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { VerifyStackParamList } from "../@types/routes";
import VerifyAccountScreen from "../screens/Verify/verifyAccountScreen";
import VerifyPhoneScreen from "../screens/Verify/verifyPhoneScreen";
import VerifyCompanyScreen from "../screens/Verify/verifyCompanyScreen";
import VerifyCNPJScreen from "../screens/Verify/VerifyCNPJScreen";
import VerifyCrefScreen from "../screens/Verify/VerifyCrefScreen";
import RecoveryScreen from "../screens/Verify/RecoveryScreen";

const Stack = createNativeStackNavigator<VerifyStackParamList>();

export function VerifyRoutes() {
  return (
    <Stack.Navigator initialRouteName="VerifyAccountScreen" screenOptions={{ headerShown: false }}>
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
