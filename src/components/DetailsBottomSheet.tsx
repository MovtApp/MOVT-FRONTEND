import React from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { H4, P } from "./Typography";
import { Star } from "lucide-react-native";

interface PersonalTrainer {
  id: string;
  name: string;
  description: string;
  rating: number;
  imageUrl: string;
}

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
}

// Componente para renderizar texto com truncamento inteligente
const PersonalTrainerCard = ({
  trainer,
  onPress,
}: {
  trainer: PersonalTrainer;
  onPress?: (t: PersonalTrainer) => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.85}
      onPress={() => onPress?.(trainer)}
      accessibilityRole="button"
    >
      <Image source={{ uri: trainer.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <P style={styles.cardTitle}>{trainer.name}</P>
        <P style={styles.cardDescription} numberOfLines={2}>
          {trainer.description}
        </P>
        <View style={styles.cardRatingContainer}>
          <Star size={16} color="#FFC107" fill="#FFC107" />
          <P style={styles.cardRatingText}>{Math.round(trainer.rating)} avaliações</P>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
}: DetailsBottomSheetProps) {
  if (!isOpen) {
    return null;
  }

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
            <H4 style={styles.headerTitle}>{title}</H4>
          </View>

          {/* Lista de Personal Trainers */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
          ) : Array.isArray(trainers) && trainers.length > 0 ? (
            trainers.map((trainer) => (
              <PersonalTrainerCard key={trainer.id} trainer={trainer} onPress={onTrainerPress} />
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <P style={styles.noDataText}>{noDataMessage}</P>
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
  cardContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1EBF4",
  },
  cardImage: {
    width: 116,
    height: 104,
    borderRadius: 8, // Círculo
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  cardRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  cardRatingText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#4b5563",
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
});
