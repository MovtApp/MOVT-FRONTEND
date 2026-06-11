import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator, Platform } from "react-native";
import BackButton from "@components/BackButton";
import CustomInput from "@components/CustomInput";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/services/api";
import { useAuth } from "@contexts/AuthContext";

const VerifyCrefScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { updateUser } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Máscara 171844-G/SP  (número-categoria/UF)
  function maskCrefInput(text: string) {
    const clean = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const numbers = (clean.match(/^\d{0,6}/) || [""])[0]; // até 6 dígitos
    const rest = clean.slice(numbers.length).replace(/[^A-Z]/g, "");
    const category = rest.slice(0, 1); // categoria (G/P)
    const uf = rest.slice(1, 3); // UF

    let masked = numbers;
    if (category) masked += "-" + category;
    if (uf) masked += "/" + uf;
    return masked;
  }

  const goToApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "App", params: { screen: "HomeStack" } as never }],
    });
  };

  // Sobe a foto do documento para o backend, que roda a análise por IA e cruza
  // o número do CREF da imagem com o que foi digitado.
  const uploadDocument = async (uri: string) => {
    setLoading(true);
    try {
      // 1. Salva o número do CREF antes do upload (a IA cruza com este valor)
      await api.put("/user/professional-data", { cref: code });

      // 2. Envia a foto do documento (multipart) para análise
      const formData = new FormData();
      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      formData.append("document", {
        uri,
        name: `cref.${ext}`,
        type: ext === "png" ? "image/png" : "image/jpeg",
      } as any);

      const response = await api.put("/user/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const status = response.data?.ai_analysis?.status;

      if (status === "aprovado") {
        await updateUser({ cref_verified: true, status_verificacao: "aprovado" });
        Alert.alert("Verificação concluída", "Seu CREF foi validado com sucesso!", [
          { text: "Continuar", onPress: goToApp },
        ]);
      } else {
        // Hard gate: enquanto não for aprovado, o acesso ao app continua bloqueado.
        await updateUser({ status_verificacao: "pendente" });
        Alert.alert(
          "Documento enviado",
          response.data?.message ||
            "Seu documento foi enviado para análise. Você poderá acessar o app assim que for aprovado."
        );
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível enviar o documento. Tente novamente.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{4,6}-[A-Z]\/[A-Z]{2}$/.test(code)) {
      Alert.alert("CREF inválido", "Digite o número completo do CREF (ex: 171844-G/SP).");
      return;
    }

    Alert.alert("Documento do CREF", "Envie uma foto da sua carteira do CREF para validação:", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tirar foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de permissão para a câmera.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8 });
          if (!result.canceled) uploadDocument(result.assets[0].uri);
        },
      },
      {
        text: "Galeria",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de permissão para a galeria.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.8,
          });
          if (!result.canceled) uploadDocument(result.assets[0].uri);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>Validar seu cref</Text>
        <Text style={styles.subtitle}>
          Digite o número do registro CREF para confirmar a identidade do profissional de Educação
          Física.
        </Text>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>Número do CREF</Text>
          <CustomInput
            value={code}
            onChangeText={(text) => setCode(maskCrefInput(text))}
            placeholder="171844-G/SP"
            maxLength={11}
            keyboardType="default"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, loading && { opacity: 0.6 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Enviar documento e verificar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VerifyCrefScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 0 : 30, // Inset controlado pelo BackButton (autoTopInset)
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
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  verifyButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 50,
  },
  verifyButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});
