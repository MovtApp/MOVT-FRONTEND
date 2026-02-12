import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Search, Play } from "lucide-react-native";
import TrainingSelector from "../../../components/TrainingSelector";
import PromotionalBanner from "../../../components/PromotionalBanner";
import PlanCardTraining from "../../../components/PlanCardsTraining";
import TrainingBanner from "../../../components/TrainingBanner";
import SearchInput from "../../../components/SearchInput";
import Communities from "@components/Communities";
import TheBestForYou from "@components/TheBestForYou";
import ChallengesSection from "../../../components/ChallengesSection";
import HeatingScreen from "../../../components/Heating";
import Header from "@components/Header";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../@types/routes";
import { useAuth } from "@contexts/AuthContext";
import { FooterVersion } from "@components/FooterVersion";

interface ExerciseItem {
  id: string;
  title: string;
  calories: string;
  minutes: string;
  imageUrl: string;
}

const exerciseData: ExerciseItem[] = [
  {
    id: "1",
    title: "Agachamento",
    calories: "180 - 250 Kcal",
    minutes: "15 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_71_jntmsv.jpg",
  },
  {
    id: "2",
    title: "Supino",
    calories: "150 - 200 Kcal",
    minutes: "12 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_txncpp.jpg",
  },
  {
    id: "3",
    title: "Remada curvada",
    calories: "160 - 220 Kcal",
    minutes: "12 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229918/image_75_drh4vh.jpg",
  },
  {
    id: "4",
    title: "Levantamento Terra",
    calories: "160 - 220 Kcal",
    minutes: "15 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229918/image111_gu6iim.jpg",
  },
  {
    id: "5",
    title: "Puxada na Barra",
    calories: "140 - 200 Kcal",
    minutes: "12 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229918/image_73_co9eqf.jpg",
  },
];

const HomeScreen: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedGender] = useState<"male" | "female">("female");
  const [notificationSheetHeight, setNotificationSheetHeight] = useState<number | string>("100%");
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      if (!user?.sessionId) return;

      try {
        setIsSearching(true);
        const { searchService } = await import("@services/searchService");
        const results = await searchService.globalSearch(query, user.sessionId);
        setSearchResults(results);
      } catch (error) {
        console.error("Erro ao pesquisar:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (search.trim()) {
      searchTimeout.current = setTimeout(() => {
        performSearch(search);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, performSearch]);

  const handleResultPress = (item: any) => {
    setSearch("");
    setSearchResults([]);

    const nav = navigation as any;
    const itemData = item.data || item;

    // Logic to navigate based on type or target
    if (item.target === "TrainerProfile" || item.type === "trainer") {
      if (itemData.role === "trainer" || itemData.role === "personal") {
        nav.navigate("ProfilePJ", { trainer: itemData });
      } else {
        nav.navigate("ProfilePFScreen", { user: itemData });
      }
    } else if (item.target === "ProfilePFScreen" || item.type === "user") {
      nav.navigate("ProfilePFScreen", { user: itemData });
    } else if (item.target === "DietDetails" || item.type === "diet") {
      nav.navigate("DietDetails", { meal: itemData });
    } else if (item.target === "TrainingDetails" || item.type === "training") {
      nav.navigate("TrainingDetails", { training: itemData });
    } else if (item.target === "CommunityDetails" || item.type === "community") {
      nav.navigate("CommunityDetails", { community: itemData });
    } else if (item.target === "MapScreen" || item.type === "gym") {
      // For gyms, navigate to map and possibly pass the gym coordinates
      nav.navigate("MapScreen", { selectedGym: item.type === "gym" ? itemData : undefined });
    } else if (item.targetScreen) {
      nav.navigate(item.targetScreen);
    }
  };
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "trainer":
        return "#192126";
      case "user":
        return "#6366F1"; // Purple for users
      case "gym":
        return "#BBF246";
      case "diet":
        return "#4ECDC4";
      case "community":
        return "#FF6B6B";
      default:
        return "#6B7280";
    }
  };

  const getBadgeTextColor = (type: string) => {
    return type === "gym" ? "#192126" : "#fff";
  };

  return (
    <View style={styles.container}>
      <Header notificationSheetHeight={notificationSheetHeight} />
      <View style={styles.searchWrapper}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Busque treinos, dietas, academias..."
          icon={<Search size={24} color="#888" />}
        />
        {!!search.trim().length && (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <ActivityIndicator color="#BBF246" />
                <Text style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>Buscando...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((result, idx) => (
                  <TouchableOpacity
                    key={`${result.id}-${idx}`}
                    style={styles.searchResultItem}
                    onPress={() => handleResultPress(result)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {result.image ? (
                        <Image source={{ uri: result.image }} style={styles.resultAvatar} />
                      ) : (
                        <View
                          style={[
                            styles.resultAvatar,
                            {
                              backgroundColor: "#F3F4F6",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          <Search size={16} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultTitle} numberOfLines={1}>
                          {result.title}
                        </Text>
                        {result.subtitle ? (
                          <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                            {result.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={{
                          backgroundColor: getBadgeColor(result.type),
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: getBadgeTextColor(result.type),
                            textTransform: "uppercase",
                          }}
                        >
                          {result.type || "Geral"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noSearchResultsText}>Nenhuma referência encontrada.</Text>
            )}
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <PromotionalBanner gender={selectedGender} />
        <TrainingSelector title="Selecione seu treino" containerStyle={{ marginBottom: 24 }} />
        <Communities />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercícios populares</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.exercisesList}
          >
            {exerciseData.map((exercise) => (
              <ImageBackground
                key={exercise.id}
                source={{ uri: exercise.imageUrl }}
                style={styles.exerciseCard}
                imageStyle={{ borderRadius: 16 }}
              >
                <View style={styles.imageOverlay}>
                  <View style={styles.exerciseCardContent}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <View style={styles.exerciseInfo}>
                      <View style={styles.tagsContainer}>
                        <View style={styles.calorieTag}>
                          <Text style={styles.calorieText}>{exercise.calories}</Text>
                        </View>
                        <View style={styles.MinutesTag}>
                          <Text style={styles.MinutesText}>{exercise.minutes}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.playButton}
                        activeOpacity={0.7}
                        onPress={() => {}}
                      >
                        <Play size={12} fill={"#192126"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </ScrollView>
        </View>
        <PlanCardTraining />
        <TrainingBanner
          title="Melhor treino de superiores"
          imageUrl="https://img.freepik.com/free-photo/view-woman-helping-man-exercise-gym_52683-98092.jpg?t=st=1758297406~exp=1758301006~hmac=66860a69d0b54e22b28d0831392e01278764d6b6d47e956a9576e041c9e016c2&w=1480"
          onPress={() => {}}
        />
        <TheBestForYou />
        <ChallengesSection />
        <HeatingScreen />
        <FooterVersion style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 100,
    position: "relative",
  },
  searchResultsContainer: {
    position: "absolute",
    top: 72,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 999,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  noSearchResultsText: {
    padding: 16,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  searchInput: {
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
    marginTop: -18,
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
  exercisesList: {
    marginLeft: -4,
  },
  exerciseCard: {
    width: 280,
    height: 160,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.3)",
    borderRadius: 16,
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
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
    paddingBottom: 0,
    position: "relative",
  },
  tagsContainer: {
    flexDirection: "column",
    marginBottom: 10,
  },
  calorieTag: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 5,
  },
  calorieText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  MinutesTag: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  MinutesText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  playButton: {
    backgroundColor: "#BBF246",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    position: "absolute",
    bottom: 0,
    right: 0,
    marginBottom: 40,
  },
  dumbbellsImage: {
    position: "relative",
    bottom: 10,
    right: 10,
    width: 80,
    height: 80,
    zIndex: 4,
  },
  heightControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  heightButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF246",
    backgroundColor: "#fff",
  },
  heightButtonActive: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
  },
  heightButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#192126",
  },
  heightButtonTextActive: {
    color: "#192126",
  },
  footer: {
    alignItems: "flex-start",
    marginTop: -80,
    marginBottom: 120,
  },
});

export default HomeScreen;
