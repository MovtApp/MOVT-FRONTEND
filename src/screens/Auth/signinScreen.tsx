import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import BackButton from "@/components/BackButton";
import SocialButton from "@/components/SocialButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes"; // Corrigida importação de RootStackParamList
import CustomInput from "@/components/CustomInput";
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@contexts/AuthContext";
import { supabase } from "../../services/supabaseClient";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
// import { LoginManager, AccessToken } from 'react-native-fbsdk-next'; // Para Facebook (Removido)

import { api } from "../../services/api";

// URL da sua Edge Function que receberá os tokens dos provedores
const SOCIAL_SIGN_IN_EDGE_FUNCTION_URL = `${
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://ypnpdjgsyzdwsmnxsoqj.supabase.co"
}/functions/v1/auth/social-sign-in`;

// Variáveis de ambiente (usa EXPO_PUBLIC_* e faz fallback)
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID;

export const SignInScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();

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
        name: response.data.user.nome,
        email: response.data.user.email,
        username: response.data.user.username,
        isVerified: response.data.user.isVerified,
        supabaseUserId: response.data.user.supabase_uid,
        documentId,
        documentType: resolvedDocumentType,
      });

      // Redireciona imediatamente sem depender do initialRouteName
      if (response.data.user.isVerified) {
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
      } else {
        // Envia para verificação de conta
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

  WebBrowser.maybeCompleteAuthSession();

  // No Expo Go, precisamos usar o Proxy da Expo
  const redirectUri = "https://auth.expo.io/@jvlima22/movt";

  const [, response, promptAsync] = Google.useAuthRequest({
    // IMPORTANTE: Para o Proxy da Expo, o Google sempre espera o Client ID de Web
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri,
  });

  // Log para conferência
  useEffect(() => {
    console.log("--- [DEBUG] Google Auth Configuration ---");
    console.log("Web Client ID:", GOOGLE_WEB_CLIENT_ID ? "OK ✅" : "NÃO CARREGADO ❌");
    console.log("Redirect URI Gerada:", redirectUri);
    console.log("---------------------------------------");
  }, [redirectUri]);

  const handleSignInWithSocialToken = useCallback(
    async (provider: "google", token: string) => {
      setLoading(true);
      try {
        const response = await fetch(SOCIAL_SIGN_IN_EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider, token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao autenticar via Edge Function.");
        }

        const { access_token, refresh_token } = await response.json();

        if (access_token && refresh_token) {
          // Define a sessão no Supabase para obter os dados do usuário
          const {
            data: { user: supabaseUser },
            error: userError,
          } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (userError || !supabaseUser) {
            throw new Error("Erro ao obter dados do usuário do Supabase.");
          }

          // Atualiza o contexto global de autenticação do App
          await signIn(access_token, {
            id: supabaseUser.id,
            name:
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              "Usuário Google",
            email: supabaseUser.email || "",
            username:
              supabaseUser.user_metadata?.user_name ||
              supabaseUser.email?.split("@")[0] ||
              "google_user",
            isVerified: true,
            supabaseUserId: supabaseUser.id,
            photo: supabaseUser.user_metadata?.avatar_url || null,
          });

          console.log("Login social bem-sucedido!");

          // Redireciona para a Home
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "App" as never,
                params: { screen: "HomeStack" } as never,
              },
            ],
          });
        } else {
          throw new Error("Tokens de sessão Supabase não recebidos da Edge Function.");
        }
      } catch (error: any) {
        console.error("Erro na autenticação social:", error.message);
        Alert.alert("Erro de Login", error.message);
      } finally {
        setLoading(false);
      }
    },
    [navigation, signIn]
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { idToken, accessToken } = response.authentication || {};
      const token = idToken || accessToken;

      if (token) {
        handleSignInWithSocialToken("google", token);
      } else if ((response as any).params?.id_token) {
        handleSignInWithSocialToken("google", (response as any).params.id_token as string);
      } else if ((response as any).params?.access_token) {
        handleSignInWithSocialToken("google", (response as any).params.access_token as string);
      }
    }
  }, [response, handleSignInWithSocialToken]);

  const signInWithGoogle = async () => {
    try {
      // Forçamos o uso do proxy para o Expo Go
      // @ts-ignore
      await promptAsync({ useProxy: true });
    } catch (error: any) {
      Alert.alert("Erro", `Falha no login com Google: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
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
    paddingTop: 30,
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
