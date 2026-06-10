import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { secureGet, secureSet, secureRemove } from "../services/secureStore";
import { DeviceEventEmitter, Alert } from "react-native";
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
  avatar_url?: string | null; // Adicionado para compatibilidade
  image?: string | null; // Adicionado para compatibilidade
  banner?: string | null;
  documentId?: string | null;
  documentType?: "CPF" | "CNPJ" | null;
  isPendingSync?: boolean; // Flag para evitar chamadas de API antes da sincronização final
  role?: string;
  plan?: string; // Plano real do backend: "free" | "premium" | "familia"
  plan_expires_at?: string | null;
  // Verificação profissional (personal trainer / CNPJ)
  cref_verified?: boolean;
  cnpj_verified?: boolean;
  status_verificacao?: string; // "pendente" | "aprovado" | ...
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

  // Funções estáveis (useCallback) declaradas antes dos effects para que possam
  // ser referenciadas com segurança nas dependências dos useEffect/useMemo.
  const signIn = useCallback(async (sessionId: string, userDetails: Omit<User, "sessionId">) => {
    try {
      console.log(
        "🔑 [AuthContext] Iniciando signIn para:",
        userDetails.email,
        "UID:",
        userDetails.supabaseUserId
      );
      // Salva o sessionId e os detalhes do usuário no AsyncStorage
      await secureSet("userSessionId", sessionId);
      await secureSet("@Auth:user", JSON.stringify(userDetails));

      setUser({ ...userDetails, sessionId });
    } catch {
      // Erro de sign-in não é usado, removemos a variável
      throw new Error("Failed to sign in");
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await secureRemove("userSessionId"); // Remove o sessionId
    await secureRemove("@Auth:user"); // Remove os dados do usuário
  }, []);

  const updateUser = useCallback(
    async (newUserData: Partial<User>) => {
      if (!user) return;

      const updatedUser = { ...user, ...newUserData };
      setUser(updatedUser);

      // Atualiza os dados no AsyncStorage
      await secureSet(
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
          role: updatedUser.role,
          cref_verified: updatedUser.cref_verified,
          cnpj_verified: updatedUser.cnpj_verified,
          status_verificacao: updatedUser.status_verificacao,
        })
      );
    },
    [user]
  );

  useEffect(() => {
    async function loadUserData() {
      try {
        const storedSessionId = await secureGet("userSessionId");
        const storedUserDetails = await secureGet("@Auth:user");

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
                photo:
                  response.data.user.avatar_url ||
                  response.data.user.photo ||
                  parsedUserDetails.photo,
                supabaseUserId: response.data.user.supabase_uid || parsedUserDetails.supabaseUserId,
                sessionId: storedSessionId,
              };

              console.log("👤 [AuthContext] Usuário atualizado do Backend:", {
                id: refreshedUser.id,
                email: refreshedUser.email,
                role: refreshedUser.role,
                supabase_uid: refreshedUser.supabaseUserId,
              });

              setUser(refreshedUser);

              await secureSet(
                "@Auth:user",
                JSON.stringify({
                  id: refreshedUser.id,
                  name: refreshedUser.name,
                  email: refreshedUser.email,
                  username: refreshedUser.username,
                  isVerified: refreshedUser.isVerified,
                  photo: refreshedUser.photo,
                  supabaseUserId: refreshedUser.supabaseUserId,
                  role: refreshedUser.role,
                  documentType: refreshedUser.documentType,
                  cref_verified: refreshedUser.cref_verified,
                  cnpj_verified: refreshedUser.cnpj_verified,
                  status_verificacao: refreshedUser.status_verificacao,
                })
              );
            } else {
              await secureRemove("userSessionId");
              await secureRemove("@Auth:user");
              setUser(null);
            }
          } catch {
            await secureRemove("userSessionId");
            await secureRemove("@Auth:user");
            setUser(null);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch {
        await secureRemove("userSessionId");
        await secureRemove("@Auth:user");
        setUser(null);
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("force_logout_inactive", (data) => {
      signOut();
      Alert.alert(
        "Conta Inativa",
        data?.message ||
          "Sua conta foi desativada pelo administrador. Entre em contato com o suporte."
      );
    });

    return () => {
      subscription.remove();
    };
  }, [signOut]);

  const value = useMemo(
    () => ({ user, signIn, signOut, updateUser, loading }),
    [user, signIn, signOut, updateUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook customizado para usar o contexto de autenticação
export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
