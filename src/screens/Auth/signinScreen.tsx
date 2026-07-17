import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import BackButton from "@/components/BackButton";
import SocialButton from "@/components/SocialButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes"; // Corrigida importação de RootStackParamList
import CustomInput from "@/components/CustomInput";
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@contexts/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { api } from "../../services/api";
import { API_CONFIG } from "../../config/api";
import { PHONE_VERIFICATION_ENABLED } from "../../config/featureFlags";
import { useGoogleOAuth } from "../../hooks/useGoogleOAuth";

// Variáveis de ambiente (usa EXPO_PUBLIC_* e faz fallback)
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const SignInScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();
  const { startGoogleOAuth } = useGoogleOAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSignup() {
    navigation.navigate("Auth", { screen: "SignUpScreen" });
  }

  function handleRecovery() {
    navigation.navigate("Verify", { screen: "RecoveryScreen" });
  }

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/login", {
        email,
        senha: password,
      });

      Alert.alert("Login efetuado", response.data.message);

      const documentId =
        response.data.user?.cpf_cnpj ||
        response.data.user?.documento ||
        response.data.user?.documentId ||
        null;

      const resolvedDocumentType = (() => {
        const typeFromApi: string | undefined =
          response.data.user?.tipo_documento || response.data.user?.documentType;
        if (typeFromApi) {
          const normalized = typeFromApi.toUpperCase();
          if (normalized === "CPF" || normalized === "CNPJ") {
            return normalized;
          }
        }

        if (documentId) {
          const digits = documentId.replace(/\D/g, "");
          if (digits.length > 11) return "CNPJ";
          if (digits.length === 11) return "CPF";
        }

        return null;
      })();

      // Persiste sessão no contexto/AsyncStorage
      await signIn(response.data.sessionId, {
        id: response.data.user.id,
        id_us: response.data.user.id,
        name: response.data.user.nome,
        email: response.data.user.email,
        username: response.data.user.username,
        isVerified: response.data.user.isVerified,
        supabaseUserId: response.data.user.supabase_uid,
        role: response.data.user.role,
        documentId,
        documentType: resolvedDocumentType,
        cref_verified: response.data.user.cref_verified,
        cnpj_verified: response.data.user.cnpj_verified,
        status_verificacao: response.data.user.status_verificacao,
        cref_submitted: response.data.user.cref_submitted,
        cref_rejeicao_motivo: response.data.user.cref_rejeicao_motivo,
        phone_verified: response.data.user.phone_verified,
        onboarding_completed: response.data.user.onboarding_completed,
      });

      // Personal trainer (conta CNPJ) só acessa o app após validar o CREF.
      // Admin é isento: nunca passa pela validação de CNPJ/CREF.
      const isAdmin =
        typeof response.data.user.role === "string" &&
        response.data.user.role.toLowerCase().includes("admin");
      const isTrainer =
        resolvedDocumentType === "CNPJ" ||
        response.data.user.role === "trainer" ||
        response.data.user.role === "personal";
      const needsProfessionalVerification =
        !isAdmin && isTrainer && !response.data.user.cref_verified;
      // Telefone é etapa universal; contas antigas vêm com phone_verified=true.
      // Desativada temporariamente via PHONE_VERIFICATION_ENABLED (ver featureFlags).
      const needsPhoneVerification =
        PHONE_VERIFICATION_ENABLED && !isAdmin && response.data.user.phone_verified === false;
      // Dados pessoais (onboarding) é o último gate; contas antigas vêm com true.
      const needsOnboarding = !isAdmin && response.data.user.onboarding_completed === false;

      // Redireciona imediatamente sem depender do initialRouteName
      if (!response.data.user.isVerified) {
        // E-mail ainda não confirmado → verificação de conta (código por e-mail)
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Verify" as never,
              params: {
                screen: "VerifyAccountScreen",
                params: { sessionId: response.data.sessionId },
              } as never,
            },
          ],
        });
      } else if (needsPhoneVerification) {
        // E-mail ok, mas falta validar o telefone → SMS
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Verify" as never,
              params: { screen: "VerifyPhoneScreen" } as never,
            },
          ],
        });
      } else if (needsProfessionalVerification) {
        // E-mail ok, mas falta validar o CREF → fluxo profissional (etapa de
        // empresa desativada; vai direto para o CREF).
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Verify" as never,
              params: { screen: "VerifyCrefScreen" } as never,
            },
          ],
        });
      } else if (needsOnboarding) {
        // Tudo verificado, mas falta preencher os dados pessoais → onboarding Info
        navigation.reset({
          index: 0,
          routes: [{ name: "Info" as never }],
        });
      } else {
        // Vai para a Home dentro do Drawer
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "App" as never,
              params: { screen: "HomeStack" } as never,
            },
          ],
        });
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error
        ? err.response.data.error
        : "Ocorreu um erro ao fazer login.";
      setError(errorMessage);
      Alert.alert("Erro no Login", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Fluxo OAuth (PKCE) centralizado no hook compartilhado.
      const result = await startGoogleOAuth();

      if (result.status === "cancel") {
        // Usuário fechou o navegador — silencioso, sem alerta de erro.
        return;
      }

      const { access_token, supabaseUser } = result;

      try {
        // Login social CANÔNICO: NUNCA cria conta. Se o e-mail não tiver conta
        // MOVT, o backend responde 404 SOCIAL_NOT_LINKED e mandamos criar conta.
        const loginResponse = await api.post("/auth/social-login", {
          email: supabaseUser.email,
          supabase_uid: supabaseUser.id,
          photo: supabaseUser.user_metadata?.avatar_url,
          access_token,
        });

        const backendData = loginResponse.data;

        // Só navegamos DEPOIS de confirmar a sessão MOVT. Sem fallback local:
        // nada de app aberto atrás do alerta.
        await signIn(backendData.sessionId, {
          id: backendData.user.id_us || backendData.user.id,
          id_us: backendData.user.id_us || backendData.user.id,
          name: backendData.user.nome,
          email: backendData.user.email,
          username: backendData.user.username,
          isVerified: backendData.user.isVerified ?? true,
          role: backendData.user.role,
          supabaseUserId: supabaseUser.id,
          photo: supabaseUser.user_metadata?.avatar_url || null,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: "App" as never }],
        });
      } catch (loginError: any) {
        const status = loginError?.response?.status;
        const data = loginError?.response?.data;

        // Encerra a sessão Supabase para NÃO ficar meio-logado (era isso que
        // deixava o app abrir atrás do alerta de "conta inativa/excluída").
        await supabase.auth.signOut().catch(() => {});

        if (status === 404 && data?.error === "SOCIAL_NOT_LINKED") {
          Alert.alert(
            "Conta não encontrada",
            data?.message ||
              "Não encontramos uma conta MOVT com este e-mail. Crie sua conta e depois conecte o Google nas configurações.",
            [
              { text: "Agora não", style: "cancel" },
              {
                text: "Criar conta",
                onPress: () =>
                  navigation.navigate("Auth", { screen: "SignUpScreen" }),
              },
            ]
          );
          return;
        }

        const msg =
          data?.message || data?.error || "Não foi possível entrar com o Google.";
        Alert.alert("Erro de Login", msg);
      }
    } catch (error: any) {
      // Erro do próprio fluxo OAuth (troca de code, navegador, etc.).
      console.error("Erro detalhado no login Google:", error);
      await supabase.auth.signOut().catch(() => {});
      Alert.alert("Erro", "Falha ao autenticar com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton autoTopInset={true} />
      <Text style={styles.title}>Entre na sua conta</Text>
      <Text style={styles.subtitle}>Digite seu e-mail e senha para fazer login</Text>
      <View style={{ marginTop: 30 }}>
        <Text style={styles.subtitle}>E-mail</Text>
        <CustomInput
          value={email}
          onChangeText={setEmail}
          placeholder="Digite aqui seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.subtitle}>Password</Text>
        <CustomInput
          value={password}
          onChangeText={setPassword}
          placeholder="Digite aqui sua senha"
          secureTextEntry={!showPassword}
          rightIcon={
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={{ marginRight: 22 }}
            >
              {showPassword ? <EyeOff size={24} color="#888" /> : <Eye size={24} color="#888" />}
            </TouchableOpacity>
          }
        />
        <TouchableOpacity
          style={{ alignSelf: "flex-start", marginBottom: 30 }}
          onPress={handleRecovery}
        >
          <Text style={styles.forgot}>Esqueceu sua senha ?</Text>
        </TouchableOpacity>

        {/* Exibe o erro se houver */}
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.loginButtonText}>{loading ? "Entrando..." : "Log In"}</Text>
        </TouchableOpacity>
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Ou</Text>
          <View style={styles.separatorLine} />
        </View>
        <View>
          <SocialButton type="google" text="Continue com Google" onPress={signInWithGoogle} />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <Text style={styles.noAccount}>Não tem uma conta?</Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={styles.signUp}> Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 0 : 30, // Inset agora é controlado individualmente ou via SafeArea
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 32,
    marginTop: 30,
    marginBottom: 4,
    color: "#111",
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  error: {
    color: "red",
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
    textAlign: "center",
  },
  forgot: {
    color: "#BBF246",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 18,
  },
  loginButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#888",
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
  },
  noAccount: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#888",
  },
  signUp: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    color: "#BBF246",
  },
});
