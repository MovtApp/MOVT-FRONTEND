import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/App/home/homeScreen";
import MapScreen from "../screens/App/map/mapScreen";
import DietScreen from "../screens/App/diet/dietScreen";
import DataScreen from "../screens/App/data/dataScreen";
import ChatScreen from "../screens/App/chat/chatScreen";
import ChatProtected from "../screens/App/chat/[protected]/chat";
import BottomNavigationBar from "../components/BottomNavigationBar";
import { View, StyleSheet } from "react-native";
import DietDetailsScreen from "../screens/App/diet/dietDetailsScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent";
import { AppStackParamList } from "../@types/routes";
import ProfilePFScreen from "../screens/App/profile/profilePFScreen";
import ProfilePJ from "../screens/App/profile/ProfilePJScreen";
import { TrainerProfileScreen } from "../screens/App/profile/TrainerProfileScreen";
import SelectedTrainersScreen from "../screens/App/profile/SelectedTrainersScreen";
import ConfigScreen from "../screens/App/config/configScreen";
import NotificationPreferencesScreen from "../screens/App/config/NotificationPreferencesScreen";
import PlanScreen from "../screens/App/plan/planScreen";
import FAQScreen from "../screens/App/faq/faqScreen";
import ServiceScreen from "../screens/App/service/serviceScreen";
import ReviewScreen from "../screens/App/reviews/reviewScreen";
import TermsScreen from "../screens/App/terms&conditions/termsScreen";
import PoliciesScreen from "../screens/App/policies/policiesScreen";
import AboutScreen from "../screens/App/about/aboutScreen";
import PlatformRulesScreen from "../screens/App/rules/PlatformRulesScreen";

// Importando o Appointment do novo local
import Appointment from "../screens/App/appointments/[protected]/appointment";
import { AppointmentScreen } from "../screens/App/appointments/appointmentScreen";

// Importações das telas de detalhes de dados
import CaloriesScreen from "../screens/App/data/[protected]/CaloriesScreen";
import CyclingScreen from "../screens/App/data/[protected]/CyclingScreen";
import HeartbeatsScreen from "../screens/App/data/[protected]/HeartbeatsScreen";
import SleepScreen from "../screens/App/data/[protected]/SleepScreen";
import StepsScreen from "../screens/App/data/[protected]/StepsScreen";
import WaterScreen from "../screens/App/data/[protected]/WaterScreen";
import ResultsScreen from "../screens/App/data/[protected]/ResultsScreen";
import TestWearScreen from "../screens/TestWearScreen";
import CommunityScreen from "@screens/App/communities/communityScreen";
import CommunityDetails from "../screens/App/communities/[protected]/community";
import TrainingScreen from "../screens/App/training/trainingScreen";
import TrainingDetails from "../screens/App/training/[protected]/training";
import ChallengeDetails from "../screens/App/training/[protected]/challengeDetails";
import FeedScreen from "../screens/Feed/FeedScreen";
import { NotificationDrawerContent } from "../components/NotificationModal";
import PostDetailScreen from "../screens/Feed/PostDetailScreen";
import ArchivedPostsScreen from "../screens/App/profile/ArchivedPostsScreen";
import EditProfileScreen from "../screens/App/profile/EditProfileScreen";
import ActiveWorkout from "../screens/App/training/[protected]/activeWorkout";

import ExpectationRealityScreen from "../screens/App/biometrics/ExpectationRealityScreen";
import AdminDashboardScreen from "../screens/App/admin/AdminDashboardScreen";
import PersonalDashboard from "../screens/App/personal/[protected]/PersonalDashboard";

const Stack = createNativeStackNavigator<AppStackParamList>();
const LeftDrawer = createDrawerNavigator();
const RightDrawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Nomes das 5 telas principais que vivem dentro do Tab navigator (mantidas
// montadas para troca instantânea). Exportado para a navegação saber rotear.
export const MAIN_TAB_SCREENS = [
  "HomeScreen",
  "MapScreen",
  "DietScreen",
  "DataScreen",
  "ChatScreen",
];

// As 5 telas principais ficam num Bottom Tab navigator. A barra padrão é ocultada
// (usamos a BottomNavigationBar flutuante externa). As telas são mantidas montadas
// (lazy: monta na 1a visita e permanece), tornando a troca entre elas instantânea.
function MainTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        // As 5 tabs ficam MONTADAS (não congeladas) para revisita instantânea.
        // NÃO usar freezeOnBlur aqui: com enableFreeze(true) global, congelar a tab
        // inativa fazia a ChatScreen renderizar PRETA ao navegar de uma tela de Stack
        // empilhada (ex.: FeedScreen) direto pra tab — o pop do Stack + a troca pra
        // tab congelada no mesmo frame deixava o screen nativo destacado/preto.
        freezeOnBlur: false,
      }}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="MapScreen" component={MapScreen} />
      {/* DietScreen é tipado com props de native-stack; cast p/ usar no Tab. */}
      <Tab.Screen name="DietScreen" component={DietScreen as any} />
      <Tab.Screen name="DataScreen" component={DataScreen} />
      <Tab.Screen name="ChatScreen" component={ChatScreen} />
    </Tab.Navigator>
  );
}

function AppLayout() {
  // Removendo isDietSheetOpen e setIsDietSheetOpen, pois não são mais usados para controlar a visibilidade da BottomNavigationBar.
  return (
    <View style={styles.container}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          // Congela a tela ao sair de foco e reduz custo de telas inativas.
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="DietDetails" component={DietDetailsScreen} />
        <Stack.Screen name="Chat" component={ChatProtected} />
        <Stack.Screen name="ProfilePFScreen" component={ProfilePFScreen} />
        <Stack.Screen name="ProfilePJ" component={ProfilePJ} />
        <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
        <Stack.Screen name="Appointments" component={Appointment} />
        <Stack.Screen name="AppointmentScreen" component={AppointmentScreen} />
        <Stack.Screen name="SelectedTrainers" component={SelectedTrainersScreen} />
        <Stack.Screen name="CaloriesScreen" component={CaloriesScreen} />
        <Stack.Screen name="CyclingScreen" component={CyclingScreen} />
        <Stack.Screen name="HeartbeatsScreen" component={HeartbeatsScreen} />
        <Stack.Screen name="SleepScreen" component={SleepScreen} />
        <Stack.Screen name="StepsScreen" component={StepsScreen} />
        <Stack.Screen name="WaterScreen" component={WaterScreen} />
        <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
        <Stack.Screen name="TestWearScreen" component={TestWearScreen} />
        <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
        <Stack.Screen name="CommunityDetails" component={CommunityDetails} />
        <Stack.Screen name="TrainingScreen" component={TrainingScreen} />
        <Stack.Screen name="TrainingDetails" component={TrainingDetails} />
        <Stack.Screen name="ChallengeDetails" component={ChallengeDetails} />
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkout} />
        <Stack.Screen name="ConfigScreen" component={ConfigScreen} />
        <Stack.Screen
          name="NotificationPreferencesScreen"
          component={NotificationPreferencesScreen}
        />
        <Stack.Screen name="PlanScreen" component={PlanScreen} />

        <Stack.Screen name="FAQScreen" component={FAQScreen} />
        <Stack.Screen name="ServiceScreen" component={ServiceScreen} />
        <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
        <Stack.Screen name="TermsScreen" component={TermsScreen} />
        <Stack.Screen name="PoliciesScreen" component={PoliciesScreen} />
        <Stack.Screen name="AboutScreen" component={AboutScreen} />
        <Stack.Screen name="PlatformRulesScreen" component={PlatformRulesScreen} />
        <Stack.Screen name="FeedScreen" component={FeedScreen} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="ArchivedPostsScreen" component={ArchivedPostsScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="PersonalDashboard" component={PersonalDashboard} />
        <Stack.Screen name="ExpectationRealityScreen" component={ExpectationRealityScreen} />
      </Stack.Navigator>
      <BottomNavigationBar />
    </View>
  );
}

function AppDrawerNavigator() {
  return (
    <LeftDrawer.Navigator
      // @ts-ignore
      id="LeftDrawer"
      screenOptions={{
        headerShown: false,
        drawerPosition: "left",
        drawerStyle: { backgroundColor: "#192126" },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <LeftDrawer.Screen name="HomeStack" component={AppLayout} />
    </LeftDrawer.Navigator>
  );
}

export function AppRoutes() {
  return (
    <RightDrawer.Navigator
      // @ts-ignore
      id="RightDrawer"
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerStyle: { width: "85%", backgroundColor: "transparent" },
      }}
      drawerContent={(props) => <NotificationDrawerContent {...props} />}
    >
      <RightDrawer.Screen name="AppDrawer" component={AppDrawerNavigator} />
    </RightDrawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppRoutes;
