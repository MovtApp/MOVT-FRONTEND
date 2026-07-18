import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import BackButton from "@components/BackButton";
import { useAuth } from "@contexts/AuthContext";
import { useGoogleOAuth } from "@hooks/useGoogleOAuth";
import { api } from "@services/api";

/**
 * Tela dedicada da conta Google (acessada por Configurações › Conta Google).
 *
 * Concentra o vínculo/desvínculo do Google usando exatamente o mesmo fluxo OAuth
 * do login (hook compartilhado). O vínculo em si é decidido pelo backend, que
 * valida o token, confere o e-mail e rejeita se já estiver ligado a outro
 * usuário. Aqui só refletimos o resultado no estado local.
 */
const GoogleAccountScreen: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { startGoogleOAuth } = useGoogleOAuth();
  const [linking, setLinking] = useState(false);

  const isGoogleLinked = !!user?.supabaseUserId;
  const linkedEmail = user?.email;

  const handleConnect = async () => {
    if (linking) return;

    // Vincular — abre o OAuth; o hook valida a sessão do Supabase antes de voltar.
    try {
      setLinking(true);
      const result = await startGoogleOAuth();
      if (result.status === "cancel") return;

      const { access_token, supabaseUser } = result;
      await api.post("/auth/social-link", {
        access_token,
        supabase_uid: supabaseUser.id,
        email: supabaseUser.email,
      });
      await updateUser({ supabaseUserId: supabaseUser.id });
      Alert.alert("Pronto", "Sua conta Google foi conectada com sucesso.");
    } catch (error: any) {
      const code = error?.response?.data?.error;
      let message =
        error?.response?.data?.message ||
        "Não foi possível conectar a conta Google. Tente novamente.";
      if (code === "EMAIL_MISMATCH") {
        message =
          "O e-mail da conta Google é diferente do e-mail da sua conta MOVT. Use a conta Google com o mesmo e-mail.";
      } else if (code === "ALREADY_LINKED_OTHER") {
        message = "Esta conta Google já está vinculada a outro usuário MOVT.";
      }
      Alert.alert("Erro", message);
    } finally {
      setLinking(false);
    }
  };

  const handleDisconnect = () => {
    if (linking) return;

    // Desvincular — pede confirmação, já que o usuário perde o login social.
    Alert.alert(
      "Desconectar conta Google",
      "Você não poderá mais entrar com o Google até conectar novamente. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desconectar",
          style: "destructive",
          onPress: async () => {
            try {
              setLinking(true);
              await api.post("/auth/social-unlink");
              await updateUser({ supabaseUserId: null });
              Alert.alert("Pronto", "Sua conta Google foi desconectada.");
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.response?.data?.message ||
                  "Não foi possível desconectar a conta Google. Tente novamente."
              );
            } finally {
              setLinking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Conta Google</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.description}>
            Conecte sua conta Google para entrar no MOVT com apenas um toque, sem
            precisar digitar e-mail e senha. A conta Google precisa ter o mesmo
            e-mail da sua conta MOVT.
          </Text>

          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.logoCircle}>
                <AntDesign name="google" size={22} color="#EA4335" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Google</Text>
                <Text style={styles.cardStatus} numberOfLines={1}>
                  {isGoogleLinked ? linkedEmail || "Conectado" : "Não conectado"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                isGoogleLinked ? styles.disconnectButton : styles.connectButton,
                linking && styles.buttonDisabled,
              ]}
              onPress={isGoogleLinked ? handleDisconnect : handleConnect}
              disabled={linking}
              activeOpacity={0.8}
            >
              {linking ? (
                <ActivityIndicator
                  size="small"
                  color={isGoogleLinked ? "#EF4444" : "#fff"}
                />
              ) : (
                <Text
                  style={[
                    styles.actionButtonText,
                    isGoogleLinked ? styles.disconnectText : styles.connectText,
                  ]}
                >
                  {isGoogleLinked ? "Desconectar" : "Conectar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#192126",
  },
  cardStatus: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 116,
    minHeight: 40,
  },
  connectButton: {
    backgroundColor: "#22C55E",
  },
  disconnectButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  connectText: {
    color: "#fff",
  },
  disconnectText: {
    color: "#EF4444",
  },
});

export default GoogleAccountScreen;
