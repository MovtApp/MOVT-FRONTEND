import { api } from "./api";

export interface SearchResult {
    id: string | number;
    title: string;
    subtitle?: string;
    type: 'trainer' | 'gym' | 'training' | 'diet' | 'community' | 'user';
    target: string;
    image?: string;
    data?: any; // Raw data for navigation
}

export const searchService = {
    globalSearch: async (query: string, sessionId: string): Promise<SearchResult[]> => {
        try {
            const response = await api.get("/search", {
                params: { q: query },
                headers: { Authorization: `Bearer ${sessionId}` },
            });

            // The backend returns an array of results in response.data.data
            return response.data.data;
        } catch (error) {
            console.error("Erro na busca global:", error);
            return [];
        }
    }
};
