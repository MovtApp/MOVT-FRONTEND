export type AppStackParamList = {
  HomeScreen: undefined;
};

export type AuthStackParamList = {
  SignInScreen: undefined;
  SignUpScreen: undefined;
  VerifyAccountScreen: undefined;
};

export type VerifyStackParamList = {
  VerifyAccountScreen: undefined;
  VerifyPhoneScreen: undefined;
  VerifyCompanyScreen: undefined;
  VerifyCNPJScreen: undefined;
  VerifyCrefScreen: undefined;
  RecoveryScreen: undefined;
};

export type InfoStackParamList = {
  AgeScreen: undefined;
  GenderScreen: undefined;
  HeightScreen: { age?: number } | undefined;
  LevelScreen: undefined;
  ObjectivesScreen: undefined;
  WeightScreen: undefined;
  WidthScreen: undefined;
};

export type RootStackParamList = {
  SplashScreen: undefined;
  App: { screen: keyof AppStackParamList } | undefined;
  Auth: { screen: keyof AuthStackParamList } | undefined;
  Info:
    | {
        screen: keyof InfoStackParamList;
        params?: InfoStackParamList[keyof InfoStackParamList];
      }
    | undefined;
  Verify: { screen: keyof VerifyStackParamList } | undefined;
};

export default RootStackParamList;
