import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Search, Filter } from "lucide-react-native";
import { getAvatarUri } from "../utils/avatar";

interface DashboardHeaderProps {
  user: any;
  activeTab: "day" | "month" | "year";
  setActiveTab: (tab: "day" | "month" | "year") => void;
  openFilter: () => void;
  insets: any;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  openFilter,
  insets,
}) => {
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topRow}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: getAvatarUri(user, "https://via.placeholder.com/44") }}
              style={styles.avatar}
            />
            <View style={styles.onlineBadge} />
          </View>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo, Admin</Text>
            <Text style={styles.nameText}>{user?.nome || "Moderador"}</Text>
          </View>
        </View>
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={22} color="#192126" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <Text style={styles.searchPlaceholder}>Buscar métricas, usuários...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
          <Filter size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {["day", "month", "year"].map((tab: any) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === "day" ? "Hoje" : tab === "month" ? "Mensal" : "Anual"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    paddingBottom: 25,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  welcomeText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#192126",
  },
  actionIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchPlaceholder: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "#192126",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  activeTabText: {
    color: "#192126",
  },
});

export default DashboardHeader;
