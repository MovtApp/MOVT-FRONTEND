import { api } from "./api";

export async function listCommunities(sessionId: string) {
  try {
    const response = await api.get("/comunidades", {
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
