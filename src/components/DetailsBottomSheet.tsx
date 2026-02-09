import React from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { api } from "../services/api";
import { PersonalTrainerCard, PersonalTrainer } from "@components/PersonalTrainerCard";

export type { PersonalTrainer };

interface DetailsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  title: string;
  trainers: PersonalTrainer[];
  isLoading: boolean;
  noDataMessage?: string;
  sheetIndex: number;
  setSheetIndex: (idx: number) => void;
  onTrainerPress?: (trainer: PersonalTrainer) => void;
  onViewSelected?: (trainers: PersonalTrainer[]) => void;
}

export function DetailsBottomSheet({
  isOpen,
  onClose,
  bottomSheetRef,
  title,
  trainers,
  isLoading,
  noDataMessage = "Nenhuma ocorrência encontrada",
  sheetIndex,
  setSheetIndex,
  onTrainerPress,
  onViewSelected,
}: DetailsBottomSheetProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [fetchedTrainers, setFetchedTrainers] = React.useState<PersonalTrainer[] | null>(null);
  const [localLoading, setLocalLoading] = React.useState(false);

  // Fetch personals from backend when sheet opens (falls back to `trainers` prop if provided)
  React.useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const fetchPersonals = async () => {
      setLocalLoading(true);
      try {
        const res = await api.get("/personals?limit=50&offset=0");
        const data = res?.data?.data || [];
        if (!mounted) return;
        const mapped: PersonalTrainer[] = data.map((t: any) => ({
          id: String(t.id),
          name: t.name || t.nome || t.username || "Sem nome",
          description: t.description || t.descricao || "",
          rating: typeof t.rating === "number" ? t.rating : 0,
          imageUrl: t.avatarUrl || t.avatar_url || t.avatar || "",
        }));
        setFetchedTrainers(mapped);
      } catch (err) {
        console.error("Erro ao buscar personals:", err);
        setFetchedTrainers([]);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchPersonals();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const toggleSelect = (t: PersonalTrainer) => {
    setSelectedIds((prev) =>
      prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
    );
  };

  const handleViewSelected = () => {
    const selected = trainers.filter((t) => selectedIds.includes(t.id));
    onViewSelected?.(selected);
  };

  const trainersToRender: PersonalTrainer[] =
    fetchedTrainers && fetchedTrainers.length > 0
      ? fetchedTrainers
      : Array.isArray(trainers)
        ? trainers
        : [];
  const loadingToShow = localLoading || isLoading;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={["25%", "50%", "100%"]}
      enablePanDownToClose={true}
      onClose={onClose}
      index={sheetIndex}
      onChange={setSheetIndex}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.bottomSheetView}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* Cabeçalho */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          {/* Lista de Personal Trainers */}
          {loadingToShow ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
          ) : !!trainersToRender.length ? (
            trainersToRender.map((trainer) => (
              <PersonalTrainerCard
                key={trainer.id}
                trainer={trainer}
                onPress={onTrainerPress ? onTrainerPress : toggleSelect}
              />
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>{noDataMessage}</Text>
            </View>
          )}
          {!!selectedIds.length && (
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.viewSelectedButton} onPress={handleViewSelected}>
                <Text style={styles.viewSelectedText}>Ver selecionados ({selectedIds.length})</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: "#d1d5db",
    width: 40,
    height: 4,
  },
  bottomSheetView: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    minHeight: 400,
    justifyContent: "flex-start",
    flex: 1,
  },
  headerContainer: { alignItems: "flex-start", marginBottom: 16 },
  headerTitle: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "left",
    marginLeft: 10,
  },
  loaderContainer: {
    padding: 20,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  noDataContainer: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  noDataText: { color: "#6b7280", fontSize: 14, textAlign: "center" },
  footerActions: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewSelectedButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  viewSelectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
