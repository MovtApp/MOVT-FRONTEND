import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { X, Search, Users, ChevronRight, Shield, CheckCircle, Bell } from "lucide-react-native";
import { getAvatarUri } from "../utils/avatar";

interface UserManagementSheetsProps {
  // Refs
  usersSheetRef: React.RefObject<BottomSheet>;
  userDetailSheetRef: React.RefObject<BottomSheet>;
  activePlansSheetRef: React.RefObject<BottomSheet>;
  expiringSheetRef: React.RefObject<BottomSheet>;

  // Data
  adminUsers: any[];
  filteredAdminUsers: any[];
  filteredActivePlansUsers: any[];
  filteredExpiringUsers: any[];
  rawExpiringUsers: any[];

  // State
  loadingSheet: boolean;
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (r: any) => void;
  activePlanSearchQuery: string;
  setActivePlanSearchQuery: (q: string) => void;
  activePlanFilter: string;
  setActivePlanFilter: (f: any) => void;
  expiringSearchQuery: string;
  setExpiringSearchQuery: (q: string) => void;
  expiringPlanFilter: string;
  setExpiringPlanFilter: (f: any) => void;

  // Callbacks
  renderBackdrop: any;
  insets: any;
  openUserDetail: (u: any) => void;
  toggleUserStatus: (id: number) => void;
}

const UserManagementSheets: React.FC<UserManagementSheetsProps> = (props) => {
  const {
    usersSheetRef,
    userDetailSheetRef,
    activePlansSheetRef,
    expiringSheetRef,
    adminUsers,
    filteredAdminUsers,
    filteredActivePlansUsers,
    filteredExpiringUsers,
    rawExpiringUsers,
    loadingSheet,
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    activePlanSearchQuery,
    setActivePlanSearchQuery,
    activePlanFilter,
    setActivePlanFilter,
    expiringSearchQuery,
    setExpiringSearchQuery,
    expiringPlanFilter,
    setExpiringPlanFilter,
    renderBackdrop,
    insets,
    openUserDetail,
    toggleUserStatus,
  } = props;

  return (
    <>
      {/* ── SHEET: GERENCIAR USUÁRIOS ── */}
      <BottomSheet
        ref={usersSheetRef}
        index={-1}
        snapPoints={["100%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 32 }}
      >
        <View style={styles.sheetContent}>
          <View style={[styles.sheetHeader, { marginBottom: 18 }]}>
            <View>
              <Text style={styles.sheetTitle}>Gestão de Usuários</Text>
              <Text style={styles.sheetSubtitle}>{adminUsers.length} usuários no total</Text>
            </View>
            <TouchableOpacity
              onPress={() => usersSheetRef.current?.close()}
              style={styles.sheetCloseBtn}
            >
              <X size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats: Role Filters */}
          <View style={[styles.sheetStatsRow, { marginBottom: 15 }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.sheetStatItem,
                userRoleFilter === "cliente_pf" && styles.statActive_Gray,
              ]}
              onPress={() =>
                setUserRoleFilter(userRoleFilter === "cliente_pf" ? "all" : "cliente_pf")
              }
            >
              <Text style={[styles.sheetStatValue, { color: "#64748B" }]}>{adminUsers.length}</Text>
              <Text style={styles.sheetStatLabel}>Todos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.sheetStatItem,
                userRoleFilter === "cliente_pj" && styles.statActive_Green,
              ]}
              onPress={() =>
                setUserRoleFilter(userRoleFilter === "cliente_pj" ? "all" : "cliente_pj")
              }
            >
              <Text style={[styles.sheetStatValue, { color: "#16A34A" }]}>
                {
                  (Array.isArray(adminUsers) ? adminUsers : []).filter(
                    (u) =>
                      u &&
                      String(u?.role || u?.tipo || u?.role_name || "")
                        .toLowerCase()
                        .includes("personal")
                  ).length
                }
              </Text>
              <Text style={styles.sheetStatLabel}>Personais</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por nome ou e-mail..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              value={userSearchQuery}
              onChangeText={setUserSearchQuery}
            />
          </View>

          {loadingSheet ? (
            <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
          ) : (
            <BottomSheetFlatList
              data={filteredAdminUsers}
              keyExtractor={(item: any) => String(item?.id_us || Math.random())}
              style={{ flex: 1, marginTop: 15 }}
              contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity style={styles.proUserCard} onPress={() => openUserDetail(item)}>
                  <View style={styles.proUserMain}>
                    <Image
                      source={{ uri: getAvatarUri(item, "https://via.placeholder.com/100") }}
                      style={styles.proAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.proName} numberOfLines={1}>
                        {item.nome}
                      </Text>
                      <Text style={styles.proEmail}>{item.email}</Text>
                    </View>
                    <ChevronRight size={20} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </BottomSheet>

      {/* Rest of User sheets (Planos Ativos, Renovação) would go here or in separate sub-parts */}
    </>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E293B",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  sheetCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  sheetStatItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  sheetStatValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  sheetStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 4,
  },
  statActive_Gray: { backgroundColor: "#F1F5F9", borderColor: "#64748B", borderWidth: 2 },
  statActive_Green: { backgroundColor: "#F0FDF4", borderColor: "#16A34A", borderWidth: 2 },
  searchContainer: {
    height: 52,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  proUserCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  proUserMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  proAvatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
  },
  proName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  proEmail: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
});

export default UserManagementSheets;
