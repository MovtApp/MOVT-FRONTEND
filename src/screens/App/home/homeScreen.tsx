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
  InteractionManager,
} from "react-native";
import {
  Search,
  User,
  Dumbbell,
  Utensils,
  Users,
  MapPin,
  ChevronRight,
  Activity,
} from "lucide-react-native";
import TrainingSelector from "../../../components/TrainingSelector";
import PromotionalBanner from "../../../components/PromotionalBanner";
import PlanCardTraining from "../../../components/PlanCardsTraining";
import TrainingBanner from "../../../components/TrainingBanner";
import SearchInput from "../../../components/SearchInput";
import Communities from "@components/Communities";
import TheBestForYou from "@components/TheBestForYou";
import ChallengesSection from "../../../components/ChallengesSection";
import PopularExercises from "../../../components/PopularExercises";
import HeatingScreen from "../../../components/Heating";
import Header from "@components/Header";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../@types/routes";
import { useAuth } from "@contexts/AuthContext";
import { FooterVersion } from "@components/FooterVersion";
import { useAppData } from "@contexts/AppDataContext";
import { useDeferredMount } from "../../../hooks/useDeferredMount";
import { Skeleton } from "../../../components/Skeleton";

interface ExerciseItem {
  id: string;
  title: string;
  calories: string;
  minutes: string;
  imageUrl: string;
}

const exerciseData: ExerciseItem[] = [];

const HomeScreen: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedGender] = useState<"male" | "female">("female");
  const [notificationSheetHeight, setNotificationSheetHeight] = useState<number | string>("100%");
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  // Adia a montagem do conteúdo pesado para depois da transição de navegação.
  const contentMounted = useDeferredMount();

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<any>(null);

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const {
    trainings,
    loadingTrainings,
    dailyPlans,
    loadingDailyPlans: loadingPlans,
    fetchHomeData,
  } = useAppData();

  // ─── Treinos organizados por seção da Home ────────────────────────────────
  const trainingsBySection = useMemo(() => {
    const mapT = (t: any) => ({
      id: String(t.id_treino ?? t.id ?? ""),
      title: t.nome ?? t.title ?? "",
      imageUrl: t.imageurl ?? t.imageUrl ?? "",
      calories: t.calorias ?? t.calories ?? "",
      minutes: t.duracao ?? t.minutes ?? "",
      level: t.nivel ?? "Iniciante",
      description: t.descricao ?? "",
    });
    return {
      allMapped: trainings.map(mapT),
      popular: trainings.filter((t: any) => t.secao_home === "popular").map(mapT),
      plano_do_dia: trainings.filter((t: any) => t.secao_home === "plano_do_dia").map(mapT),
      melhores_para_voce: trainings
        .filter((t: any) => t.secao_home === "melhores_para_voce")
        .map(mapT),
      desafio: trainings.filter((t: any) => t.secao_home === "desafio").map(mapT),
      aquecimento: trainings.filter((t: any) => t.secao_home === "aquecimento").map(mapT),
    };
  }, [trainings]);

  useEffect(() => {
    // Adia o fetch para depois da transição: a Home já renderiza do cache do
    // AppDataContext, então o refresh em background não trava a navegação.
    const task = InteractionManager.runAfterInteractions(() => {
      fetchHomeData(selectedSpecialty);
    });
    return () => task.cancel();
  }, [selectedSpecialty, fetchHomeData]);

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
  const getResultIcon = (type: string) => {
    switch (type) {
      case "trainer":
      case "personal":
        return <Activity size={14} color="#6B7280" />;
      case "user":
        return <User size={14} color="#6B7280" />;
      case "gym":
        return <MapPin size={14} color="#6B7280" />;
      case "diet":
        return <Utensils size={14} color="#6B7280" />;
      case "community":
        return <Users size={14} color="#6B7280" />;
      case "training":
        return <Dumbbell size={14} color="#6B7280" />;
      default:
        return <Search size={14} color="#6B7280" />;
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

  const handleTrainingPress = (training: any) => {
    // Normaliza os dados para o tipo Training definido em routes.d.ts
    const trainingData: any = {
      id_treino: String(training.id_treino || training.id || ""),
      nome: training.nome || training.title || "Treino",
      descricao: training.descricao || training.description || "Sem descrição disponível",
      imageurl:
        training.imageurl ||
        training.imageUrl ||
        training.image_url ||
        "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_71_jntmsv.jpg",
      duracao: training.duracao || training.minutes || training.description || "0 min",
      calorias: training.calorias || training.calories || "0 kcal",
      nivel: training.nivel || training.level || "Iniciante",
      categoria: training.categoria || training.category || "Fitness",
      exercicios: training.exercicios || training.exercises || [],
      instrutor: training.instrutor || training.trainerName || "Instrutor MOVT",
      equipamentos: training.equipamentos || [],
    };

    navigation.navigate("TrainingDetails", { training: trainingData });
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
                    activeOpacity={0.7}
                    onPress={() => handleResultPress(result)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      {result.image ? (
                        <Image source={{ uri: result.image }} style={styles.resultAvatar} />
                      ) : (
                        <View style={styles.resultIconWrapper}>{getResultIcon(result.type)}</View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultTitle} numberOfLines={1}>
                          {result.title}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          {/* Exibe o ícone do tipo se houver imagem (se não houver, o ícone já está no lugar da imagem) */}
                          {result.image && (
                            <View style={{ opacity: 0.8 }}>{getResultIcon(result.type)}</View>
                          )}

                          <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                            {result.subtitle || result.type || "Resultado"}
                          </Text>
                        </View>
                      </View>

                      {/* Removemos o badge de texto para 'user', 'trainer', 'personal' e 'community' conforme solicitado */}
                      {result.type?.toLowerCase() !== "user" &&
                        result.type?.toLowerCase() !== "trainer" &&
                        result.type?.toLowerCase() !== "personal" &&
                        result.type?.toLowerCase() !== "community" &&
                        result.type?.toLowerCase() !== "communities" && (
                          <View
                            style={{
                              backgroundColor: getBadgeColor(result.type),
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 100,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "800",
                                color: getBadgeTextColor(result.type),
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              {result.type}
                            </Text>
                          </View>
                        )}

                      <ChevronRight size={18} color="#D1D5DB" />
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
        <TrainingSelector
          title="Selecione seu treino"
          containerStyle={{ marginBottom: 24 }}
          onSelect={setSelectedSpecialty}
          selectedSpecialty={selectedSpecialty}
        />
        {contentMounted || trainings.length > 0 ? (
          <>
            <Communities />
            <PopularExercises
              trainings={
                trainingsBySection.popular.length > 0
                  ? trainingsBySection.popular
                  : trainingsBySection.allMapped
              }
              selectedSpecialty={selectedSpecialty}
              loadingTrainings={loadingTrainings}
              onPressExercise={handleTrainingPress}
            />
            <PlanCardTraining planData={dailyPlans} onPressPlan={handleTrainingPress} />
            <TrainingBanner
              title="Melhor treino de superiores"
              imageUrl="https://img.freepik.com/free-photo/view-woman-helping-man-exercise-gym_52683-98092.jpg?t=st=1758297406~exp=1758301006~hmac=66860a69d0b54e22b28d0831392e01278764d6b6d47e956a9576e041c9e016c2&w=1480"
              onPress={() => {
                Alert.alert(
                  "Destaque",
                  "Este treino está em destaque para você!\n\nFuncionalidade disponível em breve."
                );
              }}
            />
            <TheBestForYou
              onPressPlan={handleTrainingPress}
              planData={(trainingsBySection.melhores_para_voce.length > 0
                ? trainingsBySection.melhores_para_voce
                : trainingsBySection.allMapped
              ).slice(0, 4)}
            />
            <ChallengesSection
              challenges={
                trainingsBySection.desafio.length > 0
                  ? trainingsBySection.desafio.map((t) => ({
                      id: t.id,
                      title: t.title,
                      image: { uri: t.imageUrl },
                    }))
                  : undefined
              }
              onPress={() => {
                Alert.alert(
                  "Desafio",
                  "Este desafio está em destaque para você!\n\nFuncionalidade disponível em breve."
                );
              }}
            />
            <HeatingScreen
              heatingData={
                trainingsBySection.aquecimento.length > 0
                  ? trainingsBySection.aquecimento.map((t) => ({
                      id: t.id,
                      title: t.title,
                      imageUrl: t.imageUrl,
                      level: t.level,
                      minutes: t.minutes,
                    }))
                  : undefined
              }
              onPressItem={(item) => {
                const training = trainings.find((t: any) => String(t.id_treino) === item.id);
                if (training) handleTrainingPress(training);
              }}
            />
          </>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <Skeleton width="100%" height={140} borderRadius={16} color="#EEF1F4" />
            <Skeleton width="60%" height={20} color="#EEF1F4" />
            <Skeleton width="100%" height={120} borderRadius={16} color="#EEF1F4" />
            <Skeleton width="100%" height={120} borderRadius={16} color="#EEF1F4" />
          </View>
        )}
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
    borderRadius: 16,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  resultIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  searchResultSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  noSearchResultsText: {
    padding: 24,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "500",
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
