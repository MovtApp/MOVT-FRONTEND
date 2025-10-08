import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import BackButton from "@/components/BackButton";
import SocialButton from "@/components/SocialButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import RootStackParamList from "@typings/routes";
import CustomInput from "@/components/CustomInput";
import { Eye, EyeOff } from "lucide-react-native";
import axios from "axios"; // Adicionei axios
import AsyncStorage from "@react-native-async-storage/async-storage"; // Adicionei AsyncStorage
import { useAuth } from "@contexts/AuthContext"; // Importar useAuth

// --- CONFIGURAÇÃO DA URL DA API ---
// IMPORTANTE: Substitua pelo IP da sua máquina na rede local ou 10.0.2.2 para emuladores Android
// Exemplo: 'http://192.168.1.100:3000' para um dispositivo físico na mesma rede Wi-Fi
// Exemplo: 'http://10.0.2.2:3000' para emuladores Android
const API_BASE_URL = 'http://10.0.2.2:3000';
// --- FIM DA CONFIGURAÇÃO ---

export const SignInScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth(); // Obter a função signIn do contexto

  // Estados locais para os campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Novo estado para feedback de carregamento
  const [error, setError] = useState<string | null>(null); // Novo estado para exibir erros específicos

  // Estado para armazenar o sessionId e dados do usuário logado
  // Em um app real, você usaria AsyncStorage para persistir isso entre sessões.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null); // Pode ser tipado melhor depois

  function handleSignup() {
    navigation.navigate("Auth", { screen: "SignUpScreen" });
  }

  // A função original handleVerifyAccount será substituída pelo nosso handleLogin no botão.
  // Se "VerifyAccountScreen" for a próxima tela após o login, podemos navegar para ela dentro do handleLogin.
  // function handleVerifyAccount() {
  //   navigation.navigate("Verify", { screen: "VerifyAccountScreen" });
  // }

  function handleRecovery() {
    navigation.navigate("Verify", { screen: "RecoveryScreen" });
  }

  // --- NOVA FUNÇÃO para fazer LOGIN com o backend Node.js ---
  const handleLogin = async () => {
    setError(null); // Limpa erros anteriores
    setLoading(true); // Ativa o estado de carregamento

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        senha: password, // 'senha' é o nome do campo no seu backend Node.js
        // Se você quiser enviar o sessionId existente para validação extra no login (conforme implementamos no backend),
        // pode incluí-lo aqui: sessionId: sessionId,
      });

      // Sucesso no login
      Alert.alert('Login Efetuado', response.data.message);
      console.log('Dados do Usuário Logado:', response.data.user);
      console.log('Session ID:', response.data.sessionId);

      // Chamar signIn do AuthContext para gerenciar a sessão
      await signIn(response.data.sessionId, { 
        id: response.data.user.id, 
        name: response.data.user.nome, 
        email: response.data.user.email, 
        username: response.data.user.username,
        isVerified: response.data.user.isVerified 
      });

      // As navegações serão tratadas pelo App.tsx com base no estado do AuthContext
      // Não precisamos de navegação condicional aqui, pois App.tsx lida com isso.

    } catch (err: any) {
      // Corrigido: Mostra erro genérico se não houver resposta do backend
      if (err.response && err.response.data) {
        console.error('Erro ao logar:', err.response.data);
      } else {
        console.error('Erro ao logar:', err.message);
      }
      const errorMessage = err?.response?.data?.error
        ? err.response.data.error
        : 'Ocorreu um erro ao fazer login.';
      setError(errorMessage); // Define o erro para ser exibido na UI
      Alert.alert('Erro no Login', errorMessage); // Exibe um alerta também para feedback imediato
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Entre na sua conta</Text>
      <Text style={styles.subtitle}>
        Digite seu e-mail e senha para fazer login
      </Text>
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
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={{ marginRight: 22 }}>
              {showPassword ? (
                <EyeOff size={24} color="#888" />
              ) : (
                <Eye size={24} color="#888" />
              )}
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

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin} // CHAMA A NOVA FUNÇÃO DE LOGIN
          disabled={loading} // Desabilita o botão enquanto estiver carregando
        >
          <Text style={styles.loginButtonText}>{loading ? 'Entrando...' : 'Log In'}</Text>
        </TouchableOpacity>
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Ou</Text>
          <View style={styles.separatorLine} />
        </View>
        <View>
          <SocialButton
            type="google"
            text="Continue com Google"
            onPress={() => {}}
          />
          <SocialButton
            type="facebook"
            text="Continue com Facebook"
            onPress={() => {}}
          />
          <SocialButton
            type="apple"
            text="Continue com Icloud"
            onPress={() => {}}
          />
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
    textAlign: 'center', // Adicionado para melhor alinhamento do erro
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