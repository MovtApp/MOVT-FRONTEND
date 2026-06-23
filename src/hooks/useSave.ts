import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { notifyApiError } from "../utils/notify";

interface UseSaveReturn {
  isSaved: boolean;
  toggleSave: () => Promise<void>;
  isLoading: boolean;
}

export const useSave = (postId: string, initialIsSaved: boolean = false): UseSaveReturn => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const toggleSave = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/user/posts/${postId}/save`);
        setIsSaved(false);
      } else {
        await api.post(`/user/posts/${postId}/save`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Erro ao salvar/desalvar post:", error);
      notifyApiError(error, "Não foi possível salvar o post.");
    } finally {
      setIsLoading(false);
    }
  }, [user, postId, isSaved]);

  return {
    isSaved,
    toggleSave,
    isLoading,
  };
};
