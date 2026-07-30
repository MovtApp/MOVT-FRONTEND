import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackButton from "../../components/BackButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../@types/routes";
import { useNavigation } from "@react-navigation/native";
import CustomInput from "../../components/CustomInput";
import { userService } from "../../services/userService";
import { notifyError } from "../../utils/notify";

const UsernameScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const validate = (val: string) => {
    if (val.length === 0) return null;
    if (val.length < 3) return "Mínimo 3 caracteres";
    if (val.length > 30) return "Máximo 30 caracteres";
    if (!/^[a-z0-9_.]+$/.test(val))
      return "Apenas letras minúsculas, números, . e _";
    return null;
  };

  useEffect(() => {
    const err = validate(username);
    if (err) {
      setError(err);
      setIsValid(false);
      setChecking(false);
    } else if (username.length >= 3) {
      setError(null);
      setChecking(true);
      const timer = setTimeout(async () => {
        try {
          const res = await userService.checkUsernameAvailable(username);
          if (!res.available) {
            setError("Este nome de usuário já está em uso.");
            setIsValid(false);
          } else {
            setError(null);
            setIsValid(true);
          }
        } catch (e) {
          console.error("Erro ao checar username:", e);
        } finally {
          setChecking(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setError(null);
      setIsValid(false);
      setChecking(false);
    }
  }, [username]);

  const handleNext = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await userService.updateField("username", username);
      navigation.navigate("Info", { screen: "ProfileDetailsScreen" });
    } catch (e: any) {
      console.error("Erro ao salvar username:", e);
      const msg =
        e?.response?.data?.error || "Não foi possível salvar o username.";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>Nome de usuário</Text>
        <Text style={styles.subtitle}>
          Escolha um nome único para seu perfil. Você poderá alterá-lo depois.
        </Text>
        <View style={{ marginTop: 30 }}>
          <CustomInput
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().trim())}
            placeholder="ex: joao.silva"
            label="Username"
            error={error || undefined}
            autoCapitalize="none"
            autoCorrect={false}
            rightIcon={
              checking ? (
                <ActivityIndicator size="small" color="#666" />
              ) : null
            }
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          (!isValid || loading) && styles.disabledButton,
          { marginBottom: Platform.OS === "android" ? insets.bottom + 16 : 50 },
        ]}
        onPress={handleNext}
        disabled={!isValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Avançar</Text>
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
    height: 50,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});

export default UsernameScreen;
