import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Star, X } from "lucide-react-native";

interface RatingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    ratingProfessional: number;
    ratingTraining: number;
    comment: string;
  }) => Promise<void>;
  trainerName: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ isVisible, onClose, onSubmit, trainerName }) => {
  const [ratingProfessional, setRatingProfessional] = useState(0);
  const [ratingTraining, setRatingTraining] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (ratingProfessional === 0 || ratingTraining === 0) {
      Alert.alert("Ops!", "Por favor, preencha as estrelas para o profissional e para o treino.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ ratingProfessional, ratingTraining, comment });
      // Reset
      setRatingProfessional(0);
      setRatingTraining(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      Alert.alert("Erro", "Não foi possível enviar sua avaliação.");
    } finally {
      setLoading(false);
    }
  };

  const RenderStars = ({
    rating,
    setRating,
  }: {
    rating: number;
    setRating: (v: number) => void;
  }) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Star
            size={32}
            fill={star <= rating ? "#BBF246" : "transparent"}
            color={star <= rating ? "#BBF246" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.title}>Avaliar experiência</Text>
          <Text style={styles.subtitle}>Como foi o seu treino com {trainerName}?</Text>

          <View style={styles.section}>
            <Text style={styles.label}>O profissional</Text>
            <RenderStars rating={ratingProfessional} setRating={setRatingProfessional} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>A qualidade do treino</Text>
            <RenderStars rating={ratingTraining} setRating={setRatingTraining} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Comentário (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Conte-nos o que achou..."
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#192126" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#BBF246",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#192126",
  },
});

export default RatingModal;
