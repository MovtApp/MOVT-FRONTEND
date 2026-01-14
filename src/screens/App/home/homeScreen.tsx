import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Image,
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

interface SearchEntry {
  id: string;
  title: string;
  description?: string;
  keywords: string[];
  targetScreen?: keyof AppStackParamList;
  extraAction?: () => void;
}

const HomeScreen: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedGender] = useState<"male" | "female">("female");
  const [notificationSheetHeight, setNotificationSheetHeight] = useState<number | string>("100%");
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const handleNotificationSheetHeightChange = (height: number | string) => {
    setNotificationSheetHeight(height);
  };

  const normalizeText = (value?: string) =>
    (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const searchEntries = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [
      ...(user
        ? [
          {
            id: "profile",
            title: user.name || "Seu perfil",
            description: user.username ? `@${user.username}` : "Gerencie sua conta",
            keywords: [
              user.name || "",
              user.username || "",
              user.email || "",
              "perfil",
              "conta",
              "usuario",
              "account",
            ],
            targetScreen: "ProfilePFScreen" as keyof AppStackParamList,
          },
        ]
        : []),
      {
        id: "data-dashboard",
        title: "Painel de dados",
        description: "Passos, batimentos, água, sono",
        keywords: [
          "dados",
          "dashboard",
          "relatorio",
          "estatisticas",
          "passos",
          "batimentos",
          "agua",
          "sono",
        ],
        targetScreen: "DataScreen" as keyof AppStackParamList,
      },
      {
        id: "calories",
        title: "Calorias e nutrição",
        description: "Resumo nutricional diário",
        keywords: ["calorias", "nutricao", "dieta", "alimentacao", "consumo"],
        targetScreen: "CaloriesScreen" as keyof AppStackParamList,
      },
      {
        id: "steps",
        title: "Monitor de passos",
        description: "Metas e progresso diário",
        keywords: ["passos", "steps", "caminhada", "andamento", "distancia"],
        targetScreen: "StepsScreen" as keyof AppStackParamList,
      },
      {
        id: "sleep",
        title: "Sono e descanso",
        description: "Qualidade do sono",
        keywords: ["sono", "sleep", "descanso", "noturno", "qualidade", "horas"],
        targetScreen: "SleepScreen" as keyof AppStackParamList,
      },
      {
        id: "water",
        title: "Hidratação",
        description: "Controle de água ingerida",
        keywords: ["agua", "hidratacao", "hidratação", "water", "líquidos"],
        targetScreen: "WaterScreen" as keyof AppStackParamList,
      },
      {
        id: "results",
        title: "Resultados gerais",
        description: "Radar de performance",
        keywords: ["resultados", "performance", "radar", "comparativo"],
        targetScreen: "ResultsScreen" as keyof AppStackParamList,
      },
      {
        id: "cycling",
        title: "Ciclismo",
        description: "Mapeamento das rotas",
        keywords: ["ciclismo", "bike", "rotas", "trajetos", "gps"],
        targetScreen: "CyclingScreen" as keyof AppStackParamList,
      },
      {
        id: "map",
        title: "Mapa e rotas",
        description: "Visualizar mapa e rotas",
        keywords: ["mapa", "rotas", "trajetos", "localizacao", "explorar"],
        targetScreen: "MapScreen" as keyof AppStackParamList,
      },
      {
        id: "diet",
        title: "Planos de dieta",
        description: "Sugestões de refeições",
        keywords: ["dieta", "refeicoes", "nutricao", "meal", "alimentacao"],
        targetScreen: "DietScreen" as keyof AppStackParamList,
      },
      {
        id: "chat",
        title: "Chat e mensagens",
        description: "Converse com especialistas",
        keywords: ["chat", "mensagens", "comunicar", "ajuda", "suporte"],
        targetScreen: "ChatScreen" as keyof AppStackParamList,
      },
    ];

    const exerciseEntries = exerciseData.map<SearchEntry>((exercise) => ({
      id: `exercise-${exercise.id}`,
      title: exercise.title,
      description: `${exercise.minutes} · ${exercise.calories}`,
      keywords: [
        exercise.title,
        "exercicio",
        "treino",
        "popular",
        exercise.calories,
        exercise.minutes,
      ],
      extraAction: () =>
        Alert.alert(
          exercise.title,
          "Localize este exercício na seção “Exercícios populares” para saber mais."
        ),
    }));

    return [...entries, ...exerciseEntries];
  }, [user]);

  const filteredResults = useMemo(() => {
    const term = normalizeText(search.trim());
    if (!term) {
      return [];
    }

    return searchEntries.filter((entry) =>
      entry.keywords.some((keyword) => normalizeText(keyword).includes(term))
    );
  }, [search, searchEntries]);

  const handleResultPress = (item: SearchEntry) => {
    if (item.targetScreen) {
      navigation.navigate(item.targetScreen as never);
    }
    if (item.extraAction) {
      item.extraAction();
    }
    setSearch("");
  };

  return (
    <View style={styles.container}>
      <Header notificationSheetHeight={notificationSheetHeight} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar"
          icon={<Search size={24} color="#888" />}
        />
        {!!search.trim().length && (
          <View style={styles.searchResultsContainer}>
            {filteredResults.length > 0 ? filteredResults.map((result) => (
              <TouchableOpacity key={result.id} style={styles.searchResultItem} onPress={() => handleResultPress(result)}>
                <Text style={styles.searchResultTitle}>{result.title}</Text>{result.description ? <Text style={styles.searchResultSubtitle}>{result.description}</Text> : null}
              </TouchableOpacity>
            )) : <Text style={styles.noSearchResultsText}>Nenhuma referência encontrada.</Text>}
          </View>
        )}
        <PromotionalBanner gender={selectedGender} /><TrainingSelector title="Selecione seu treino" containerStyle={{ marginBottom: 24 }} /><Communities />
        <View style={styles.section}><Text style={styles.sectionTitle}>Exercícios populares</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exercisesList}>{exerciseData.map((exercise) => (<ImageBackground key={exercise.id} source={{ uri: exercise.imageUrl }} style={styles.exerciseCard} imageStyle={{ borderRadius: 16 }}><View style={styles.imageOverlay}><View style={styles.exerciseCardContent}><Text style={styles.exerciseTitle}>{exercise.title}</Text><View style={styles.exerciseInfo}><View style={styles.tagsContainer}><View style={styles.calorieTag}><Text style={styles.calorieText}>{exercise.calories}</Text></View><View style={styles.MinutesTag}><Text style={styles.MinutesText}>{exercise.minutes}</Text></View></View><TouchableOpacity style={styles.playButton} activeOpacity={0.7} onPress={() => { }}><Play size={12} fill={"#192126"} /></TouchableOpacity></View></View></View></ImageBackground>))}</ScrollView></View><PlanCardTraining /><TrainingBanner title="Melhor treino de superiores" imageUrl="https://img.freepik.com/free-photo/view-woman-helping-man-exercise-gym_52683-98092.jpg?t=st=1758297406~exp=1758301006~hmac=66860a69d0b54e22b28d0831392e01278764d6b6d47e956a9576e041c9e016c2&w=1480" onPress={() => { }} /><TheBestForYou /><ChallengesSection /><HeatingScreen /><FooterVersion style={styles.footer} />
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
    paddingTop: 20,
  },
  searchResultsContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
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
