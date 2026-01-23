import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Clock, Flame, TrendingUp, Dumbbell, Heart } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "@components/BackButton";
import SearchInput from "@components/SearchInput";
import { FooterVersion } from "@components/FooterVersion";
import { AppStackParamList, Training } from "../../../@types/routes";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// Mock Data - Treinos
const TRAININGS_DATA: Training[] = [
  {
    id_treino: "1",
    nome: "HIIT Completo",
    descricao:
      "Treino intervalado de alta intensidade para queima máxima de calorias. Ideal para quem busca resultados rápidos.",
    imageurl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop",
    duracao: "30 min",
    calorias: "350 kcal",
    nivel: "Intermediário",
    categoria: "HIIT",
    instrutor: "Carlos Mendes",
    equipamentos: ["Nenhum"],
    exercicios: [
      { id: "1", nome: "Burpees", series: 4, repeticoes: 15, descanso: "30s" },
      { id: "2", nome: "Mountain Climbers", series: 4, repeticoes: 20, descanso: "30s" },
      { id: "3", nome: "Jump Squats", series: 4, repeticoes: 15, descanso: "30s" },
      { id: "4", nome: "High Knees", series: 4, repeticoes: 30, descanso: "30s" },
    ],
  },
  {
    id_treino: "2",
    nome: "Força Total",
    descricao: "Desenvolvimento de força e massa muscular com foco em grandes grupos musculares.",
    imageurl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2670&auto=format&fit=crop",
    duracao: "45 min",
    calorias: "280 kcal",
    nivel: "Avançado",
    categoria: "Força",
    instrutor: "Ana Paula",
    equipamentos: ["Halteres", "Barra"],
    exercicios: [
      { id: "1", nome: "Agachamento Livre", series: 4, repeticoes: 12, descanso: "1min" },
      { id: "2", nome: "Supino Reto", series: 4, repeticoes: 10, descanso: "1min" },
      { id: "3", nome: "Levantamento Terra", series: 4, repeticoes: 8, descanso: "1min 30s" },
      { id: "4", nome: "Desenvolvimento", series: 3, repeticoes: 12, descanso: "1min" },
    ],
  },
  {
    id_treino: "3",
    nome: "Yoga Matinal",
    descricao:
      "Sequência suave de yoga para despertar o corpo e a mente. Perfeito para começar o dia com energia.",
    imageurl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2620&auto=format&fit=crop",
    duracao: "25 min",
    calorias: "120 kcal",
    nivel: "Iniciante",
    categoria: "Yoga",
    instrutor: "Julia Costa",
    equipamentos: ["Tapete de Yoga"],
    exercicios: [
      { id: "1", nome: "Saudação ao Sol", series: 3, repeticoes: 1, descanso: "0s" },
      { id: "2", nome: "Postura da Árvore", series: 2, repeticoes: 1, descanso: "30s" },
      { id: "3", nome: "Postura do Guerreiro", series: 2, repeticoes: 1, descanso: "30s" },
      { id: "4", nome: "Relaxamento Final", series: 1, repeticoes: 1, descanso: "0s" },
    ],
  },
  {
    id_treino: "4",
    nome: "Cardio Intenso",
    descricao: "Treino cardiovascular focado em resistência e condicionamento físico.",
    imageurl:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=2670&auto=format&fit=crop",
    duracao: "40 min",
    calorias: "420 kcal",
    nivel: "Intermediário",
    categoria: "Cardio",
    instrutor: "Pedro Silva",
    equipamentos: ["Esteira", "Bike"],
    exercicios: [
      { id: "1", nome: "Corrida Intervalada", series: 5, repeticoes: 1, descanso: "1min" },
      { id: "2", nome: "Bike Sprint", series: 4, repeticoes: 1, descanso: "1min" },
      { id: "3", nome: "Pular Corda", series: 3, repeticoes: 100, descanso: "45s" },
    ],
  },
  {
    id_treino: "5",
    nome: "Flexibilidade",
    descricao: "Alongamentos profundos para melhorar mobilidade e prevenir lesões.",
    imageurl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2670&auto=format&fit=crop",
    duracao: "20 min",
    calorias: "80 kcal",
    nivel: "Iniciante",
    categoria: "Flexibilidade",
    instrutor: "Sofia Alves",
    equipamentos: ["Tapete"],
    exercicios: [
      { id: "1", nome: "Alongamento de Isquiotibiais", series: 3, repeticoes: 1, descanso: "15s" },
      { id: "2", nome: "Alongamento de Quadríceps", series: 3, repeticoes: 1, descanso: "15s" },
      { id: "3", nome: "Torção Espinal", series: 2, repeticoes: 1, descanso: "20s" },
    ],
  },
  {
    id_treino: "6",
    nome: "Core Power",
    descricao: "Fortalecimento do core para melhor estabilidade e postura.",
    imageurl:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2670&auto=format&fit=crop",
    duracao: "35 min",
    calorias: "200 kcal",
    nivel: "Intermediário",
    categoria: "Força",
    instrutor: "Roberto Lima",
    equipamentos: ["Tapete", "Bola Suíça"],
    exercicios: [
      { id: "1", nome: "Prancha", series: 4, repeticoes: 1, descanso: "30s" },
      { id: "2", nome: "Abdominal Bicicleta", series: 3, repeticoes: 20, descanso: "30s" },
      { id: "3", nome: "Russian Twist", series: 3, repeticoes: 30, descanso: "30s" },
      { id: "4", nome: "Prancha Lateral", series: 3, repeticoes: 1, descanso: "30s" },
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "Todos", icon: TrendingUp },
  { id: "HIIT", label: "HIIT", icon: Flame },
  { id: "Força", label: "Força", icon: Dumbbell },
  { id: "Cardio", label: "Cardio", icon: Heart },
  { id: "Yoga", label: "Yoga", icon: Heart },
  { id: "Flexibilidade", label: "Flexibilidade", icon: Heart },
];

const TrainingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const normalizeText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredTrainings = useMemo(() => {
    let result = TRAININGS_DATA;

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((training) => training.categoria === selectedCategory);
    }

    // Filter by search
    if (search.trim()) {
      const searchTerm = normalizeText(search.trim());
      result = result.filter(
        (training) =>
          normalizeText(training.nome).includes(searchTerm) ||
          normalizeText(training.categoria).includes(searchTerm) ||
          normalizeText(training.nivel).includes(searchTerm) ||
          normalizeText(training.descricao).includes(searchTerm)
      );
    }

    return result;
  }, [selectedCategory, search]);

  const handleTrainingPress = (training: Training) => {
    navigation.navigate("TrainingDetails", { training });
  };

  const getLevelColor = (nivel: string) => {
    switch (nivel) {
      case "Iniciante":
        return "#4ECDC4";
      case "Intermediário":
        return "#F7B731";
      case "Avançado":
        return "#FF6B6B";
      default:
        return "#6B7280";
    }
  };

  const renderTrainingCard = ({ item }: { item: Training }) => (
    <TouchableOpacity
      style={styles.trainingCard}
      onPress={() => handleTrainingPress(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageurl }} style={styles.trainingImage} />
      <View style={styles.trainingOverlay}>
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.nivel) }]}>
          <Text style={styles.levelText}>{item.nivel}</Text>
        </View>
      </View>
      <View style={styles.trainingInfo}>
        <Text style={styles.trainingName} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={styles.trainingCategory}>{item.categoria}</Text>
        <View style={styles.trainingStats}>
          <View style={styles.statItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.duracao}</Text>
          </View>
          <View style={styles.statItem}>
            <Flame size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.calorias}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Treinos</Text>
        <View style={{ width: 46 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar treinos..."
          icon={<Search size={20} color="#888" />}
        />
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <Icon size={16} color={isActive ? "#192126" : "#6B7280"} strokeWidth={2.5} />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Training Grid */}
      <FlatList
        data={filteredTrainings}
        renderItem={renderTrainingCard}
        keyExtractor={(item) => item.id_treino}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum treino encontrado</Text>
          </View>
        }
        ListFooterComponent={<FooterVersion />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },
  searchContainer: {
    paddingHorizontal: 20,
  },
  categoriesSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  categoryChipActive: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#192126",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  trainingCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trainingImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
  },
  trainingOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  trainingInfo: {
    padding: 12,
  },
  trainingName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 4,
  },
  trainingCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  trainingStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});

export default TrainingScreen;
