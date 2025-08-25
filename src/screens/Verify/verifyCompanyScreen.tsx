import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import BackButton from "@components/BackButton";
import { RootStackParamList } from "@/@types/routes";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SearchInput from "@components/SearchInput";
import { Search } from "lucide-react-native";

const VerifyCompanyScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleVerify = () => {
    navigation.navigate("Verify", { screen: "VerifyCNPJScreen" });
  };

  const [search, setSearch] = useState("");

  function handleResend() {
    // lógica para reenviar SMS
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Validar sua empresa</Text>
        <Text style={styles.subtitle}>
          Digite o número do CNPJ da empresa para validar as informações
          cadastrais.
        </Text>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>Consulta de empresa ou CNPJ</Text>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Procurar"
            icon={<Search size={24} color="#888" />}
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

export default VerifyCompanyScreen;

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
