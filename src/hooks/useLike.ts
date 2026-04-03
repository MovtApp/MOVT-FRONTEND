import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

interface UseLikeReturn {
  isLiked: boolean;
  toggleLike: () => Promise<void>;
  isLoading: boolean;
}

export const useLike = (postId: string, initialIsLiked: boolean = false): UseLikeReturn => {
  const { user } = useAuth();
  // Usa useRef para controlar se o estado já foi iniciado com o valor do servidor,
  // evitando que re-renders externos resetem o estado para false após interação do usuário
  const hasInitialized = useRef(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Só sincroniza com o valor inicial uma vez (na primeira montagem ou quando o postId muda)
    // Após isso, o estado é controlado localmente pelo usuário
    if (!hasInitialized.current && initialIsLiked !== undefined && initialIsLiked !== null) {
      setIsLiked(initialIsLiked);
      hasInitialized.current = true;
    }
  }, [initialIsLiked, postId]);

  // Reset quando o postId muda (ex: navegação para outro post)
  useEffect(() => {
    hasInitialized.current = false;
    setIsLiked(initialIsLiked);
  }, [postId]);

  const toggleLike = useCallback(async () => {
    if (!user) return;

    // Atualização otimista: muda o ícone imediatamente, confirma no servidor
    const previousState = isLiked;
    setIsLiked(!previousState);
    setIsLoading(true);

    try {
      await api.post(`/user/posts/${postId}/like`);
    } catch (error) {
      // Reverte em caso de erro
      setIsLiked(previousState);
      console.error("Erro ao curtir/descurtir post:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, postId, isLiked]);

  return {
    isLiked,
    toggleLike,
    isLoading,
  };
};
