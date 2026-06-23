import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "@components/BackButton";
import { SelectButton } from "@components/SelectButton";
import { useAuth } from "@contexts/AuthContext";
import { userService } from "@services/userService";
import { RootStackParamList } from "@typings/routes";

// Lista padronizada de especialidades (CNPJ). Alimenta o filtro de especialidade
// do app (specialty), por isso mantemos um conjunto fixo em vez de texto livre.
const SPECIALTIES = [
  "Educador Físico",
  "Emagrecimento",
  "Hipertrofia",
  "Funcional",
  "Crossfit",
  "Pilates",
  "Yoga",
  "Corrida",
  "Nutrição Esportiva",
  "Reabilitação",
];

const ProfileDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const isCompany = user?.documentType === "CNPJ";

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [description, setDescription] = useState<string>((user as any)?.bio || "");
  const [saving, setSaving] = useState(false);

  const toggleSpecialty = (item: string) => {
    setSpecialties((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const goToPersonalData = () => {
    navigation.navigate("Info", { screen: "GenderScreen" });
  };

  const handleAdvance = async () => {
    if (isCompany && specialties.length === 0) {
      Alert.alert("Selecione uma especialidade", "Escolha pelo menos uma área de atuação.");
      return;
    }

    setSaving(true);
    try {
      if (isCompany) {
        await userService.updateSpecialty(specialties);
        updateUser({ especialidades: specialties } as any);
      } else if (description.trim()) {
        // Descrição é opcional para CPF: só persiste se o usuário escreveu algo.
        await userService.updateBio(description.trim());
        updateUser({ bio: description.trim() } as any);
      }
      goToPersonalData();
    } catch (err) {
      console.error("Erro ao salvar dados do perfil:", err);
      Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.topSection}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton autoTopInset />

        {isCompany ? (
          <>
            <Text style={styles.title}>Especialidade</Text>
            <Text style={styles.question}>Quais são suas áreas de atuação?</Text>
            <Text style={styles.instruction}>
              Selecione uma ou mais especialidades. Isso ajuda os alunos a te encontrarem.
            </Text>

            {SPECIALTIES.map((item) => (
              <SelectButton
                key={item}
                text={item}
                onPress={() => toggleSpecialty(item)}
                style={specialties.includes(item) ? { backgroundColor: "#BBF246" } : {}}
              />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.title}>Sobre você</Text>
            <Text style={styles.question}>Escreva uma descrição</Text>
            <Text style={styles.instruction}>
              Conte um pouco sobre você. Esse passo é opcional — você pode deixar em branco.
            </Text>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Ex.: Apaixonado por corrida e vida saudável..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{description.length}/300</Text>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.advanceButton,
          saving && styles.advanceButtonDisabled,
          { marginBottom: Platform.OS === "android" ? insets.bottom + 16 : 50 },
        ]}
        onPress={handleAdvance}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.advanceButtonText}>Avançar</Text>
        )}
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
  descriptionInput: {
    marginTop: 22,
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: "#F5F6F9",
    padding: 16,
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#192126",
  },
  counter: {
    alignSelf: "flex-end",
    marginTop: 6,
    color: "#94A3B8",
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
  },
  advanceButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  advanceButtonDisabled: {
    opacity: 0.6,
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});

export default ProfileDetailsScreen;
