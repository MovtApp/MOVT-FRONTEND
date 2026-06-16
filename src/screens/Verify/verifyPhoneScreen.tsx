import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import BackButton from "@components/BackButton";
import CustomInput from "@components/CustomInput";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@typings/routes";
import { api } from "@/services/api";
import { useAuth } from "@contexts/AuthContext";
import {
  startPhoneVerification,
  confirmPhoneCode,
  PhoneConfirmation,
} from "@/services/firebasePhoneAuth";

const VerifyPhoneScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateUser } = useAuth();

  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false); // enviando/reenviando o SMS
  const [verifying, setVerifying] = useState(false); // conferindo o código
  const [sent, setSent] = useState(false); // já enviou ao menos uma vez
  const [phoneMasked, setPhoneMasked] = useState(""); // número do cadastro, mascarado p/ exibir
  const phoneRef = React.useRef<string | null>(null); // telefone E.164 do cadastro (fixo)
  const confirmationRef = React.useRef<PhoneConfirmation | null>(null); // sessão de verificação do Firebase

  // Busca o telefone do cadastro (fixo) e dispara o SMS pelo Firebase.
  // O número NÃO é editável pelo usuário: vem do backend e o backend confere,
  // ao validar o ID token, que o número do Firebase bate com o do cadastro.
  const sendCode = async (isResend = false) => {
    setSending(true);
    try {
      // Garante que temos o telefone do cadastro em E.164.
      if (!phoneRef.current) {
        const { data } = await api.get("/user/phone");
        // Telefone já verificado no backend → segue o fluxo.
        if (data?.alreadyVerified) {
          await updateUser({ phone_verified: true });
          goNext();
          return;
        }
        if (!data?.phone) {
          throw new Error("Não encontramos o telefone do seu cadastro.");
        }
        phoneRef.current = data.phone; // E.164: +55DDDNNNNNNNNN
        setPhoneMasked(data.masked || data.phone);
      }

      confirmationRef.current = await startPhoneVerification(phoneRef.current!);
      setSent(true);
      if (isResend) Alert.alert("Código reenviado", "Enviamos um novo código por SMS.");
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err.response?.data?.error ||
          err?.message ||
          "Não foi possível enviar o código por SMS. Tente novamente."
      );
    } finally {
      setSending(false);
    }
  };

  // Dispara o primeiro envio ao abrir a tela.
  useEffect(() => {
    sendCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Próxima etapa após validar o telefone. Usa os mesmos padrões de navegação já
  // usados em verifyAccountScreen (navigate p/ irmão do Verify; reset p/ App).
  const goNext = () => {
    const isTrainer =
      user?.documentType === "CNPJ" || user?.role === "trainer" || user?.role === "personal";
    if (isTrainer && !user?.cref_verified) {
      navigation.navigate("Verify", { screen: "VerifyCompanyScreen" });
    } else if (user?.onboarding_completed === false) {
      // CPF (ou trainer já com CREF) sem dados pessoais → onboarding Info
      navigation.reset({ index: 0, routes: [{ name: "Info" as never }] });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "App", params: { screen: "HomeStack" } as never }],
      });
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Código incompleto", "Digite os 6 dígitos recebidos por SMS.");
      return;
    }
    if (!confirmationRef.current) {
      Alert.alert("Erro", "Sessão de verificação expirada. Toque em 'Reenviar Código'.");
      return;
    }
    setVerifying(true);
    try {
      // Confirma o código no Firebase e pega o ID token.
      const idToken = await confirmPhoneCode(confirmationRef.current, code);
      // Backend valida o token (firebase-admin), confere que o número bate com o
      // do cadastro e marca phone_verified.
      await api.post("/user/verify-phone-firebase", { idToken });
      await updateUser({ phone_verified: true });
      goNext();
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err.response?.data?.error ||
          err?.message ||
          "Código inválido ou expirado. Tente novamente."
      );
    } finally {
      setVerifying(false);
    }
  };

  const canSubmit = code.length === 6 && !verifying && !sending;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* Verify é raiz do stack: o back sai do fluxo e volta ao login. */}
        <BackButton
          autoTopInset
          onPress={() => navigation.navigate("Auth", { screen: "SignInScreen" } as never)}
        />
        <Text style={styles.title}>Validar telefone</Text>
        <Text style={styles.subtitle}>
          Enviamos um código de 6 dígitos por SMS para o telefone do seu cadastro
          {phoneMasked ? ` (${phoneMasked})` : ""}. Digite-o abaixo para confirmar seu número.
        </Text>

        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>Código de verificação</Text>
          <CustomInput
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, "").slice(0, 6))}
            placeholder="______"
            maxLength={6}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => sendCode(true)}
            disabled={sending}
          >
            <Text style={styles.resendButtonText}>
              {sending ? "Reenviando..." : "Reenviar Código"}
            </Text>
          </TouchableOpacity>

          {sending && !sent && (
            <View style={styles.sendingRow}>
              <ActivityIndicator color="#192126" />
              <Text style={styles.sendingText}>Enviando código…</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, !canSubmit && { opacity: 0.6 }]}
        onPress={handleVerify}
        disabled={!canSubmit}
      >
        {verifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verificar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VerifyPhoneScreen;

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
  sendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sendingText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: "#666",
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
});
