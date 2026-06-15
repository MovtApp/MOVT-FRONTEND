import { API_BASE_URL } from "../config/api";

interface FollowResponse {
  success: boolean;
  following?: boolean;
  isFollowing?: boolean;
  status?: "pending" | "accepted" | null;
  message?: string;
  followedCount?: number;
  unfollowedCount?: number;
  error?: string;
}

/**
 * Segue / solicita seguir um usuário genérico (não-trainer). O backend trata
 * como toggle e cria a relação com status "pending" (solicitação de amizade);
 * o destinatário aceita pela aba de solicitações.
 * @param userId - id_us do usuário a seguir
 * @param sessionToken - Token de autenticação
 */
export async function followUser(
  userId: string | number,
  sessionToken: string
): Promise<FollowResponse> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL não configurada. Verifique src/config/api.ts");
  }
  if (!userId) throw new Error("userId é obrigatório");
  if (!sessionToken) throw new Error("sessionToken é obrigatório");

  const response = await fetch(`${API_BASE_URL}/user/${userId}/follow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData?.error || `Erro HTTP ${response.status}`);
  }
  return responseData;
}

/**
 * Segue um único trainer
 * @param trainerId - ID do trainer a seguir
 * @param sessionToken - Token de autenticação
 */
export async function followTrainer(
  trainerId: string | number,
  sessionToken: string
): Promise<FollowResponse> {
  try {
    console.log("[followTrainer] Iniciando com:", { trainerId, tokenLength: sessionToken?.length });

    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL não configurada. Verifique src/config/api.ts");
    }

    if (!trainerId) {
      throw new Error("trainerId é obrigatório");
    }

    if (!sessionToken) {
      throw new Error("sessionToken é obrigatório");
    }

    const url = `${API_BASE_URL}/trainers/${trainerId}/follow`;
    console.log("[followTrainer] URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    console.log("[followTrainer] Status:", response.status);

    const responseData = await response.json();
    console.log("[followTrainer] Resposta:", responseData);

    if (!response.ok) {
      const errorMessage = responseData?.error || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("[followTrainer] Erro:", error);
    throw error;
  }
}

/**
 * Para de seguir um único trainer
 * @param trainerId - ID do trainer a deixar de seguir
 * @param sessionToken - Token de autenticação
 */
export async function unfollowTrainer(
  trainerId: string | number,
  sessionToken: string
): Promise<FollowResponse> {
  try {
    console.log("[unfollowTrainer] Iniciando com:", {
      trainerId,
      tokenLength: sessionToken?.length,
    });

    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL não configurada. Verifique src/config/api.ts");
    }

    if (!trainerId) {
      throw new Error("trainerId é obrigatório");
    }

    if (!sessionToken) {
      throw new Error("sessionToken é obrigatório");
    }

    const url = `${API_BASE_URL}/trainers/${trainerId}/follow`;
    console.log("[unfollowTrainer] URL:", url);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    console.log("[unfollowTrainer] Status:", response.status);

    const responseData = await response.json();
    console.log("[unfollowTrainer] Resposta:", responseData);

    if (!response.ok) {
      const errorMessage = responseData?.error || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("[unfollowTrainer] Erro:", error);
    throw error;
  }
}

/**
 * Segue múltiplos trainers de uma vez
 * @param trainerIds - Array de IDs de trainers a seguir
 * @param sessionToken - Token de autenticação
 */
export async function followMultipleTrainers(
  trainerIds: (string | number)[],
  sessionToken: string
): Promise<FollowResponse> {
  try {
    if (!Array.isArray(trainerIds) || trainerIds.length === 0) {
      throw new Error("trainerIds deve ser um array não vazio");
    }

    if (trainerIds.length > 100) {
      throw new Error("Máximo de 100 trainers por vez");
    }

    const response = await fetch(`${API_BASE_URL}/trainers/follow-multiple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        trainerIds: trainerIds.map((id) => parseInt(String(id), 10)),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao seguir múltiplos trainers");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em followMultipleTrainers:", error);
    throw error;
  }
}

/**
 * Para de seguir múltiplos trainers de uma vez
 * @param trainerIds - Array de IDs de trainers a deixar de seguir
 * @param sessionToken - Token de autenticação
 */
export async function unfollowMultipleTrainers(
  trainerIds: (string | number)[],
  sessionToken: string
): Promise<FollowResponse> {
  try {
    if (!Array.isArray(trainerIds) || trainerIds.length === 0) {
      throw new Error("trainerIds deve ser um array não vazio");
    }

    if (trainerIds.length > 100) {
      throw new Error("Máximo de 100 trainers por vez");
    }

    const response = await fetch(`${API_BASE_URL}/trainers/unfollow-multiple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        trainerIds: trainerIds.map((id) => parseInt(String(id), 10)),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao deixar de seguir múltiplos trainers");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro em unfollowMultipleTrainers:", error);
    throw error;
  }
}
