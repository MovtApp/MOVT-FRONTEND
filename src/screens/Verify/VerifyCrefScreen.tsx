import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import BackButton from "@components/BackButton";
import CustomInput from "@components/CustomInput";
import { RootStackParamList } from "@/@types/routes";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const VerifyCrefScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleVerify = () => {
    navigation.navigate("Info", { screen: "GenderScreen" });
  };

  const [code, setCode] = useState("");

  // Função para aplicar a máscara SP/08754-G
  function maskCrefInput(text: string) {
    // Remove tudo que não for letra ou número
    let value = text.replace(/[^a-zA-Z0-9]/g, "");

    // Pega só as duas primeiras letras e transforma em maiúsculo
    let letters1 = value
      .slice(0, 2)
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();
    // Pega só os próximos cinco números
    let numbers = value.slice(2, 7).replace(/[^0-9]/g, "");
    // Pega só a última letra e transforma em maiúsculo
    let letter2 = value
      .slice(7, 8)
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();

    let masked = letters1;
    if (letters1.length === 2 && (numbers.length > 0 || value.length > 2)) {
      masked += "/";
    }
    masked += numbers;
    if (numbers.length === 5 && (letter2.length > 0 || value.length > 7)) {
      masked += "-";
    }
    masked += letter2;

    // Limita ao tamanho máximo do formato
    return masked.slice(0, 10);
  }

  function handleResend() {
    // lógica para reenviar SMS
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Validar seu cref</Text>
        <Text style={styles.subtitle}>
          Digite o número do registro CREF para confirmar a identidade do
          profissional de Educação Física.
        </Text>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>Código de verificação</Text>
          <CustomInput
            value={code}
            onChangeText={(text) => setCode(maskCrefInput(text))}
            placeholder="SP/08754-G"
            maxLength={10}
            keyboardType="default"
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

export default VerifyCrefScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
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
  resend: {
    color: "#000",
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
    alignSelf: "flex-start",
  },
});
