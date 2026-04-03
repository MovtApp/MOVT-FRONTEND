import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { followTrainer, unfollowTrainer } from "../services/followService";

interface UseFollowReturn {
  isFollowing: boolean;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  isLoading: boolean;
}

export const useFollow = (trainerId: string | number): UseFollowReturn => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Consideramos que o token está disponível no user.token ou similar
  const sessionToken = (user as any)?.token || "";

  const follow = useCallback(async () => {
    if (!sessionToken || !trainerId) return;

    setIsLoading(true);
    try {
      await followTrainer(trainerId, sessionToken);
      setIsFollowing(true);
    } catch (error) {
      console.error("Erro ao seguir trainer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, trainerId]);

  const unfollow = useCallback(async () => {
    if (!sessionToken || !trainerId) return;

    setIsLoading(true);
    try {
      await unfollowTrainer(trainerId, sessionToken);
      setIsFollowing(false);
    } catch (error) {
      console.error("Erro ao deixar de seguir trainer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, trainerId]);

  useEffect(() => {
    // Check if user is following this trainer (mocked or fetched)
    // setIsFollowing(checkStatus(trainerId));
  }, [trainerId]);

  return {
    isFollowing,
    follow,
    unfollow,
    isLoading,
  };
};
