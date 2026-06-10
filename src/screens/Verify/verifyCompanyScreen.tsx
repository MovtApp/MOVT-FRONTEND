import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from "react-native";
import BackButton from "../../components/BackButton";
import CustomInput from "../../components/CustomInput";
import { RootStackParamList } from "../../@types/routes";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "@/services/api";

const VerifyCompanyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  // Máscara 00.000.000/0000-00
  function formatCNPJ(value: string) {
    let cleaned = value.replace(/\D/g, "").slice(0, 14);
    let formatted = "";
    if (cleaned.length > 0) formatted = cleaned.slice(0, 2);
    if (cleaned.length >= 3) formatted += "." + cleaned.slice(2, 5);
    if (cleaned.length >= 6) formatted += "." + cleaned.slice(5, 8);
    if (cleaned.length >= 9) formatted += "/" + cleaned.slice(8, 12);
    if (cleaned.length >= 13) formatted += "-" + cleaned.slice(12, 14);
    return formatted;
  }

  const handleVerify = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      Alert.alert("CNPJ inválido", "Digite os 14 dígitos do CNPJ da empresa.");
      return;
    }

    setLoading(true);
    try {
      // 1. Valida o CNPJ na base da Receita Federal (BrasilAPI)
      await api.get(`/verify/cnpj/${digits}`);

      // 2. Persiste o CNPJ nos dados profissionais do usuário
      await api.put("/user/professional-data", { cnpj: digits });

      // 3. Segue para a validação do CREF
      navigation.navigate("Verify", { screen: "VerifyCrefScreen" });
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível validar o CNPJ. Tente novamente.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Validar sua empresa</Text>
        <Text style={styles.subtitle}>
          Digite o número do CNPJ da empresa para validar as informações cadastrais.
        </Text>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>CNPJ</Text>
          <CustomInput
            value={cnpj}
            onChangeText={(text: string) => setCnpj(formatCNPJ(text))}
            placeholder="00.000.000/0000-00"
            keyboardType="numeric"
            maxLength={18}
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
          <Text style={styles.verifyButtonText}>Verificar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VerifyCompanyScreen;

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
