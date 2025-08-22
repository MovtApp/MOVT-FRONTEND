import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import BackButton from "../../components/BackButton";
import SocialButton from "../../components/SocialButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../@types/routes";
import CustomInput from "../../components/CustomInput";
import { Eye, EyeOff } from "lucide-react-native";

export const SignInScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function handleSignup() {
    navigation.navigate("Auth", { screen: "SignUpScreen" });
  }

  function handleVerifyAccount() {
    navigation.navigate("Verify", { screen: "VerifyAccountScreen" });
  }

  function handleRecovery() {
    navigation.navigate("Verify", { screen: "RecoveryScreen" });
  }

  // Estados locais para os campos (opcional, já que não há validação)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
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
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleVerifyAccount}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
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
    paddingTop: 60,
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
