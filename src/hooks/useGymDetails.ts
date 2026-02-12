import { useState, useEffect } from "react";
import { api } from "@services/api";

export interface GymDetails {
  id_academia: number;
  nome: string;
  rating: number;
  total_avaliacoes: number;
  endereco_completo: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  whatsapp?: string;
  website?: string;
  ativo: boolean;
  horarios_funcionamento?: {
    [key: string]: {
      abre: string;
      fecha: string;
    }[];
  };
  fotos?: {
    reference: string;
    url: string;
    width: number;
    height: number;
  }[];
  google_maps_url?: string;
  source?: "cache" | "google_places_api" | "database";
  cached_at?: string;
  fetched_at?: string;
  open_now?: boolean;
}

export function useGymDetails(gymId: number | null, shouldFetch: boolean = false) {
  const [gymDetails, setGymDetails] = useState<GymDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId || !shouldFetch) {
      setGymDetails(null);
      return;
    }

    const fetchGymDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/academias/${gymId}/details`);
        setGymDetails(response.data);
      } catch (err: any) {
        console.error("Error fetching gym details:", err);
        setError(err.response?.data?.error || "Erro ao carregar detalhes da academia");
      } finally {
        setLoading(false);
      }
    };

    fetchGymDetails();
  }, [gymId, shouldFetch]);

  const refresh = async () => {
    if (!gymId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/academias/${gymId}/details?forceRefresh=true`);
      setGymDetails(response.data);
    } catch (err: any) {
      console.error("Error refreshing gym details:", err);
      setError(err.response?.data?.error || "Erro ao atualizar detalhes da academia");
    } finally {
      setLoading(false);
    }
  };

  return { gymDetails, loading, error, refresh };
}
