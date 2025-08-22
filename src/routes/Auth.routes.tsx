import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StartupScreen } from "../screens/Auth/startupScreen";
import { SignInScreen } from "../screens/Auth/signinScreen";
import { SignUpScreen } from "../screens/Auth/signupScreen";
const Stack = createNativeStackNavigator();

export function AuthRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="StartupScreen"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StartupScreen" component={StartupScreen} />
      <Stack.Screen name="SignInScreen" component={SignInScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

export default AuthRoutes;
