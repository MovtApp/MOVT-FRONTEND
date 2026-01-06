import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "http://10.0.2.2:3000"; // Certifique-se de que é o mesmo do signinScreen.tsx e App.tsx

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  isVerified: boolean; // Adicionado o status de verificação do e-mail
  sessionId?: string; // Adicionado o sessionId
  supabaseUserId?: string | null; // Adicionado o UUID do Supabase
  photo?: string | null; // Adicionado para o avatar do usuário
  documentId?: string | null;
  documentType?: "CPF" | "CNPJ" | null;
}

interface AuthContextData {
  user: User | null;
  signIn: (sessionId: string, userDetails: Omit<User, "sessionId">) => Promise<void>; // Assinatura atualizada
  signOut: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
  loading: boolean; // Indica se está carregando dados de autenticação
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // State to track loading

  useEffect(() => {
    async function loadUserData() {
      try {
        const storedSessionId = await AsyncStorage.getItem("userSessionId");
        const storedUserDetails = await AsyncStorage.getItem("@Auth:user"); // Carrega os detalhes do usuário armazenados

        if (storedSessionId && storedUserDetails) {
          const parsedUserDetails = JSON.parse(storedUserDetails);
          // Define o usuário imediatamente com os dados armazenados para redirecionamento instantâneo
          setUser({ ...parsedUserDetails, sessionId: storedSessionId });
          setLoading(false); // Para o loading imediatamente após definir o usuário

          // Em seguida, valida a sessão em segundo plano
          try {
            const response = await axios.get(`${API_BASE_URL}/user/session-status`, {
              headers: {
                Authorization: `Bearer ${storedSessionId}`,
              },
            });

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
              // Sessão inválida ou erro, limpa os dados armazenados
              await AsyncStorage.removeItem("userSessionId");
              await AsyncStorage.removeItem("@Auth:user");
              setUser(null);
            }
          } catch {
            // Erro de API não é usado, removemos a variável
            await AsyncStorage.removeItem("userSessionId");
            await AsyncStorage.removeItem("@Auth:user");
            setUser(null);
          }
        } else {
          // Sem sessionId armazenado
          setUser(null);
          setLoading(false);
        }
      } catch {
        // Erro de carregamento de dados não é usado, removemos a variável
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
