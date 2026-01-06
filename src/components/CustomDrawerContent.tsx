import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { DrawerContentScrollView, DrawerContentComponentProps } from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import {
  X,
  Home,
  Map,
  Utensils,
  Activity,
  MessageCircle,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  Info,
  LogOut,
} from "lucide-react-native";
import { AppStackParamList } from "../@types/routes";
import { useAuth } from "../hooks/useAuth";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();

  const handleCloseDrawer = () => {
    props.navigation.closeDrawer();
  };

  const handleProfilePress = () => {
    props.navigation.navigate("HomeStack", { screen: "ProfileScreen" } as any);
    handleCloseDrawer();
  };

  const menuItems = [
    { name: "Início", icon: Home, route: "HomeScreen" },
    { name: "Mapa", icon: Map, route: "MapScreen" },
    { name: "Dietas", icon: Utensils, route: "DietScreen" },
    { name: "Dados", icon: Activity, route: "DataScreen" },
    { name: "Chat", icon: MessageCircle, route: "ChatScreen" },
  ];

  const panelItems = [
    { name: "Treinos", icon: Calendar, route: "TrainingScreen" },
    { name: "Agendamentos", icon: Calendar, route: "Appointments" },
    { name: "Comunidades", icon: Users, route: "CommunityScreen" },
  ];

  const accountItems = [
    { name: "Configurações e privacidades", icon: Settings, route: "ConfigScreen" as keyof AppStackParamList },

    { name: "Ajuda e suporte", icon: HelpCircle, route: "SupportScreen" },
    { name: "Sobre", icon: Info, route: "AboutScreen" },
  ];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCloseDrawer} style={styles.closeButton}>
          <X size={24} color="#BBF246" />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>Menu</Text>
      </View>

      <TouchableOpacity
        style={styles.profileSection}
        activeOpacity={0.7}
        onPress={handleProfilePress}
      >
        <Image
          source={
            user?.photo
              ? { uri: user.photo }
              : {
                uri: "https://img.freepik.com/vetores-gratis/circulo-azul-com-usuario-branco_78370-4707.jpg?t=st=1760290901~exp=1760294501~hmac=54c484fcb1eb3bfdc377aeeaa901c951421c366a6a55921cf0ce792c078fe4df&w=1480",
              }
          }
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || "Visitante"}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu principal</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.drawerItem}
            onPress={() =>
              props.navigation.navigate("App", {
                screen: "HomeStack",
                params: { screen: item.route as keyof AppStackParamList },
              })
            } // Navegação corrigida
          >
            <item.icon size={20} color="#FFFFFF" style={styles.drawerItemIcon} />
            <Text style={styles.drawerItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Painel</Text>
        {panelItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.drawerItem}
            onPress={() => {
              props.navigation.navigate("App", {
                screen: "HomeStack",
                params: { screen: item.route as keyof AppStackParamList },
              });
            }} // Navegação corrigida
          >
            <item.icon size={20} color="#FFFFFF" style={styles.drawerItemIcon} />
            <Text style={styles.drawerItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sua conta</Text>
        {accountItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.drawerItem}
            onPress={() =>
              props.navigation.navigate("App", {
                screen: "HomeStack",
                params: { screen: item.route as keyof AppStackParamList },
              })
            } // Navegação corrigida
          >
            <item.icon size={20} color="#FFFFFF" style={styles.drawerItemIcon} />
            <Text style={styles.drawerItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await signOut();
          // Fecha o drawer antes de redirecionar
          props.navigation.closeDrawer();
        }}
      >
        <LogOut size={20} color="#BBF246" style={styles.drawerItemIcon} />
        <Text style={styles.logoutText}>Desconectar</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    // flex: 1, // Removido para permitir rolagem natural
    backgroundColor: "#192126",
    paddingTop: 40, // Ajuste para o padding superior
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  closeButton: {
    marginRight: 10,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#BBF246",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#BBF246",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#BBF246",
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#BBF246",
    paddingHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  drawerItemIcon: {
    marginRight: 15,
  },
  drawerItemText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#BBF246",
  },
});
