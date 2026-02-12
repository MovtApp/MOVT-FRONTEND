import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MapPin, Phone, Star, Globe } from "lucide-react-native";
import { Gym } from "@services/gymService";

interface GymCardProps {
  gym: Gym;
  onClose?: () => void;
  onDetailsPress?: (gym: Gym) => void;
}

export const GymCard: React.FC<GymCardProps> = ({ gym, onDetailsPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {gym.nome}
        </Text>
        <View style={styles.ratingContainer}>
          <Star size={14} color="#fff" fill="#fff" />
          <Text style={styles.ratingText}>{Number(gym.rating || 0).toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <MapPin size={18} color="#059669" />
          <Text style={styles.infoText} numberOfLines={2}>
            {gym.endereco_completo}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Phone size={18} color="#059669" />
          <Text style={styles.infoText}>{gym.telefone}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onDetailsPress?.(gym)}
        activeOpacity={0.7}
        style={styles.detailsButton}
      >
        <Globe size={24} color="#059669" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#192126",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#192126",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "85%",
  },
  infoText: {
    fontSize: 13,
    color: "#4A4A4A",
    flex: 1,
    lineHeight: 18,
  },
  detailsButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
