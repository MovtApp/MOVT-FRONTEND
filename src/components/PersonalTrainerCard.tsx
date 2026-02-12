import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Star } from "lucide-react-native";

export interface PersonalTrainer {
  id: string;
  name: string;
  description: string;
  rating: number;
  imageUrl: string;
  id_academia?: number;
}

interface PersonalTrainerCardProps {
  trainer: PersonalTrainer;
  onPress?: (trainer: PersonalTrainer) => void;
}

export const PersonalTrainerCard: React.FC<PersonalTrainerCardProps> = ({ trainer, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.85}
      onPress={() => onPress?.(trainer)}
      accessibilityRole="button"
    >
      <Image source={{ uri: trainer.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{trainer.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {trainer.description}
        </Text>
        <View style={styles.cardRatingContainer}>
          <Star size={16} color="#FFC107" fill="#FFC107" />
          <Text style={styles.cardRatingText}>{trainer.rating} avaliações</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 8,
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
});
