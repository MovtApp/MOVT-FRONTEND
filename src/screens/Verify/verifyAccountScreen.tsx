import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import BackButton from "@components/BackButton";
import CustomInput from "@components/CustomInput";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../@types/routes";

const VerifyAccountScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [code, setCode] = useState("");

  function handleResend() {
    // lógica para reenviar código
  }

  function handleVerify() {
    navigation.navigate("Verify", { screen: "VerifyPhoneScreen" });
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Verificação de email</Text>
        <Text style={styles.subtitle}>
          Digite o código enviado para seu email
        </Text>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>Código de verificação</Text>
          <CustomInput
            value={code}
            onChangeText={setCode}
            placeholder="Digite o código"
            maxLength={6}
            keyboardType="numeric"
          />
          <TouchableOpacity
            onPress={handleResend}
            style={{ marginBottom: 30, alignSelf: "flex-start" }}
          >
            <Text style={styles.resend}>Reenviar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyButtonText}>Verificar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerifyAccountScreen;

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
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  resend: {
    color: "#000",
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
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
