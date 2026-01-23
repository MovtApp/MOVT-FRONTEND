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
