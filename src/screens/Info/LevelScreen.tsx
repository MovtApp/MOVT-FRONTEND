import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import BackButton from "@components/BackButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { SelectButton } from "@components/SelectButton";
import { RootStackParamList } from "@typings/routes";

const LevelScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signIn } = useAuth();
  const [level, setLevel] = useState<string>("Iniciante");
  const [loading, setLoading] = useState(false);

  const handleLevel = async () => {
    setLoading(true);
    try {
      // 1. Pega todos os dados do AsyncStorage
      const gender = await AsyncStorage.getItem("@MOVT:onboarding:gender");
      const age = await AsyncStorage.getItem("@MOVT:onboarding:age");
      const height = await AsyncStorage.getItem("@MOVT:onboarding:height");
      const weight = await AsyncStorage.getItem("@MOVT:onboarding:weight");
      const objective = await AsyncStorage.getItem("@MOVT:onboarding:objective");

      console.log("Sincronizando dados finais com Vercel Backend...");

      const { userService } = await import("../../services/userService");

      // 2. Chama a sincronização final (Cria o usuário na Vercel)
      const response = await userService.completeRegistration({
        nome: user?.name || "Usuário Google",
        email: user?.email || "",
        genero: gender || "Não informado",
        idade: Number(age) || 25,
        altura: Number(height) || 170,
        peso: Number(weight) || 70,
        objetivo: objective || "Manter peso",
        nivel: level,
      });

      console.log("Registro completo na Vercel. Novo SessionID recebido.");

      // 3. Atualiza o AuthContext com o SessionID REAL da Vercel
      if (response.sessionId || response.access_token) {
        await signIn(response.sessionId || response.access_token, {
          ...user!,
          id_us: response.user?.id || response.user?.id_us || user?.id_us,
          sessionId: response.sessionId || response.access_token,
          isPendingSync: false, // Libera chamadas de API
          onboarding_completed: true, // dados pessoais preenchidos → não volta ao Info
        } as any);
      }

      // 4. Limpa o cache de onboarding
      const keys = [
        "@MOVT:onboarding:gender",
        "@MOVT:onboarding:age",
        "@MOVT:onboarding:height",
        "@MOVT:onboarding:weight",
        "@MOVT:onboarding:objective",
      ];
      await AsyncStorage.multiRemove(keys);

      // 5. Partiu Home! (Agora sem 401)
      navigation.reset({
        index: 0,
        routes: [{ name: "App" as never, params: { screen: "HomeStack" } as never }],
      });
    } catch (error: any) {
      console.error("Erro ao finalizar cadastro na Vercel:", error);
      Alert.alert(
        "Erro de Sincronização",
        "Não conseguimos finalizar seu perfil. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const levels = ["Iniciante", "Intermediário", "Avançado"];

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>Nível</Text>
        <Text style={styles.question}>Qual seu nível de atividade física?</Text>
        <Text style={styles.instruction}>Classifique seu nível de atividade física.</Text>

        {levels.map((lvl) => (
          <SelectButton
            key={lvl}
            text={lvl}
            onPress={() => setLevel(lvl)}
            style={level === lvl ? { backgroundColor: "#BBF246" } : {}}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.advanceButton, loading && { opacity: 0.7 }]}
        onPress={handleLevel}
        disabled={loading}
      >
        <Text style={styles.advanceButtonText}>{loading ? "Finalizando..." : "Finalizar"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 32,
    marginTop: 30,
    marginBottom: 4,
    color: "#111",
  },
  subtitle: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    marginTop: 30,
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  question: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    marginTop: 10,
    color: "#111",
    marginBottom: 8,
  },
  instruction: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  advanceButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 50,
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  objectiveButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 30,
  },
  objectiveButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});

export default LevelScreen;
