import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { DrawerContentScrollView, DrawerContentComponentProps } from "@react-navigation/drawer";
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
  Globe,
} from "lucide-react-native";
import { AppStackParamList } from "../@types/routes";
import { useAuth } from "../hooks/useAuth";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();

  const handleCloseDrawer = () => {
    props.navigation.closeDrawer();
  };

  const handleProfilePress = () => {
    props.navigation.navigate("HomeStack", {
      screen: "ProfilePFScreen",
    } as any);
    props.navigation.closeDrawer();
  };

  const menuItems = [
    { name: "Início", icon: Home, route: "HomeScreen" },
    { name: "Mapa", icon: Map, route: "MapScreen" },
    { name: "Dietas", icon: Utensils, route: "DietScreen" },
    { name: "Dados", icon: Activity, route: "DataScreen" },
    { name: "Chat", icon: MessageCircle, route: "ChatScreen" },
  ];

  const panelItems = [
    { name: "Explorar", icon: Globe, route: "TrainingScreen" },
    { name: "Treinos", icon: Calendar, route: "TrainingScreen" },
    { name: "Agendamentos", icon: Calendar, route: "Appointments" },
    { name: "Comunidades", icon: Users, route: "CommunityScreen" },
  ];

  const accountItems = [
    {
      name: "Configurações e privacidades",
      icon: Settings,
      route: "ConfigScreen" as keyof AppStackParamList,
    },

    { name: "Ajuda e suporte", icon: HelpCircle, route: "FAQScreen" as keyof AppStackParamList },
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
                uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1767896239/Captura_de_tela_2026-01-08_151542_r3acpt.png",
              }
          }
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || ""}</Text>
          <Text style={styles.profileUsername}>{user?.username ? `@${user.username}` : ""}</Text>
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
            }
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
            }}
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
            }
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
        <LogOut size={20} color="#BBF246" style={styles.drawerItemIcon} /><Text style={styles.logoutText} onPress={() => { Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [{ text: "Cancelar", style: "cancel" }, { text: "Sair", style: "destructive", onPress: () => signOut() }]); }}>Sair</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    backgroundColor: "#192126",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileUsername: {
    fontSize: 14,
    color: "#BBF246",
    opacity: 0.8,
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
