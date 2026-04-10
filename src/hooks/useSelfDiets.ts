import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** A diet shaped as a generic feed item so FeedScreen can merge it with posts */
export interface DietFeedItem {
  _type: "diet";
  id_dieta: string;
  title: string;
  description: string;
  imageUrl: string;
  calories: string;
  minutes: string;
  protein: string;
  fat: string;
  carbs: string;
  categoria?: string;
  id_us: number;
  authorName: string;
  authorAvatar: string;
  created_at: string;
  likes: any[];
  likes_count: number;
  comments_count: number;
  isLiked?: boolean;
}

interface UseSelfDietsReturn {
  diets: DietFeedItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useSelfDiets = (onlyMine: boolean = true): UseSelfDietsReturn => {
  const { user } = useAuth();
  const [diets, setDiets] = useState<DietFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDiets = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const sessionId = await AsyncStorage.getItem("userSessionId");
      const response = await api.get("/dietas", {
        headers: { Authorization: `Bearer ${sessionId}` },
        params: { mine: onlyMine ? "true" : "false" },
      });

      const mapped: DietFeedItem[] = (response.data.data || []).map(
        (d: any) => ({
          _type: "diet" as const,
          id_dieta: String(d.id_dieta),
          title: d.title || "Sem título",
          description: d.description || "",
          imageUrl: d.imageUrl || "https://via.placeholder.com/600",
          calories: `${d.calories || 0} kcal`,
          minutes: `${d.minutes || 0} min`,
          protein: `${d.protein || 0} g`,
          fat: `${d.fat || 0} g`,
          carbs: `${d.carbs || 0} g`,
          categoria: d.categoria,
          id_us: d.id_us,
          authorName: d.nome_autor || user?.username || "Você",
          authorAvatar:
            d.avatar_autor_url ||
            user?.photo ||
            "https://via.placeholder.com/150",
          created_at: d.created_at || new Date().toISOString(),
          likes: d.likes || [],
          likes_count: parseInt(d.likes_count || 0),
          comments_count: parseInt(d.comments_count || 0),
          isLiked: !!d.isLiked,
        })
      );

      // De-duplicate by id_dieta
      const unique = Array.from(
        new Map(mapped.map((item) => [item.id_dieta, item])).values()
      );
      setDiets(unique);
    } catch (error) {
      console.error("Erro ao buscar dietas próprias:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDiets();
  }, [fetchDiets]);

  return { diets, isLoading, refresh: fetchDiets };
};
