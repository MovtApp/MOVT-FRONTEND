import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

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

interface UseFeedReturn {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFeed = (userId: string | undefined): UseFeedReturn => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadPosts = useCallback(
    async (reset = false) => {
      if (!userId) return;

      if (reset) {
        setPosts([]);
        setCursor(null);
        setHasMore(true);
      }

      setIsLoading(true);
      try {
        const response = await api.get("/feed", {
          params: {
            cursor: cursor,
            limit: 10,
          },
        });

        const newPosts = response.data.posts;
        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        setCursor(response.data.next_cursor);
        setHasMore(response.data.has_more);
      } catch (error) {
        console.error("Erro ao carregar feed:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, cursor]
  );

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadPosts(false);
    }
  }, [isLoading, hasMore, loadPosts]);

  const refresh = useCallback(async () => {
    await loadPosts(true);
  }, [loadPosts]);

  useEffect(() => {
    if (userId) {
      loadPosts(true);
    }
  }, [userId, loadPosts]);

  return {
    posts,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  };
};
