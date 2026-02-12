import { api } from "./api";

export interface Gym {
  id_academia: number;
  nome: string;
  rating: number;
  total_avaliacoes: number;
  endereco_completo: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  whatsapp?: string;
  ativo: boolean;
  distancia_km?: number;
  // Google Places API fields
  website?: string;
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
  google_place_id?: string;
  google_maps_url?: string;
  source?: "cache" | "google_places_api" | "database";
  cached_at?: string;
  fetched_at?: string;
  open_now?: boolean;
}

export async function listGyms(sessionId: string) {
  try {
    const response = await api.get("/academias", {
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getGymDetails(id: string, sessionId: string) {
  try {
    const response = await api.get(`/academias/${id}`, {
      headers: { Authorization: `Bearer ${sessionId}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getNearbyGyms(
  latitude: number,
  longitude: number,
  radius: number,
  sessionId: string
) {
  try {
    const response = await api.get("/academias/nearby", {
      params: {
        lat: latitude,
        lng: longitude,
        raio: radius,
      },
      headers: { Authorization: `Bearer ${sessionId}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
