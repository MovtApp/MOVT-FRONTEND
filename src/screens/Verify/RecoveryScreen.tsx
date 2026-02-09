import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from "react-native";
import BackButton from "@components/BackButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CustomInput from "@components/CustomInput";
import { RootStackParamList } from "@typings/routes";
import { authService } from "@services/authService";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react-native";

const RecoveryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password, 4: Success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Request Code
  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert("Erro", "Por favor, insira seu e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestRecovery(email);
      if (res.success) {
        setStep(2);
      } else {
        Alert.alert("Erro", res.error || "Ocorreu um erro ao enviar o código.");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Falha na conexão com o servidor.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      Alert.alert("Erro", "Insira o código de 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyRecoveryCode(email, code);
      if (res.success) {
        setStep(3);
      } else {
        Alert.alert("Erro", "Código inválido ou expirado.");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Código inválido.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(email, code, password);
      if (res.success) {
        setStep(4);
      } else {
        Alert.alert("Erro", res.error || "Erro ao redefinir senha.");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Falha ao redefinir.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <>
          <Text style={styles.title}>Esqueceu a senha?</Text>
          <Text style={styles.subtitle}>Não se preocupe! Insira seu e-mail abaixo e enviaremos um código de recuperação.</Text>
          <View style={{ marginTop: 30 }}>
            <Text style={styles.inputLabel}>Endereço de e-mail</Text>
            <CustomInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.subtitle}>Enviamos um código de 6 dígitos para <Text style={{ fontWeight: '700' }}>{email}</Text>.</Text>
          <View style={{ marginTop: 30 }}>
            <Text style={styles.inputLabel}>Código de Verificação</Text>
            <CustomInput
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
            />
            <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 10 }}>
              <Text style={styles.changeEmail}>Alterar e-mail</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <Text style={styles.title}>Nova Senha</Text>
          <Text style={styles.subtitle}>Crie uma nova senha forte para proteger sua conta.</Text>
          <View style={{ marginTop: 30 }}>
            <Text style={styles.inputLabel}>Nova Senha</Text>
            <CustomInput
              value={password}
              onChangeText={setPassword}
              placeholder="Digite a nova senha"
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginRight: 15 }}>
                  {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                </TouchableOpacity>
              }
            />
            <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
            <CustomInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme a senha"
              secureTextEntry={!showPassword}
            />
          </View>
        </>
      );
    }

    if (step === 4) {
      return (
        <View style={styles.successContainer}>
          <CheckCircle2 size={80} color="#CBFB5E" />
          <Text style={styles.titleSuccess}>Senha Redefinida!</Text>
          <Text style={styles.subtitleSuccess}>Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova credencial.</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {step < 4 && <BackButton />}
        {renderContent()}
      </View>

      <TouchableOpacity
        style={[styles.mainButton, loading && { opacity: 0.7 }]}
        onPress={
          step === 1 ? handleRequestCode :
            step === 2 ? handleVerifyCode :
              step === 3 ? handleResetPassword :
                () => navigation.navigate("Auth", { screen: "SignInScreen" })
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.mainButtonText}>
            {step === 1 ? "Enviar Código" :
              step === 2 ? "Verificar Código" :
                step === 3 ? "Redefinir Senha" :
                  "Voltar ao Login"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default RecoveryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 28,
    marginTop: 30,
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  inputLabel: {
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
    marginTop: 16,
  },
  changeEmail: {
    color: "#CBFB5E",
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: "#192126",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 40,
    height: 56,
    justifyContent: 'center',
  },
  mainButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  titleSuccess: {
    fontFamily: "Rubik_700Bold",
    fontSize: 24,
    marginTop: 20,
    marginBottom: 10,
    color: "#111",
  },
  subtitleSuccess: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#666",
    textAlign: 'center',
    lineHeight: 22,
  }
});
