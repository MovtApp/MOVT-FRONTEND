import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import BackButton from "@/components/BackButton";
import SocialButton from "@/components/SocialButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes"; // Corrigida importação de RootStackParamList
import CustomInput from "@/components/CustomInput";
import { Eye, EyeOff } from "lucide-react-native";
import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // Removida importação não utilizada
import { useAuth } from "@contexts/AuthContext";
import { supabase } from "../../services/supabaseClient";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
// import { LoginManager, AccessToken } from 'react-native-fbsdk-next'; // Para Facebook (Removido)

// --- CONFIGURAÇÃO DA URL DA API ---
const API_BASE_URL = "http://10.0.2.2:3000";
// --- FIM DA CONFIGURAÇÃO ---

// URL da sua Edge Function que receberá os tokens dos provedores
const SOCIAL_SIGN_IN_EDGE_FUNCTION_URL =
  "https://ukxvqhguvbyhcvpkxyky.supabase.co/functions/v1/auth/social-sign-in";

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

  // const [sessionId, setSessionId] = useState<string | null>(null); // Variável não utilizada removida
  // const [loggedInUser, setLoggedInUser] = useState<any | null>(null); // Variável não utilizada removida

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
      // Timeout curto para evitar loading infinito em rede lenta
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await axios.post(
        `${API_BASE_URL}/login`,
        {
          email,
          senha: password,
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      Alert.alert("Login Efetuado", response.data.message);

      // Persiste sessão no contexto/AsyncStorage
      await signIn(response.data.sessionId, {
        id: response.data.user.id,
        name: response.data.user.nome,
        email: response.data.user.email,
        username: response.data.user.username,
        isVerified: response.data.user.isVerified,
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

  // @ts-expect-error 'useProxy' é suportado em runtime para forçar proxy do Expo
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [, response, promptAsync] = Google.useAuthRequest({
    // request removido
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        handleSignInWithSocialToken("google", idToken);
      } else if ((response as any).params?.id_token) {
        handleSignInWithSocialToken("google", (response as any).params.id_token as string);
      }
    }
  }, [response]);

  const handleSignInWithSocialToken = async (provider: "google", token: string) => {
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
        await supabase.auth.setSession({ access_token, refresh_token });
        console.log("Login social bem-sucedido via Edge Function!");
        // navigation.navigate('AppStack');
      } else {
        throw new Error("Tokens de sessão Supabase não recebidos da Edge Function.");
      }
    } catch (error: any) {
      console.error("Erro na autenticação social via Edge Function:", error.message);
      Alert.alert("Erro de Login", error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error: any) {
      Alert.alert("Erro", `Falha no login com Google: ${error.message}`);
    }
  };

  // const signInWithFacebook = async () => {
  //   try {
  //     const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  //     if (result.isCancelled) {
  //       console.log('Login do Facebook cancelado.');
  //       return;
  //     }
  //     const data = await AccessToken.getCurrentAccessToken();
  //     if (data?.accessToken) {
  //       await handleSignInWithSocialToken('facebook', data.accessToken);
  //     } else {
  //       Alert.alert('Erro', 'Token de acesso do Facebook não encontrado.');
  //     }
  //   } catch (error: any) {
  //     console.error('Erro no login do Facebook:', error);
  //     Alert.alert('Erro', `Falha no login com Facebook: ${error.message}`);
  //   }
  // };

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
    paddingTop: 20,
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
    backgroundColor: "#222",
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
