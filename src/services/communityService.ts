import { api } from "./api";

export async function listCommunities(sessionId: string, category?: string) {
  try {
    let url = "/comunidades";
    if (category && category !== "Todas") {
      url += `?categoria=${encodeURIComponent(category)}`;
    }

    const response = await api.get(url, {
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getCommunityDetails(id: string, sessionId: string) {
  try {
    const response = await api.get(`/comunidades/${id}`, {
      headers: { Authorization: `Bearer ${sessionId}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function joinCommunity(id: string, sessionId: string) {
  try {
    const response = await api.post(
      `/comunidades/${id}/entrar`,
      {},
      {
        headers: { Authorization: `Bearer ${sessionId}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

