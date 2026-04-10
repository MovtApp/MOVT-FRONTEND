import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { userService } from "../services/userService";

interface Diet {
  id_dieta: string;
  nome: string;
  calorias?: number;
  tempo_preparo?: number;
  imageurl?: string;
  nome_autor?: string;
  avatar_autor_url?: string;
  descricao?: string;
  gordura?: number;
  proteina?: number;
  carboidratos?: number;
  categoria?: string;
}

interface Post {
  post_id: string;
  type: string;
  author: {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
    is_following: boolean;
  };
  media: {
    media_id: string;
    media_url: string;
    thumbnail_url: string;
    media_type: string;
    width: number;
    height: number;
    position: number;
  }[];
  caption: string;
  location: string | null;
  hashtags: string[];
  mentions: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  is_liked: boolean;
  is_saved: boolean;
  likes_hidden: boolean;
  comments_off: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  time_ago: string;
}

interface UseUserFollowingDietsReturn {
  diets: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useUserFollowingDiets = (): UseUserFollowingDietsReturn => {
  const { user } = useAuth();
  const [diets, setDiets] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [following, setFollowing] = useState<string[]>([]);

  // Buscar usuários que o usuário logado segue
  const loadFollowing = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await userService.getUserFollowing(user.id);
      setFollowing(response.data?.following || []);
    } catch (error) {
      console.error("Erro ao buscar usuários seguidos:", error);
    }
  }, [user?.id]);

  const loadDiets = useCallback(
    async (reset = false) => {
      if (!user?.id || following.length === 0) {
        if (reset) setDiets([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (reset) {
        setDiets([]);
        setCursor(null);
        setHasMore(true);
      }

      setIsLoading(true);
      try {
        // Buscar dietas dos usuários seguidos
        const response = await api.get("/dietas/feed", {
          params: {
            userIds: following.join(","),
            cursor: cursor,
            limit: 10,
          },
        });

        const newDiets = response.data.diets;
        
        // Mapear dietas para o formato de Post que o PostCard espera
        const mappedDiets = newDiets.map((diet: Diet) => ({
          post_id: diet.id_dieta,
          type: "diet",
          author: {
            user_id: diet.id_dieta, // Usando id_dieta como user_id temporariamente, ajustaremos se necessário
            username: diet.nome_autor || "Desconhecido",
            full_name: diet.nome_autor || "Desconhecido",
            avatar_url: diet.avatar_autor_url || "https://via.placeholder.com/150",
            is_verified: false, // Dietas não têm verificação
            is_following: true, // Já sabemos que estamos seguindo pois filtramos por usuários seguidos
          },
          media: diet.imageurl ? [{
            media_id: `${diet.id_dieta}_media_1`,
            media_url: diet.imageurl,
            thumbnail_url: diet.imageurl,
            media_type: "image",
            width: 1080, // Valores padrão
            height: 1080,
            position: 0,
          }] : [],
          caption: diet.descricao || "",
          location: null,
          hashtags: [],
          mentions: [],
          like_count: 0, // Vamos precisar implementar contadores de like para dietas
          comment_count: 0,
          share_count: 0,
          save_count: 0,
          is_liked: false,
          is_saved: false,
          likes_hidden: false,
          comments_off: false,
          is_pinned: false,
          is_archived: false,
          created_at: new Date().toISOString(), // Vamos precisar de uma data real
          time_ago: "Agora",
        }));

        setDiets((prev) => (reset ? mappedDiets : [...prev, ...mappedDiets]));
        setCursor(response.data.next_cursor);
        setHasMore(response.data.has_more);
      } catch (error) {
        console.error("Erro ao carregar dietas dos seguidos:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id, following, cursor]
  );

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadDiets(false);
    }
  }, [isLoading, hasMore, loadDiets]);

  const refresh = useCallback(async () => {
    await loadDiets(true);
  }, [loadDiets]);

  useEffect(() => {
    if (user?.id) {
      loadFollowing().then(() => {
        loadDiets(true);
      });
    }
  }, [user?.id, loadFollowing, loadDiets]);

  return {
    diets,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  };
};