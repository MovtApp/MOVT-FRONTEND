import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock } from "lucide-react-native";
import BackButton from "./BackButton";
import { usePlanAccess } from "../hooks/usePlanAccess";

interface PremiumLockedScreenProps {
  title: string; // título no header (ex.: "Planos de Dieta")
  message?: string; // descrição do bloqueio
  /** Destino do back; padrão = voltar. */
  backTo?: { name: string; params?: Record<string, unknown> };
}

/**
 * Tela cheia de bloqueio para recursos exclusivos de Premium/Família.
 * Usada via early-return nas telas gated do plano free.
 */
export const PremiumLockedScreen: React.FC<PremiumLockedScreenProps> = ({
  title,
  message,
  backTo,
}) => {
  const { goPremium } = usePlanAccess();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <BackButton to={backTo} />
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 46 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.lockBadge}>
          <Lock size={40} color="#192126" />
        </View>
        <Text style={styles.title}>Recurso Premium</Text>
        <Text style={styles.message}>
          {message || `${title} faz parte dos planos Premium e Família.`}
        </Text>

        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={goPremium}>
          <Text style={styles.ctaText}>Ver planos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#192126" },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  lockBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 22,
    color: "#192126",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Rubik_400Regular",
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  cta: {
    backgroundColor: "#192126",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontFamily: "Rubik_500Medium", fontSize: 16 },
});

export default PremiumLockedScreen;
