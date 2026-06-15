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
import { secureGet } from "@/services/secureStore";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@contexts/AuthContext";

type DocSide = "front" | "back";

const VerifyCrefScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateUser } = useAuth();

  const [code, setCode] = useState("");
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // "status" = stepper do andamento (já enviou); "form" = enviar/reenviar documentos.
  // Abre no stepper quando o usuário já enviou o CREF (persistido via session-status).
  const [mode, setMode] = useState<"status" | "form">(user?.cref_submitted ? "status" : "form");
  // Observação técnica do último envio (ex.: "IA não reconheceu a FRENTE"), usada
  // como fallback quando ainda não há motivo de reprovação registrado pelo admin.
  const [lastObservation, setLastObservation] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Status atual da verificação (vem do backend via AuthContext).
  const status = user?.status_verificacao || "pendente";
  const isRejected = status === "reprovado";
  const isApproved = status === "aprovado" || user?.cref_verified === true;
  // "pendente" e "pendente_revisao" significam "em análise".
  const isUnderReview = !isRejected && !isApproved;
  const rejectionReason = user?.cref_rejeicao_motivo || lastObservation;

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

  // Após o CREF, ainda falta preencher os dados pessoais (onboarding) se a conta
  // nunca preencheu — só então vai pra Home. Contas antigas têm onboarding_completed=true.
  const goToApp = () => {
    if (user?.onboarding_completed === false) {
      navigation.reset({ index: 0, routes: [{ name: "Info" as never }] });
      return;
    }
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

  // Sobe frente + verso (multipart) para o backend. A validação é híbrida (sem IA):
  // o backend tenta confirmar o número no registro oficial CONFEF/CREF; quando não
  // consegue, cai em revisão manual (status "pendente"). Ver docs/cref-validacao-hibrida.md.
  const uploadDocuments = async () => {
    setLoading(true);
    try {
      // 1. Salva o número do CREF antes do upload (cruzado com o registro/curadoria)
      await api.put("/user/professional-data", { cref: code });

      // 2. Envia as fotos dos dois lados (multipart) para análise
      const formData = new FormData();
      const appendSide = (field: string, uri: string) => {
        // Deriva a extensão de forma segura: descarta query/fragment e, para
        // uris sem extensão (ex: content:// da galeria), assume jpg. Evita
        // jogar a uri inteira dentro do `name` e confundir o parser do backend.
        const path = uri.split("?")[0].split("#")[0];
        const rawExt = path.includes(".") ? path.split(".").pop()!.toLowerCase() : "jpg";
        const ext = rawExt === "png" ? "png" : "jpg";
        formData.append(field, {
          uri,
          name: `${field}.${ext}`,
          type: ext === "png" ? "image/png" : "image/jpeg",
        } as any);
      };
      appendSide("document_front", frontUri as string);
      appendSide("document_back", backUri as string);

      // Upload via fetch nativo (não axios): no React Native o axios não
      // serializa FormData de forma confiável e exige Content-Type manual sem
      // boundary, fazendo o backend receber os campos sem os bytes da imagem.
      // O fetch lê os arquivos das uris e gera o boundary correto sozinho —
      // por isso NÃO definimos Content-Type aqui (deixar em aberto é proposital).
      const sessionId = await secureGet("userSessionId");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let responseData: any = {};
      try {
        const res = await fetch(`${API_BASE_URL}/user/document`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
          },
          body: formData,
          signal: controller.signal,
        });
        const raw = await res.text();
        responseData = raw ? JSON.parse(raw) : {};
        if (!res.ok) {
          throw { response: { status: res.status, data: responseData } };
        }
      } finally {
        clearTimeout(timeoutId);
      }

      // Contrato híbrido: o backend devolve status_verificacao no topo (novo) ou,
      // por compatibilidade, em ai_analysis.status (legado).
      const resultStatus = responseData?.status_verificacao || responseData?.ai_analysis?.status;
      // Observação técnica (ex.: "IA não reconheceu a FRENTE"); guardada para exibir
      // no stepper enquanto o admin não registra um motivo de reprovação próprio.
      const observation =
        responseData?.observation || responseData?.ai_analysis?.observation || null;
      setLastObservation(observation);

      if (resultStatus === "aprovado") {
        await updateUser({
          cref_verified: true,
          status_verificacao: "aprovado",
          cref_submitted: true,
          cref_rejeicao_motivo: null,
        });
        Alert.alert("Verificação concluída", "Seu CREF foi validado com sucesso!", [
          { text: "Continuar", onPress: goToApp },
        ]);
      } else if (resultStatus === "reprovado") {
        await updateUser({
          status_verificacao: "reprovado",
          cref_submitted: true,
          cref_rejeicao_motivo: observation,
        });
        // Mostra o andamento (Recusado) em vez de voltar ao formulário vazio.
        setMode("status");
      } else {
        // Pendente: validação automática indeterminada → entra na curadoria humana.
        // Acesso segue bloqueado até a aprovação, mas o envio NÃO foi recusado.
        await updateUser({
          status_verificacao: "pendente",
          cref_submitted: true,
          cref_rejeicao_motivo: null,
        });
        // Em vez de só alertar, leva ao stepper "Em validação" (persiste no restart).
        setMode("status");
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

  // Re-consulta o backend para refletir uma decisão recente (aprovação/recusa do admin).
  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get("/user/session-status");
      const u = data?.user;
      if (u) {
        await updateUser({
          cref_verified: u.cref_verified,
          status_verificacao: u.status_verificacao,
          cref_submitted: u.cref_submitted,
          cref_rejeicao_motivo: u.cref_rejeicao_motivo,
        });
        if (u.cref_verified) goToApp();
      }
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o status agora. Tente novamente.");
    } finally {
      setRefreshing(false);
    }
  };

  // Volta ao formulário para reenviar (mesmo número ou outro). Só ofertado após recusa.
  const startRevalidation = () => {
    setCode("");
    setFrontUri(null);
    setBackUri(null);
    setLastObservation(null);
    setMode("form");
  };

  // Um passo do stepper de andamento.
  const renderStep = (
    state: "done" | "active" | "error" | "pending",
    title: string,
    desc: string,
    last = false
  ) => {
    const palette = {
      done: { bg: "#16A34A", glyph: "✓", color: "#16A34A" },
      active: { bg: "#F59E0B", glyph: "●", color: "#B45309" },
      error: { bg: "#DC2626", glyph: "✕", color: "#DC2626" },
      pending: { bg: "#CBD5E1", glyph: "", color: "#94A3B8" },
    }[state];
    return (
      <View style={styles.stepRow}>
        <View style={styles.stepRail}>
          <View style={[styles.stepDot, { backgroundColor: palette.bg }]}>
            <Text style={styles.stepDotGlyph}>{palette.glyph}</Text>
          </View>
          {!last && <View style={styles.stepConnector} />}
        </View>
        <View style={{ flex: 1, paddingBottom: last ? 0 : 22 }}>
          <Text style={[styles.stepTitle, { color: palette.color }]}>{title}</Text>
          <Text style={styles.stepDesc}>{desc}</Text>
        </View>
      </View>
    );
  };

  const renderStatus = () => (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>Status do CREF</Text>
        <Text style={styles.subtitle}>
          {isApproved
            ? "Seu registro profissional foi validado."
            : isRejected
              ? "Seu envio foi analisado e não pôde ser aprovado."
              : "Recebemos seus documentos. Acompanhe o andamento abaixo."}
        </Text>

        <View style={{ marginTop: 28 }}>
          {renderStep("done", "Documentos enviados", "Frente e verso recebidos com sucesso.")}
          {renderStep(
            isUnderReview ? "active" : "done",
            "Em validação",
            isUnderReview
              ? "Estamos conferindo seu registro. Isso pode levar algum tempo."
              : "Análise concluída."
          )}
          {renderStep(
            isApproved ? "done" : isRejected ? "error" : "pending",
            isApproved ? "CREF validado" : isRejected ? "CREF recusado" : "Resultado",
            isApproved
              ? "Tudo certo! Você já pode acessar o app."
              : isRejected
                ? "Confira o motivo abaixo e reenvie."
                : "Aguardando a decisão da validação.",
            true
          )}
        </View>

        {isRejected && rejectionReason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Motivo da recusa</Text>
            <Text style={styles.reasonText}>{rejectionReason}</Text>
          </View>
        )}
      </View>

      {isApproved ? (
        <TouchableOpacity style={styles.verifyButton} onPress={goToApp}>
          <Text style={styles.verifyButtonText}>Continuar</Text>
        </TouchableOpacity>
      ) : isRejected ? (
        <TouchableOpacity style={styles.verifyButton} onPress={startRevalidation}>
          <Text style={styles.verifyButtonText}>Revalidar CREF</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.verifyButton, refreshing && { opacity: 0.6 }]}
          onPress={refreshStatus}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Atualizar status</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

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

  if (mode === "status") {
    return renderStatus();
  }

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
            placeholder="000000-G/SP"
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
  // Stepper de status
  stepRow: {
    flexDirection: "row",
  },
  stepRail: {
    alignItems: "center",
    marginRight: 14,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotGlyph: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Rubik_700Bold",
    lineHeight: 18,
  },
  stepConnector: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  stepTitle: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  stepDesc: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  reasonBox: {
    marginTop: 24,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  reasonLabel: {
    fontFamily: "Rubik_700Bold",
    fontSize: 12,
    color: "#B91C1C",
    marginBottom: 4,
  },
  reasonText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: "#7F1D1D",
  },
});
