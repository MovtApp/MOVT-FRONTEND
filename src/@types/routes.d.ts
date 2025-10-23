export type AppStackParamList = {
  HomeStack: undefined;
  HomeScreen: undefined;
  DietScreen: undefined;
  MapScreen: undefined;
  DietDetails: { meal: DietMeal };
  DataScreen: undefined;
  ChatScreen: undefined; // Adicionando ChatScreen à lista de rotas
  CaloriesScreen: undefined;
  CyclingScreen: undefined;
  HeartbeatsScreen: undefined;
  SleepScreen: undefined;
  StepsScreen: undefined;
  TrainingScreen: undefined;
  WaterScreen: undefined;
  HeightScreen: undefined;
  WeightScreen: undefined;
  AgeScreen: undefined;
  WelcomeScreen: undefined;
};

export interface DietMeal {
  id_dieta: string;
  id: string;
  title: string;
  calories?: string | undefined;
  minutes?: string | undefined;
  imageUrl: string;
  authorName: string;
  authorAvatar: string;
  description?: string;
  fat?: string | undefined;
  protein?: string | undefined;
  carbs?: string | undefined;
  categoria?: string;
}

export type AppDrawerParamList = {
  HomeStack: { screen: keyof AppStackParamList; params?: any };
  // Adicione aqui outras rotas diretas do drawer, se houver
};

export type AuthStackParamList = {
  SignInScreen: undefined;
  SignUpScreen: undefined;
  VerifyAccountScreen: undefined;
};

export type VerifyStackParamList = {
  VerifyAccountScreen: { sessionId?: string };
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
  App:
    | { screen: keyof AppDrawerParamList; params?: AppDrawerParamList[keyof AppDrawerParamList] }
    | undefined;
  Auth: { screen: keyof AuthStackParamList } | undefined;
  Info:
    | {
        screen: keyof InfoStackParamList;
        params?: InfoStackParamList[keyof InfoStackParamList];
      }
    | undefined;
  Verify: {
    screen: keyof VerifyStackParamList;
    params?: VerifyStackParamList[keyof VerifyStackParamList];
  } | undefined;
};

export default RootStackParamList;
