import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { secureGet, secureSet, secureRemove } from "../services/secureStore";
import { DeviceEventEmitter, Alert } from "react-native";
import { api, resetForceLogoutGuard } from "../services/api";

// Mensagem exibida quando a sessão deixa de ser válida. A mensagem "neutra"
// cobre tanto conta removida quanto sessão encerrada, já que o backend ainda
// não distingue os dois casos (ver docs/account-deleted-backend.md).
function resolveLogoutAlert(data?: { reason?: string; message?: string }): {
  title: string;
  message: string;
} {
  switch (data?.reason) {
    case "deleted":
      return {
        title: "Conta removida",
        message:
          data.message ||
          "Sua conta foi removida. Faça login novamente ou entre em contato com o suporte.",
      };
    case "inactive":
      return {
        title: "Conta inativa",
        message:
          data.message ||
          "Sua conta foi desativada pelo administrador. Entre em contato com o suporte.",
      };
    default:
      return {
        title: "Sessão encerrada",
        message:
          "Sua conta não está mais disponível. Ela pode ter sido removida ou sua sessão encerrada. Faça login novamente.",
      };
  }
}

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
  status_verificacao?: string; // "pendente" | "aprovado" | "reprovado" | ...
  cref_submitted?: boolean; // já enviou os documentos do CREF (document_url != null)
  cref_rejeicao_motivo?: string | null; // motivo da reprovação manual, exibido na tela de status
  phone_verified?: boolean; // telefone validado por SMS (Twilio Verify)
  onboarding_completed?: boolean; // já preencheu os dados pessoais (Info: altura/peso/etc.)
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
    resetForceLogoutGuard(); // Permite novo alerta caso o próximo login volte a falhar
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
          cref_submitted: updatedUser.cref_submitted,
          cref_rejeicao_motivo: updatedUser.cref_rejeicao_motivo,
          phone_verified: updatedUser.phone_verified,
          onboarding_completed: updatedUser.onboarding_completed,
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
                  cref_submitted: refreshedUser.cref_submitted,
                  cref_rejeicao_motivo: refreshedUser.cref_rejeicao_motivo,
                  phone_verified: refreshedUser.phone_verified,
                  onboarding_completed: refreshedUser.onboarding_completed,
                })
              );
            } else {
              // Backend respondeu, mas sem usuário válido: conta não existe mais.
              await signOut();
              DeviceEventEmitter.emit("force_logout_inactive", {
                reason: "account_unavailable",
              });
            }
          } catch (validationError: any) {
            const status = validationError?.response?.status;
            // Erro de auth (401/403/404): conta removida ou sessão inválida →
            // logout com alerta explicando o motivo. Sem resposta (falha de
            // rede/timeout): mantém o usuário em cache, sem alarme falso.
            if (status === 401 || status === 403 || status === 404) {
              await signOut();
              DeviceEventEmitter.emit("force_logout_inactive", {
                reason: "account_unavailable",
              });
            } else if (__DEV__) {
              console.log(
                "[AuthContext] session-status indisponível (rede); mantendo sessão em cache."
              );
            }
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
    // Garante um único Alert por ciclo de logout, mesmo que o interceptor (api.ts)
    // e o loadUserData emitam o evento quase ao mesmo tempo.
    let alertVisible = false;

    const subscription = DeviceEventEmitter.addListener("force_logout_inactive", (data) => {
      signOut();

      if (alertVisible) return;
      alertVisible = true;

      const { title, message } = resolveLogoutAlert(data);
      Alert.alert(title, message, [
        { text: "OK", onPress: () => { alertVisible = false; } },
      ]);
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
