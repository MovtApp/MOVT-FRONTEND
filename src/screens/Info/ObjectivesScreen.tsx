import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import BackButton from "@components/BackButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Input } from "@components/Input";
import RootStackParamList from "@typings/routes";

const ObjectivesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleHeight = () => {
    navigation.navigate("Info", { screen: "LevelScreen" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Objetivos</Text>
        <Text style={styles.question}>Qual é seu objetivo?</Text>
        <Text style={styles.instruction}>
          Escolha o objetivo que melhor representa sua meta: perder peso, ganhar
          massa muscular ou manter o peso atual.
        </Text>

        <Input text="Perder peso" />
        <Input text="Ganhar peso" />
        <Input text="Ganho de massa muscular" />
        <Input text="Definir corpo" />
        <Input text="Condicionamento físico" />

        <Text style={styles.subtitle}>Outros</Text>
      </View>

      <TouchableOpacity style={styles.advanceButton} onPress={handleHeight}>
        <Text style={styles.advanceButtonText}>Avançar</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    marginTop: 30,
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  question: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    marginTop: 10,
    color: "#111",
    marginBottom: 8,
  },
  instruction: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  advanceButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 50,
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  objectiveButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 30,
  },
  objectiveButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});

export default ObjectivesScreen;
