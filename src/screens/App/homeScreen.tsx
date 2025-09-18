import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import {
  Bell,
  Search,
  Play,
  Users,
  Dumbbell,
  Target,
  Activity,
  Menu,
  BicepsFlexed,
} from "lucide-react-native";
import {
  SidebarProvider,
  Sidebar,
  SidebarOverlay,
  useSidebar,
} from "../../components/Sidebar";
import SearchInput from "../../components/SearchInput";

const MenuButton: React.FC = () => {
  const { toggle } = useSidebar();

  return (
    <TouchableOpacity style={styles.menuButton} onPress={toggle}>
      <Menu size={24} color="#000" />
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC = () => {
  const [search, setSearch] = useState("");

  return (
    <SidebarProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* Botão do menu */}
          <MenuButton />

          <Image
            source={{ uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1758030169/MV_pukwcn.png" }}
            style={{ width: 80, height: 40 }}
            resizeMode="cover"
          />

          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar"
            icon={<Search size={24} color="#888" />}
          />

          {/* Promotional Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>
                  Comece forte e defina suas metas!
                </Text>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Let&apos;s go!</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bannerImage}>
                <Dumbbell size={60} color="#000" />
              </View>
            </View>
          </View>

          {/* Workout Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione seu treino</Text>
            <View style={styles.workoutTypes}>
              <TouchableOpacity
                style={[styles.workoutType, styles.workoutTypeActive]}
              >
                <Dumbbell size={20} color="#fff" />
                <Text style={styles.workoutTypeTextActive}>Musculação</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.workoutType}>
                <BicepsFlexed size={20} color="#666" />
                <Text style={styles.workoutTypeText}>Funcional</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.workoutType}>
                <Activity size={20} color="#666" />
                <Text style={styles.workoutTypeText}>Reabilitação física</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.workoutType}>
                <Target size={20} color="#666" />
                <Text style={styles.workoutTypeText}>Emagrecimento</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.workoutType}>
                <Target size={20} color="#666" />
                <Text style={styles.workoutTypeText}>
                  Condicionamento físico
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.workoutType}>
                <Activity size={20} color="#666" />
                <Text style={styles.workoutTypeText}>Gravidez</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.workoutType}>
                <Activity size={20} color="#666" />
                <Text style={styles.workoutTypeText}>
                  Performance esportiva
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Communities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Comunidades</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.communitiesList}
            >
              <View style={styles.communityItem}>
                <View style={styles.communityAvatar}>
                  <Users size={24} color="#666" />
                </View>
                <Text style={styles.communityName}>Powerlifters</Text>
              </View>
              <View style={styles.communityItem}>
                <View style={styles.communityAvatar}>
                  <Activity size={24} color="#666" />
                </View>
                <Text style={styles.communityName}>Pilates</Text>
              </View>
              <View style={styles.communityItem}>
                <View style={styles.communityAvatar}>
                  <Activity size={24} color="#666" />
                </View>
                <Text style={styles.communityName}>Yoga</Text>
              </View>
              <View style={styles.communityItem}>
                <View style={styles.communityAvatar}>
                  <Dumbbell size={24} color="#666" />
                </View>
                <Text style={styles.communityName}>Corridas</Text>
              </View>
              <View style={styles.communityItem}>
                <View style={styles.communityAvatar}>
                  <Dumbbell size={24} color="#666" />
                </View>
                <Text style={styles.communityName}>Bodybuilders</Text>
              </View>
            </ScrollView>
          </View>

          {/* Popular Exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercícios populares</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.exercisesList}
            >
              <View style={styles.exerciseCard}>
                <View style={styles.exerciseCardContent}>
                  <Text style={styles.exerciseTitle}>Agachamento (Squat)</Text>
                  <View style={styles.exerciseInfo}>
                    <View style={styles.calorieTag}>
                      <Text style={styles.calorieText}>180 - 250 Kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.playButton}>
                      <Play size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.exerciseCard}>
                <View style={styles.exerciseCardContent}>
                  <Text style={styles.exerciseTitle}>Supino (Bench Press)</Text>
                  <View style={styles.exerciseInfo}>
                    <View style={styles.calorieTag}>
                      <Text style={styles.calorieText}>150 - 200 Kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.playButton}>
                      <Play size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Sidebar e Overlay */}
        <Sidebar />
        <SidebarOverlay />
      </View>
    </SidebarProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    zIndex: 45,
  },
  menuButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    zIndex: 45,
  },
  notificationButton: {
    padding: 8,
    zIndex: 45,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: "#666",
  },
  banner: {
    backgroundColor: "#4ade80",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  bannerImage: {
    marginLeft: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "underline",
  },
  workoutTypes: {
    flexDirection: "row",
    gap: 12,
  },
  workoutType: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  workoutTypeActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  workoutTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  workoutTypeTextActive: {
    marginLeft: 8,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  communitiesList: {
    marginLeft: -4,
  },
  communityItem: {
    alignItems: "center",
    marginRight: 20,
  },
  communityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  communityName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  exercisesList: {
    marginLeft: -4,
  },
  exerciseCard: {
    width: 280,
    height: 160,
    backgroundColor: "#1f2937",
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  exerciseCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  exerciseInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calorieTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  calorieText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  playButton: {
    backgroundColor: "#10b981",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HomeScreen;
