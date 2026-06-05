import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CirclePlus,
  Clock4,
  Flame,
  Plus,
  Search,
  SquarePen,
  Trash,
  Check,
} from "lucide-react-native";
import SearchInput from "../../../components/SearchInput";
import { api } from "../../../services/api";
import { secureGet } from "../../../services/secureStore";
import DietFormSheet from "../../../components/DietFormSheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList, DietMeal } from "../../../@types/routes";
import Header from "../../../components/Header";
import { useAppData } from "@contexts/AppDataContext";

const DietScreen: React.FC<NativeStackScreenProps<AppStackParamList, "DietScreen">> = ({
  navigation,
  route,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { dietMeals, fetchDietMeals } = useAppData();
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<DietMeal | undefined>(undefined);
  const dietFormSheetRef = useRef<any>(null);
  const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);

  // Posiciona o FAB acima do BottomNavigationBar: replica o mesmo bottomInset da
  // barra (ver BottomNavigationBar.tsx), soma a altura dela (60) + um respiro.
  const insets = useSafeAreaInsets();
  const navBottomInset =
    Platform.OS === "android" ? (insets.bottom > 0 ? insets.bottom + 5 : 10) : insets.bottom || 12;
  const fabBottom = navBottomInset + 60 + 16;

  const categories = useMemo(
    () => [
      { key: "all", label: "Todas" },
      { key: "breakfast", label: "Café da manhã" },
      { key: "lunch", label: "Almoço" },
      { key: "dinner", label: "Janta" },
    ],
    []
  );

  // Normaliza para busca: remove acentos, baixa caixa e apara espaços.
  const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");
  const normalize = (s?: string | null) =>
    (s || "")
      .normalize("NFD")
      .replace(DIACRITICS, "")
      .toLowerCase()
      .trim();

  const filteredMeals = useMemo(() => {
    const q = normalize(search);
    if (!q) return dietMeals;
    // Suporta múltiplos termos: "frango arroz" casa itens que contenham ambos.
    const terms = q.split(/\s+/).filter(Boolean);
    return dietMeals.filter((meal) => {
      const haystack = normalize(
        [meal?.title, meal?.description, meal?.authorName].filter(Boolean).join(" ")
      );
      return terms.every((t) => haystack.includes(t));
    });
  }, [dietMeals, search]);

  const isAllSelected = useMemo(
    () => filteredMeals.length > 0 && selectedDietIds.length === filteredMeals.length,
    [filteredMeals, selectedDietIds]
  );

  const toggleSelect = (dietId: string) => {
    setSelectedDietIds((prev) => {
      if (prev.includes(dietId)) {
        return prev.filter((id) => id !== dietId);
      }
      return [...prev, dietId];
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDietIds([]);
    } else {
      setSelectedDietIds(filteredMeals.map((m) => m.id_dieta as string));
    }
  };

  useEffect(() => {
    fetchDietMeals(selectedCategory);
  }, [selectedCategory, fetchDietMeals]);

  const handleAddDiet = () => {
    setFormInitialData(undefined);
    setSheetIndex(0);
    setIsFormSheetOpen(true);
  };

  const handleEditDiet = (dietId: string) => {
    const dietToEdit = dietMeals.find((meal) => meal.id === dietId);
    if (dietToEdit) {
      setFormInitialData(dietToEdit);
      setIsFormSheetOpen(true);
    } else {
      Alert.alert("Erro", "Dieta não encontrada para edição.");
    }
  };

  const handleBulkEdit = () => {
    if (selectedDietIds.length === 1) {
      handleEditDiet(selectedDietIds[0]);
    } else {
      Alert.alert("Erro", "Selecione exatamente 1 dieta para editar.");
    }
  };

  const handleBulkDelete = () => {
    if (selectedDietIds.length > 0) {
      Alert.alert("Confirmar Exclusão", "Tem certeza que deseja excluir as dietas selecionadas?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              const sessionId = await secureGet("userSessionId");
              if (!sessionId) {
                Alert.alert("Erro", "Sessão não encontrada. Faça login novamente.");
                return;
              }

              await Promise.all(
                selectedDietIds.map((id) =>
                  api.delete(`/dietas/${id}`, {
                    headers: {
                      Authorization: `Bearer ${sessionId}`,
                    },
                  })
                )
              );
              Alert.alert("Sucesso", "Dietas excluídas com sucesso!");
              fetchDietMeals();
            } catch (error) {
              console.error("Erro ao excluir dietas:", error);
              Alert.alert("Erro", "Não foi possível excluir as dietas.");
            }
          },
        },
      ]);
    } else {
      Alert.alert("Erro", "Selecione pelo menos 1 dieta para excluir.");
    }
  };

  const handleCloseForm = () => {
    setIsFormSheetOpen(false);
    setSheetIndex(0);
    setFormInitialData(undefined);
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar"
          icon={<Search size={20} color="#888" />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setSelectedCategory(c.key)}
              activeOpacity={0.9}
              style={[styles.chip, selectedCategory === c.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCategory === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.selectAllRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <View style={[styles.checkbox, isAllSelected && styles.checkboxChecked]}>
              {isAllSelected && <Check size={16} color="#0F172A" />}
            </View>
            <Text style={styles.selectAllText}>
              {isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
            </Text>
          </TouchableOpacity>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionIconButton}
              activeOpacity={0.85}
              onPress={handleAddDiet}
            >
              <CirclePlus size={20} color="#192126" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionIconButton,
                selectedDietIds.length !== 1 && styles.actionIconDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleBulkEdit}
            >
              <SquarePen size={20} color="#192126" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionIconButton,
                selectedDietIds.length === 0 && styles.actionIconDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleBulkDelete}
            >
              <Trash size={20} color="#192126" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Refeições</Text>

        {filteredMeals.map((meal) => (
          <TouchableOpacity
            key={meal.id_dieta}
            style={[
              styles.mealCard,
              selectedDietIds.includes(meal.id_dieta) && styles.mealCardSelected,
            ]}
            activeOpacity={0.9}
            onPress={() => {
              if (selectedDietIds.length > 0) {
                toggleSelect(meal.id_dieta);
              } else {
                navigation.navigate("DietDetails", { meal: { ...meal } });
              }
            }}
            onLongPress={() => {
              toggleSelect(meal.id_dieta);
            }}
          >
            <Image
              source={{ uri: meal.imageUrl }}
              style={{ width: "100%", height: 160 }}
              onLoad={() => console.log("✅ Imagem carregada:", meal.imageUrl)}
              onError={(error) => console.log("❌ Erro ao carregar imagem:", meal.imageUrl, error)}
            />
            <TouchableOpacity
              style={styles.selectionCheckboxContainer}
              onPress={() => toggleSelect(meal.id_dieta)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedDietIds.includes(meal.id_dieta) && styles.checkboxChecked,
                ]}
              >
                {selectedDietIds.includes(meal.id_dieta) && <Check size={16} color="#0F172A" />}
              </View>
            </TouchableOpacity>
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>{meal.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Flame size={14} color="#192126" />
                  <Text style={styles.metaText}>{meal.calories}</Text>
                </View>
                <View style={styles.metaSeparator} />
                <View style={styles.metaItem}>
                  <Clock4 size={12} color="#192126" />
                  <Text style={styles.metaText}>{meal.minutes}</Text>
                </View>
                <View style={styles.metaSeparator} />
                <View style={styles.authorRow}>
                  <Image source={{ uri: meal.authorAvatar }} style={styles.authorAvatar as any} />
                  <Text style={styles.authorName}>{meal.authorName}</Text>
                </View>
              </View>
              {meal.description ? (
                <Text style={styles.mealDescription} numberOfLines={2}>
                  {meal.description}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}

        {filteredMeals.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={32} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>
              {search.trim()
                ? `Nenhuma refeição encontrada para "${search.trim()}"`
                : "Nenhuma refeição cadastrada"}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        activeOpacity={0.9}
        onPress={handleAddDiet}
      >
        <Plus size={24} color="#0F172A" />
      </TouchableOpacity>

      {/* DietFormSheet para Adicionar/Editar Dieta (renderizado em portal acima do header) */}
      <View pointerEvents="box-none" style={styles.sheetPortal}>
        <DietFormSheet
          isOpen={isFormSheetOpen}
          onClose={handleCloseForm}
          initialData={formInitialData}
          bottomSheetRef={dietFormSheetRef}
          sheetIndex={sheetIndex}
          setSheetIndex={setSheetIndex}
          onSuccess={fetchDietMeals}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoriesRow: {
    flexDirection: "row",
    gap: 10 as any,
    marginTop: 12,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingHorizontal: 29,
    paddingVertical: 8,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: "#BBF246",
  },
  chipText: {
    color: "#fff",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#111827",
    fontWeight: "700",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10 as any,
    marginTop: 8,
  },
  selectedCount: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#192126",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#BBF246",
    borderColor: "#192126",
  },
  selectAllText: {
    color: "#111827",
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
  },
  actionIconButton: {
    padding: 6,
    backgroundColor: "transparent",
  },
  actionIconDisabled: {
    opacity: 0.4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mealCardSelected: {
    borderColor: "#BBF246",
    borderWidth: 2,
  },
  mealImage: {
    width: "100%",
    height: 160,
  },
  mealInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  mealDescription: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  authorName: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  mealOverlay: {
    ...(StyleSheet.absoluteFillObject as any),
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  mealInfoBox: {
    position: "absolute",
    left: 12,
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mealTitle: {
    color: "#192126",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10 as any,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
  },
  metaSeparator: {
    width: 1,
    height: 14,
    backgroundColor: "#E5E7EB",
  },
  metaDot: {
    color: "#6b7280",
    marginHorizontal: 4,
  },
  metaText: {
    color: "#191919",
    fontSize: 12,
    fontWeight: "600",
  },
  selectionCheckboxContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    padding: 2,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetPortal: {
    ...(StyleSheet.absoluteFillObject as any),
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: "box-none",
  },
});

export default DietScreen;
