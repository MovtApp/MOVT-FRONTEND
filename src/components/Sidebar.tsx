import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
// import { cn } from "../lib/utils"; // Removendo importação não utilizada
import {
  CalendarDays,
  ChartColumnBig,
  Globe,
  House,
  MapPinned,
  MessageCircle,
  Soup,
  Settings,
  Info,
  CircleHelp,
  LogOut,
  X,
  Dumbbell,
} from "lucide-react-native";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// Provider do Sidebar
interface SidebarProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    setIsOpen(!isOpen);
  };
  const close = () => {
    setIsOpen(false);
  };
  const open = () => {
    setIsOpen(true);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Componente principal do Sidebar
type SidebarProps = Record<string, never>;

export const Sidebar: React.FC<SidebarProps> = () => {
  const { isOpen, close } = useSidebar();
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();

  if (!isOpen) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 384, // Equivalent to w-96 (96 * 4 = 384px)
        zIndex: 50,
        borderRightWidth: 1, // Equivalent to border-r
        borderColor: "#333", // Ajuste a cor da borda se necessário
        backgroundColor: "#192126",
      }}
    >
      {/* Header do Sidebar */}
      <View style={[styles.sidebarHeader, { paddingTop: top }]}>
        <View style={styles.headerTop}>
          <Text style={styles.sidebarTitle}>Menu</Text>
          <TouchableOpacity style={styles.sidebarClose} onPress={close}>
            <X size={24} color="#BBF246" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.avatar} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>Tiago Matsukura</Text>
          </View>
        </View>
      </View>

      {/* Conteúdo do Sidebar */}
      <ScrollView
        style={styles.sidebarContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>Menu principal</Text>

          {/* INÍCIO */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("HomeScreen");
            }}
          >
            <House size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Início</Text>
          </TouchableOpacity>

          {/* MAPA */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("MapScreen");
            }}
          >
            <MapPinned size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Mapa</Text>
          </TouchableOpacity>

          {/* DIETAS */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("DietScreen");
            }}
          >
            <Soup size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Dietas</Text>
          </TouchableOpacity>

          {/* DADOS */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("DataScreen");
            }}
          >
            <ChartColumnBig size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Dados</Text>
          </TouchableOpacity>

          {/* CHAT */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("ChatScreen");
            }}
          >
            <MessageCircle size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Linha divisória */}
        <View style={styles.divider} />

        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>Painel</Text>

          {/* TREINOS */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("TrainingScreen");
            }}
          >
            <Dumbbell size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Treinos</Text>
          </TouchableOpacity>

          {/* AGENDAMENTOS */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("ScheduleScreen");
            }}
          >
            <CalendarDays size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Agendamentos</Text>
          </TouchableOpacity>

          {/* COMUNIDADES */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("CommunityScreen");
            }}
          >
            <Globe size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Comunidades</Text>
          </TouchableOpacity>
        </View>

        {/* Linha divisória */}
        <View style={styles.divider} />

        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>Sua conta</Text>

          {/* CONFIGURAÇÕES */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("ConfigScreen");
            }}
          >
            <Settings size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>
              Configurações e privacidades
            </Text>
          </TouchableOpacity>

          {/* AJUDA E SUPORTE */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("SupportScreen");
            }}
          >
            <CircleHelp size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Ajuda e suporte</Text>
          </TouchableOpacity>

          {/* SOBRE */}
          <TouchableOpacity
            style={styles.sidebarItemContent}
            onPress={() => {
              // @ts-ignore
              navigation.navigate("AboutScreen");
            }}
          >
            <Info size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Sobre</Text>
          </TouchableOpacity>
        </View>

        {/* Linha divisória */}
        <View style={styles.divider} />

        {/* Botão Desconectar */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton}>
            <LogOut size={24} color="#BBF246" />
            <Text style={styles.logoutText}>Desconectar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Overlay do Sidebar
interface SidebarOverlayProps {
  onPress?: () => void;
}

export const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ onPress }) => {
  const { close, isOpen } = useSidebar();

  if (!isOpen) return null;

  return (
    <TouchableOpacity
      onPress={onPress || close}
      activeOpacity={1}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 40,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        pointerEvents: "auto",
      }}
    />
  );
};

// Estilos do Sidebar
const styles = {
  sidebarHeader: {
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#BBF246",
  },
  sidebarClose: {
    padding: 8,
  },
  sidebarCloseText: {
    fontSize: 30,
    color: "#BBF246",
    fontWeight: "regular" as const,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
  },
  profileText: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingLeft: 8,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginLeft: -12,
  },
  divider: {
    height: 1,
    backgroundColor: "#BBF246",
    marginVertical: 20,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 30,
    marginTop: -10,
    color: "#BBF246",
  },
  sidebarSection: {
    marginBottom: -24,
  },
  sidebarSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#BBF246",
    marginBottom: 16,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sidebarItemContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 24,
  },
  sidebarItemText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500" as const,
  },
  logoutSection: {
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: "#BBF246",
    fontWeight: "500" as const,
  },
};
