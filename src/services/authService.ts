import { api } from "./api";

export const authService = {
    requestRecovery: async (email: string) => {
        const response = await api.post("/auth/recovery/request", { email });
        return response.data;
    },

    verifyRecoveryCode: async (email: string, code: string) => {
        const response = await api.post("/auth/recovery/verify", { email, code });
        return response.data;
    },

    resetPassword: async (email: string, code: string, newPassword: string) => {
        const response = await api.post("/auth/recovery/reset", { email, code, newPassword });
        return response.data;
    },
};
