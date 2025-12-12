import { useState } from "react";
import { Alert } from "react-native";
import { followMultipleTrainers, unfollowMultipleTrainers } from "../services/followService";

interface UseMultiFollowProps {
  sessionToken: string;
}

interface UseMultiFollowReturn {
  isLoading: boolean;
  followMultiple: (trainerIds: (string | number)[]) => Promise<void>;
  unfollowMultiple: (trainerIds: (string | number)[]) => Promise<void>;
}

/**
 * Hook para seguir/deixar de seguir múltiplos trainers
 * @param sessionToken - Token de autenticação
 * @returns Funções para seguir/deixar de seguir múltiplos trainers
 */
export function useMultiFollow({ sessionToken }: UseMultiFollowProps): UseMultiFollowReturn {
  const [isLoading, setIsLoading] = useState(false);

  const followMultiple = async (trainerIds: (string | number)[]) => {
    if (!sessionToken) {
      Alert.alert("Erro", "Sessão não disponível");
      return;
    }

    setIsLoading(true);
    try {
      const result = await followMultipleTrainers(trainerIds, sessionToken);
      Alert.alert("Sucesso", result.message || `${result.followedCount} trainer(s) adicionado(s)!`);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao seguir trainers");
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowMultiple = async (trainerIds: (string | number)[]) => {
    if (!sessionToken) {
      Alert.alert("Erro", "Sessão não disponível");
      return;
    }

    setIsLoading(true);
    try {
      const result = await unfollowMultipleTrainers(trainerIds, sessionToken);
      Alert.alert("Sucesso", result.message || `${result.unfollowedCount} trainer(s) removido(s)!`);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao deixar de seguir trainers");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    followMultiple,
    unfollowMultiple,
  };
}
