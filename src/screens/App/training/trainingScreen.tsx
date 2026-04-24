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
import { useAppData } from "@contexts/AppDataContext";
import { AppStackParamList, Training } from "../../../@types/routes";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

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
  const { trainings, loadingTrainings, fetchHomeData } = useAppData();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const normalizeText = (text: string) =>
    text
      ? text
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      : "";

  const filteredTrainings = useMemo(() => {
    let result = trainings;

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
  }, [selectedCategory, search, trainings]);

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
        keyExtractor={(item, index) => String(item?.id_treino || index)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loadingTrainings}
        onRefresh={() => fetchHomeData(null, true)}
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
