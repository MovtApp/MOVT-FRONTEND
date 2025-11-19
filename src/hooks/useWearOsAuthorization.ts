import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  requestWearOsAuthorization,
  checkWearOsPermissions,
  WearOsAuthorizationResult,
} from "../services/wearOsPermissions";

/**
 * Hook customizado para gerenciar autorização do Wear OS
 * Trata automaticamente a solicitação de permissões na primeira vez
 */
export const useWearOsAuthorization = () => {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authorizationResult, setAuthorizationResult] = useState<WearOsAuthorizationResult | null>(
    null
  );

  // Verificar permissões ao iniciar
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const hasPermissions = await checkWearOsPermissions();
        setIsAuthorized(hasPermissions);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user?.id]);

  // Função para solicitar autorização
  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError("Usuário não encontrado");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestWearOsAuthorization(user.id, (message) => {
        console.log("Progresso:", message);
      });

      setAuthorizationResult(result);

      if (result.success) {
        setIsAuthorized(true);
        return true;
      } else {
        setError(result.message);
        setIsAuthorized(false);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setIsAuthorized(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    isAuthorized,
    isLoading,
    error,
    authorizationResult,
    requestAuthorization,
  };
};
