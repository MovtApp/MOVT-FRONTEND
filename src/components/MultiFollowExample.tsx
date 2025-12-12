import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { useMultiFollow } from "../hooks/useMultiFollow";

interface TrainerSelection {
  id: number;
  name: string;
  selected: boolean;
}

/**
 * Exemplo de componente que permite seguir múltiplos trainers
 * Este é um componente de exemplo que demonstra como usar o hook useMultiFollow
 */
export function MultiFollowExample() {
  const { user } = useAuth();
  const { isLoading, followMultiple, unfollowMultiple } = useMultiFollow({
    sessionToken: user?.sessionId || "",
  });

  const [trainers, setTrainers] = useState<TrainerSelection[]>([
    { id: 1, name: "Oliver Augusto", selected: false },
    { id: 2, name: "Carlos Silva", selected: false },
    { id: 3, name: "Maria Santos", selected: false },
    { id: 4, name: "João Pedro", selected: false },
    { id: 5, name: "Ana Costa", selected: false },
  ]);

  const toggleTrainerSelection = (trainerId: number) => {
    setTrainers((prev) =>
      prev.map((trainer) =>
        trainer.id === trainerId ? { ...trainer, selected: !trainer.selected } : trainer
      )
    );
  };

  const selectAll = () => {
    setTrainers((prev) => prev.map((trainer) => ({ ...trainer, selected: true })));
  };

  const deselectAll = () => {
    setTrainers((prev) => prev.map((trainer) => ({ ...trainer, selected: false })));
  };

  const handleFollowSelected = async () => {
    const selectedIds = trainers.filter((t) => t.selected).map((t) => t.id);

    if (selectedIds.length === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um trainer para seguir");
      return;
    }

    await followMultiple(selectedIds);
    deselectAll();
  };

  const handleUnfollowSelected = async () => {
    const selectedIds = trainers.filter((t) => t.selected).map((t) => t.id);

    if (selectedIds.length === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um trainer para deixar de seguir");
      return;
    }

    await unfollowMultiple(selectedIds);
    deselectAll();
  };

  const selectedCount = trainers.filter((t) => t.selected).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciar Trainers</Text>
        <Text style={styles.subtitle}>
          Você pode seguir ou deixar de seguir múltiplos trainers de uma vez
        </Text>
      </View>

      {/* Controles de seleção */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.selectAllButton]}
          onPress={selectAll}
          disabled={isLoading}
        >
          <Text style={styles.controlButtonText}>Selecionar Todos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.deselectAllButton]}
          onPress={deselectAll}
          disabled={isLoading}
        >
          <Text style={styles.controlButtonText}>Limpar Seleção</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de trainers */}
      <View style={styles.trainersList}>
        {trainers.map((trainer) => (
          <TouchableOpacity
            key={trainer.id}
            style={[styles.trainerItem, trainer.selected && styles.trainerItemSelected]}
            onPress={() => toggleTrainerSelection(trainer.id)}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, trainer.selected && styles.checkboxSelected]}>
              {trainer.selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.trainerName, trainer.selected && styles.trainerNameSelected]}>
              {trainer.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contadores e botões de ação */}
      {selectedCount > 0 && (
        <View style={styles.actionSection}>
          <Text style={styles.selectedCounter}>{selectedCount} trainer(s) selecionado(s)</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.followButton]}
              onPress={handleFollowSelected}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Seguir ({selectedCount})</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.unfollowButton]}
              onPress={handleUnfollowSelected}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Deixar de Seguir ({selectedCount})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Dica</Text>
        <Text style={styles.infoText}>
          Você pode selecionar múltiplos trainers e seguir ou deixar de seguir todos ao mesmo tempo.
          Isso é útil para descobrir novos trainers e construir sua rede de contatos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#10B981",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  controls: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectAllButton: {
    backgroundColor: "#10B981",
  },
  deselectAllButton: {
    backgroundColor: "#E5E7EB",
  },
  controlButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 12,
  },
  trainersList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trainerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  trainerItemSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#10B981",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  trainerNameSelected: {
    color: "#059669",
    fontWeight: "600",
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 12,
  },
  selectedCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  followButton: {
    backgroundColor: "#10B981",
  },
  unfollowButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 20,
  },
});
