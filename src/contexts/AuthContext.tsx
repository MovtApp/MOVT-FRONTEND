import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

interface User {
  id: string;
  id_us?: string | number; // Adicionado para compatibilidade com o backend
  name: string;
  email: string;
  username: string;
  isVerified: boolean;
  sessionId?: string;
  supabaseUserId?: string | null;
  photo?: string | null;
  banner?: string | null;
  documentId?: string | null;
  documentType?: "CPF" | "CNPJ" | null;
}

interface AuthContextData {
  user: User | null;
  signIn: (sessionId: string, userDetails: Omit<User, "sessionId">) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const storedSessionId = await AsyncStorage.getItem("userSessionId");
        const storedUserDetails = await AsyncStorage.getItem("@Auth:user");

        if (storedSessionId && storedUserDetails) {
          const parsedUserDetails = JSON.parse(storedUserDetails);
          setUser({ ...parsedUserDetails, sessionId: storedSessionId });
          setLoading(false);

          try {
            const response = await api.get("/user/session-status");

            if (response.status === 200 && response.data.user) {
              const refreshedUser = {
                ...parsedUserDetails,
                ...response.data.user,
                supabaseUserId: response.data.user.supabase_uid || parsedUserDetails.supabaseUserId,
                sessionId: storedSessionId,
              };

              setUser(refreshedUser);

              await AsyncStorage.setItem(
                "@Auth:user",
                JSON.stringify({
                  id: refreshedUser.id,
                  name: refreshedUser.name,
                  email: refreshedUser.email,
                  username: refreshedUser.username,
                  isVerified: refreshedUser.isVerified,
                  photo: refreshedUser.photo,
                  supabaseUserId: refreshedUser.supabaseUserId,
                })
              );
            } else {
              await AsyncStorage.removeItem("userSessionId");
              await AsyncStorage.removeItem("@Auth:user");
              setUser(null);
            }
          } catch {
            await AsyncStorage.removeItem("userSessionId");
            await AsyncStorage.removeItem("@Auth:user");
            setUser(null);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch {
        await AsyncStorage.removeItem("userSessionId");
        await AsyncStorage.removeItem("@Auth:user");
        setUser(null);
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  async function signIn(sessionId: string, userDetails: Omit<User, "sessionId">) {
    try {
      // Salva o sessionId e os detalhes do usuário no AsyncStorage
      await AsyncStorage.setItem("userSessionId", sessionId);
      await AsyncStorage.setItem("@Auth:user", JSON.stringify(userDetails));

      setUser({ ...userDetails, sessionId });
    } catch {
      // Erro de sign-in não é usado, removemos a variável
      throw new Error("Failed to sign in");
    }
  }

  async function signOut() {
    setUser(null);
    await AsyncStorage.removeItem("userSessionId"); // Remove o sessionId
    await AsyncStorage.removeItem("@Auth:user"); // Remove os dados do usuário
  }

  async function updateUser(newUserData: Partial<User>) {
    if (!user) return;

    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);

    // Atualiza os dados no AsyncStorage
    await AsyncStorage.setItem(
      "@Auth:user",
      JSON.stringify({
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        isVerified: updatedUser.isVerified,
        photo: updatedUser.photo,
        banner: updatedUser.banner,
        id: updatedUser.id,
        supabaseUserId: updatedUser.supabaseUserId,
        documentId: updatedUser.documentId,
        documentType: updatedUser.documentType,
      })
    );
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto de autenticação
export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
