import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import BackButton from "@/components/BackButton"; // Ajustei o caminho para o alias
import CustomInput from "@/components/CustomInput"; // Ajustei o caminho para o alias
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"; // Adicionei useRoute
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes"; // Já corrigido para @typings/routes
import axios from "axios"; // Adicionado axios
import AsyncStorage from "@react-native-async-storage/async-storage"; // Importar AsyncStorage

// --- CONFIGURAÇÃO DA URL DA API ---
// IMPORTANTE: Substitua pelo IP da sua máquina na rede local ou 10.0.2.2 para emuladores Android
// Exemplo: 'http://192.168.1.100:3000' para um dispositivo físico na mesma rede Wi-Fi
// Exemplo: 'http://10.0.2.2:3000' para emuladores Android
const API_BASE_URL = "http://10.0.2.2:3000"; // USE O IP CORRETO AQUI (ex: 10.0.2.2 para Android Emulator)
// --- FIM DA CONFIGURAÇÃO ---

// Definindo o tipo da rota para acessar os parâmetros
type VerifyAccountScreenRouteProp = RouteProp<RootStackParamList, "Verify">;

const VerifyAccountScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<VerifyAccountScreenRouteProp>();

  // O sessionId deve ser passado como parâmetro de navegação do login/registro
  // Ex: navigation.navigate("Verify", { screen: "VerifyAccountScreen", sessionId: response.data.sessionId });
  const { sessionId: routeSessionId } = route.params?.params || {}; // Acessa params dentro de params, conforme o RootStackParamList

  const [code, setCode] = useState(""); // Estado para o código digitado
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const [error, setError] = useState<string | null>(null); // Estado para mensagens de erro

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    routeSessionId ?? null,
  );

  useEffect(() => {
    const loadAndCheckSessionId = async () => {
      if (routeSessionId) {
        setCurrentSessionId(routeSessionId);
      } else {
        const storedSessionId = await AsyncStorage.getItem("userSessionId");
        if (storedSessionId) {
          setCurrentSessionId(storedSessionId);
        } else {
          Alert.alert(
            "Erro",
            "Sessão inválida. Por favor, faça login novamente.",
          );
          navigation.navigate("Auth", { screen: "SignInScreen" });
        }
      }
    };
    loadAndCheckSessionId();
  }, [routeSessionId, navigation]);

  // --- Função para Reenviar o Código de Verificação ---
  const handleResend = async () => {
    if (!currentSessionId) {
      Alert.alert("Erro", "Sessão inválida. Por favor, faça login novamente.");
      navigation.navigate("Auth", { screen: "SignInScreen" }); // Redireciona para login se não houver sessionId
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/send-verification`,
        {}, // Body vazio para reenviar
        {
          headers: {
            Authorization: `Bearer ${currentSessionId}`, // Envia o sessionId para identificar o usuário
          },
        },
      );

      // Verifica se o e-mail já está verificado para redirecionar
      if (response.data.message === "Seu e-mail já está verificado.") {
        Alert.alert("Sucesso", response.data.message);
        navigation.navigate("App", { screen: "HomeScreen" });
      } else {
        Alert.alert("Sucesso", response.data.message);
      }
    } catch (err: any) {
      console.error(
        "Erro ao reenviar código:",
        err.response ? err.response.data : err.message,
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Ocorreu um erro ao reenviar o código.";
      setError(errorMessage);
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Função para Verificar o Código ---
  const handleVerify = async () => {
    if (!currentSessionId) {
      Alert.alert("Erro", "Sessão inválida. Por favor, faça login novamente.");
      navigation.navigate("Auth", { screen: "SignInScreen" });
      return;
    }
    if (!code) {
      setError("Por favor, digite o código de verificação.");
      return;
    }
    if (code.length !== 6) {
      setError("O código de verificação deve ter 6 dígitos.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/verify`,
        { code }, // Envia o código digitado pelo usuário
        {
          headers: {
            Authorization: `Bearer ${currentSessionId}`, // Envia o sessionId para identificar o usuário
          },
        },
      );
      Alert.alert("Verificação Concluída", response.data.message);

      // --- Lógica de navegação após a verificação bem-sucedida ---
      // Redireciona para uma tela principal ou dashboard
      // TODO: Substituir por navigation.navigate("App", { screen: "HomeScreen" }); ou a tela pós-verificação correta
      navigation.navigate("App", { screen: "HomeScreen" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Ocorreu um erro ao verificar o código.";
      setError(errorMessage);
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Verifique sua conta </Text>
      <Text style={styles.subtitle}>
        Digite o código de 6 dígitos que enviamos para o seu e-mail.
      </Text>

      <View style={{ marginTop: 30 }}>
        <Text style={styles.label}>Código de verificação</Text>
        <CustomInput
          value={code}
          onChangeText={setCode}
          placeholder="______"
          keyboardType="numeric"
          maxLength={6}
          spellCheck={false} // Garantir que não há interferência
          autoCapitalize="none" // Garantir que não há interferência
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={loading}
        >
          <Text style={styles.resendButtonText}>
            {loading ? "Reenviando..." : "Reenviar Código"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={loading || !code || code.length !== 6} // Desabilita se estiver carregando ou código inválido
        >
          <Text style={styles.verifyButtonText}>
            {loading ? "Verificando..." : "Verificar"}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 18,
  },
  label: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#666",
    marginBottom: 6,
    marginTop: 8,
  },
  error: {
    color: "red",
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
    textAlign: "center",
  },
  resendButton: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  resendButtonText: {
    color: "#BBF246",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  verifyButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  footerText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#888",
  },
});

export default VerifyAccountScreen;
