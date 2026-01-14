import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import BackButton from "@/components/BackButton"; // Ajustei o caminho para o alias
import CustomInput from "@/components/CustomInput"; // Ajustei o caminho para o alias
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"; // Adicionei useRoute
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes"; // Já corrigido para @typings/routes
import { api } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@contexts/AuthContext";

type VerifyAccountScreenRouteProp = RouteProp<RootStackParamList, "Verify">;

const VerifyAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<VerifyAccountScreenRouteProp>();
  const { updateUser } = useAuth();

  const { sessionId: routeSessionId } = route.params?.params || {};

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(routeSessionId ?? null);

  useEffect(() => {
    const loadAndCheckSessionId = async () => {
      if (routeSessionId) {
        setCurrentSessionId(routeSessionId);
      } else {
        const storedSessionId = await AsyncStorage.getItem("userSessionId");
        if (storedSessionId) {
          setCurrentSessionId(storedSessionId);
        } else {
          Alert.alert("Erro", "Sessão inválida. Por favor, faça login novamente.");
          navigation.navigate("Auth", { screen: "SignInScreen" });
        }
      }
    };
    loadAndCheckSessionId();
  }, [routeSessionId, navigation]);

  const handleResend = async () => {
    if (!currentSessionId) {
      Alert.alert("Erro", "Sessão inválida. Por favor, faça login novamente.");
      navigation.navigate("Auth", { screen: "SignInScreen" });
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/user/send-verification");

      if (response.data.message === "Seu e-mail já está verificado.") {
        Alert.alert("Sucesso", response.data.message);
        navigation.navigate("App", { screen: "HomeStack" });
      } else {
        Alert.alert("Sucesso", response.data.message);
      }
    } catch (err: any) {
      console.error("Erro ao reenviar código:", err.response ? err.response.data : err.message);
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
      const response = await api.post("/user/verify", { code });
      Alert.alert("Verificação Concluída", response.data.message);
      await updateUser({ isVerified: true });

      navigation.reset({
        index: 0,
        routes: [{ name: "App", params: { screen: "HomeStack" } as never }],
      });
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
          <Text style={styles.resendButtonText}>{loading ? "Reenviando..." : "Reenviar Código"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={loading || !code || code.length !== 6}
        >
          <Text style={styles.verifyButtonText}>{loading ? "Verificando..." : "Verificar"}</Text>
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
