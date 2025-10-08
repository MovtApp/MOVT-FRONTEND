import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth_login } from "../services/services";
import axios from "axios";

const API_BASE_URL = 'http://10.0.2.2:3000'; // Certifique-se de que é o mesmo do signinScreen.tsx e App.tsx

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  isVerified: boolean; // Adicionado o status de verificação do e-mail
  sessionId: string; // Adicionado o sessionId
}

interface AuthContextData {
  user: User | null;
  signIn: (sessionId: string, userDetails: Omit<User, 'sessionId'>) => Promise<void>; // Assinatura atualizada
  signOut: () => Promise<void>;
  loading: boolean; // Indica se está carregando dados de autenticação
}

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // State to track loading

  useEffect(() => {
    async function loadUserData() {
      try {
        const storedSessionId = await AsyncStorage.getItem('userSessionId');

        if (storedSessionId) {
          // Tenta validar a sessão com o backend
          const response = await axios.get(`${API_BASE_URL}/user/session-status`, {
            headers: {
              Authorization: `Bearer ${storedSessionId}`,
            },
          });

          if (response.status === 200 && response.data.user) {
            const userData = response.data.user;
            setUser({
              id: userData.id,
              name: userData.nome, // Assumindo que o backend retorna 'nome' para o nome
              email: userData.email,
              username: userData.username,
              isVerified: userData.isVerified,
              sessionId: storedSessionId, // Adiciona o sessionId ao objeto user
            });
          } else {
            // Sessão inválida ou erro, limpa o AsyncStorage
            await AsyncStorage.removeItem('userSessionId');
            setUser(null);
          }
        } else {
          // Sem sessionId armazenado
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        await AsyncStorage.removeItem('userSessionId'); // Em caso de erro, remove a sessão inválida
        setUser(null);
      } finally {
        setLoading(false); // Sempre parar o loading
      }
    }

    loadUserData();
  }, []);

  async function signIn(sessionId: string, userDetails: Omit<User, 'sessionId'>) {
    try {
      // Salva o sessionId e os detalhes do usuário no AsyncStorage
      await AsyncStorage.setItem('userSessionId', sessionId);
      await AsyncStorage.setItem('@Auth:user', JSON.stringify(userDetails));

      setUser({ ...userDetails, sessionId });
    } catch (error) {
      console.error("Error during signIn:", error);
      throw new Error("Failed to sign in");
    }
  }

  async function signOut() {
    setUser(null);
    await AsyncStorage.removeItem('userSessionId'); // Remove o sessionId
    await AsyncStorage.removeItem("@Auth:user"); // Remove os dados do usuário
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto de autenticação
export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
