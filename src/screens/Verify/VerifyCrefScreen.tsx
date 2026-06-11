import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import BackButton from "@components/BackButton";
import CustomInput from "@components/CustomInput";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/services/api";
import { useAuth } from "@contexts/AuthContext";

type DocSide = "front" | "back";

const VerifyCrefScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { updateUser } = useAuth();

  const [code, setCode] = useState("");
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
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

  // Captura uma foto (câmera ou galeria) para um lado específico do documento.
  const pickImage = (side: DocSide) => {
    const setUri = side === "front" ? setFrontUri : setBackUri;
    const label = side === "front" ? "frente" : "verso";

    Alert.alert(`Foto da ${label} do CREF`, `Envie uma foto nítida da ${label} da sua carteira:`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tirar foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de permissão para a câmera.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            quality: 0.8,
          });
          if (!result.canceled) setUri(result.assets[0].uri);
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
          if (!result.canceled) setUri(result.assets[0].uri);
        },
      },
    ]);
  };

  // Sobe frente + verso (multipart) para o backend, que roda a análise por IA,
  // cruza o número do CREF da frente com o digitado e checa a validade no verso.
  const uploadDocuments = async () => {
    setLoading(true);
    try {
      // 1. Salva o número do CREF antes do upload (a IA cruza com este valor)
      await api.put("/user/professional-data", { cref: code });

      // 2. Envia as fotos dos dois lados (multipart) para análise
      const formData = new FormData();
      const appendSide = (field: string, uri: string) => {
        const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
        formData.append(field, {
          uri,
          name: `${field}.${ext}`,
          type: ext === "png" ? "image/png" : "image/jpeg",
        } as any);
      };
      appendSide("document_front", frontUri as string);
      appendSide("document_back", backUri as string);

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
          response.data?.ai_analysis?.observation ||
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
    if (!frontUri) {
      Alert.alert("Falta a frente", "Adicione a foto da frente da carteira.");
      return;
    }
    if (!backUri) {
      Alert.alert("Falta o verso", "Adicione a foto do verso da carteira.");
      return;
    }
    uploadDocuments();
  };

  const renderSlot = (side: DocSide, label: string, uri: string | null) => (
    <TouchableOpacity
      style={[styles.slot, uri && styles.slotFilled]}
      onPress={() => pickImage(side)}
      disabled={loading}
      activeOpacity={0.8}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>✓ {label}</Text>
          </View>
          <Text style={styles.slotRetake}>Trocar foto</Text>
        </>
      ) : (
        <>
          <Text style={styles.slotIcon}>＋</Text>
          <Text style={styles.slotLabel}>{label}</Text>
          <Text style={styles.slotHint}>Toque para adicionar</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const canSubmit =
    /^\d{4,6}-[A-Z]\/[A-Z]{2}$/.test(code) && !!frontUri && !!backUri && !loading;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>Validar seu cref</Text>
        <Text style={styles.subtitle}>
          Digite o número do registro CREF e envie os dois lados da carteira para confirmar a
          identidade do profissional de Educação Física.
        </Text>
        <View style={{ marginTop: 24 }}>
          <Text style={styles.subtitle}>Número do CREF</Text>
          <CustomInput
            value={code}
            onChangeText={(text) => setCode(maskCrefInput(text))}
            placeholder="171844-G/SP"
            maxLength={11}
            keyboardType="default"
          />
        </View>

        <Text style={[styles.subtitle, { marginTop: 20 }]}>Foto da carteira</Text>
        <View style={styles.slotsRow}>
          {renderSlot("front", "Frente", frontUri)}
          {renderSlot("back", "Verso", backUri)}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, !canSubmit && { opacity: 0.6 }]}
        onPress={handleVerify}
        disabled={!canSubmit}
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
  slotsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  slot: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D5D5D5",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slotFilled: {
    borderStyle: "solid",
    borderColor: "#192126",
  },
  slotImage: {
    ...StyleSheet.absoluteFillObject,
  },
  slotIcon: {
    fontSize: 32,
    color: "#999",
    marginBottom: 4,
  },
  slotLabel: {
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
    color: "#333",
  },
  slotHint: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  slotBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(25,33,38,0.85)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  slotBadgeText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 12,
  },
  slotRetake: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: "#192126",
    fontFamily: "Rubik_500Medium",
    fontSize: 12,
    overflow: "hidden",
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
