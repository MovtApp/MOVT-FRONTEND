import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import BackButton from "@components/BackButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import RootStackParamList from "@/@types/routes";
import { useNavigation } from "@react-navigation/native";
import SelectInput from "@components/SelectInput";
import { useState } from "react";

const GenderScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [gender, setGender] = useState<string | null>(null);

  const handleAge = () => {
    navigation.navigate("Info", { screen: "AgeScreen" });
  };

  const genderOptions = [
    { label: "Masculino", value: "masculino" },
    { label: "Feminino", value: "feminino" },
    { label: "Outro", value: "outro" },
    { label: "Prefiro não responder", value: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Gênero</Text>
        <Text style={styles.subtitle}>
          Por gentileza, informe sua identidade de gênero ou selecione prefiro
          não responder.
        </Text>
        <View style={{ marginTop: 30 }}>
          <SelectInput
            value={gender}
            onChange={setGender}
            placeholder="Selecione"
            options={genderOptions}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleAge}>
        <Text style={styles.verifyButtonText}>Verificar</Text>
      </TouchableOpacity>
    </View>
  );
};

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
});

export default GenderScreen;
