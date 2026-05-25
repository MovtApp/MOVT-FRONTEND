import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform } from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
  useDrawerStatus,
} from "@react-navigation/drawer";
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
  Layout,
  ShieldEllipsis,
} from "lucide-react-native";
import { AppStackParamList } from "../@types/routes";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut, updateUser } = useAuth();
  const drawerStatus = useDrawerStatus();

  const initialAvatar = user?.avatar_url || user?.photo || (user as any)?.image || null;
  const [liveAvatar, setLiveAvatar] = useState<string | null>(initialAvatar);

  useEffect(() => {
    if (initialAvatar && initialAvatar !== liveAvatar) {
      setLiveAvatar(initialAvatar);
    }
  }, [initialAvatar]);

  useEffect(() => {
    if (drawerStatus === "open" && user) {
      const fetchLiveData = async () => {
        try {
          const id = user.id_us || user.id;
          if (!id) return;
          const res = await userService.getUserProfile(String(id));
          if (res.success && res.data) {
            const fetched = res.data;
            const livePhoto = fetched.photo || fetched.avatar_url || fetched.image;
            const liveRole = fetched.role;

            const updates: any = {};
            if (livePhoto && livePhoto !== liveAvatar) {
              setLiveAvatar(livePhoto);
              updates.photo = livePhoto;
            }
            if (liveRole && liveRole !== user.role) {
              updates.role = liveRole;
            }

            if (Object.keys(updates).length > 0) {
              updateUser(updates);
            }
          }
        } catch (err) {
          console.error("Erro ao atualizar perfil do drawer:", err);
        }
      };
      fetchLiveData();
    }
  }, [drawerStatus, user]);

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
    { name: "Explorar", icon: Layout, route: "FeedScreen" as keyof AppStackParamList },
    ...(user?.role?.toLowerCase()?.includes("admin") ||
    user?.role?.toLowerCase()?.includes("personal") ||
    user?.role?.toLowerCase()?.includes("trainer")
      ? [
          {
            name: "Dashboard",
            icon: ShieldEllipsis,
            route: (user?.role?.toLowerCase()?.includes("admin")
              ? "AdminDashboard"
              : "PersonalDashboard") as keyof AppStackParamList,
          },
        ]
      : []),
    { name: "Agendamentos", icon: Calendar, route: "Appointments" as keyof AppStackParamList },
    { name: "Comunidades", icon: Users, route: "CommunityScreen" as keyof AppStackParamList },
    { name: "Planos", icon: Users, route: "PlanScreen" as keyof AppStackParamList },
  ];

  const handleNavigation = (route: string) => {
    props.navigation.navigate("HomeStack", {
      screen: route as keyof AppStackParamList,
    } as any);
    props.navigation.closeDrawer();
  };

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
      <TouchableOpacity
        style={styles.profileSection}
        activeOpacity={0.7}
        onPress={handleProfilePress}
      >
        <Image
          source={
            liveAvatar
              ? { uri: liveAvatar }
              : {
                  uri: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
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
            onPress={() => handleNavigation(item.route)}
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
            onPress={() => handleNavigation(item.route)}
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
            onPress={() => handleNavigation(item.route)}
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
        <Text
          style={styles.logoutText}
          onPress={() => {
            Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Sair", style: "destructive", onPress: () => signOut() },
            ]);
          }}
        >
          Sair
        </Text>
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
    marginTop: 30,
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
