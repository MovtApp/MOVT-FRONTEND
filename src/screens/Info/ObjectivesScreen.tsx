import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifyError } from "../../utils/notify";
import BackButton from "@components/BackButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SelectButton } from "@components/SelectButton";
import { RootStackParamList } from "@typings/routes";

const ObjectivesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const isEditing = route.params?.isEditing;

  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(["Manter peso"]);

  const objectives = [
    "Perder peso",
    "Ganhar peso",
    "Ganho de massa muscular",
    "Definir corpo",
    "Condicionamento físico",
  ];

  useEffect(() => {
    const loadSavedObjective = async () => {
      try {
        const saved = await AsyncStorage.getItem("@MOVT:onboarding:objective");
        if (saved) {
          let savedList: string[] = [];
          if (saved.startsWith("[") && saved.endsWith("]")) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                savedList = parsed;
              } else {
                savedList = [saved];
              }
            } catch {
              savedList = [saved];
            }
          } else {
            savedList = saved
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }

          // Filtra o que é padrão
          const standard = savedList.filter((item) => objectives.includes(item));

          if (standard.length > 0) {
            setSelectedObjectives(standard);
          } else {
            setSelectedObjectives(["Manter peso"]);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar objetivo:", e);
      }
    };

    loadSavedObjective();
  }, []);

  const handleSelectObjective = (obj: string) => {
    setSelectedObjectives((prev) => {
      if (prev.includes(obj)) {
        const next = prev.filter((item) => item !== obj);
        return next;
      } else {
        return [...prev, obj];
      }
    });
  };

  const handleAdvance = async () => {
    try {
      if (selectedObjectives.length === 0) {
        Alert.alert("Aviso", "Por favor, selecione pelo menos um objetivo.");
        return;
      }

      const joinedString = selectedObjectives.join(", ");
      await AsyncStorage.setItem("@MOVT:onboarding:objective", joinedString);

      if (isEditing) {
        Alert.alert("Sucesso", "Objetivos atualizados com sucesso!");
        navigation.goBack();
      } else {
        navigation.navigate("Info", { screen: "LevelScreen" });
      }
    } catch (e) {
      console.error("Erro ao salvar objetivos:", e);
      notifyError("Não foi possível salvar. Tente novamente.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>{isEditing ? "Editar Objetivos" : "Objetivos"}</Text>
        <Text style={styles.question}>Qual é seu objetivo?</Text>
        <Text style={styles.instruction}>
          {isEditing
            ? "Selecione um ou mais objetivos que melhor representam suas metas atuais."
            : "Escolha um ou mais objetivos que melhor representam suas metas."}
        </Text>

        {objectives.map((obj) => (
          <SelectButton
            key={obj}
            text={obj}
            onPress={() => handleSelectObjective(obj)}
            style={selectedObjectives.includes(obj) ? { backgroundColor: "#BBF246" } : {}}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.advanceButton,
          { marginBottom: Platform.OS === "android" ? insets.bottom + 16 : 50 },
        ]}
        onPress={handleAdvance}
      >
        <Text style={styles.advanceButtonText}>{isEditing ? "Salvar Alterações" : "Avançar"}</Text>
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
    marginTop: 20,
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
