import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Lock } from "lucide-react-native";
import { usePlanAccess } from "../hooks/usePlanAccess";

interface PremiumGateProps {
  /** Quando true, mostra o cadeado e esmaece o conteúdo. */
  blocked: boolean;
  children: React.ReactNode;
  /** Texto curto do recurso (ex.: "Planos de dieta"). */
  label?: string;
  /** Mensagem custom; se omitido, usa um texto padrão com o label. */
  message?: string;
  /** Ação do botão; padrão = abrir a tela de Planos. */
  onUpgrade?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Esconde o botão (só cadeado), p/ casos compactos. */
  compact?: boolean;
}

/**
 * Embrulha um conteúdo premium. Para o plano free (blocked=true), exibe o
 * conteúdo ESMAECIDO + cadeado + CTA "Desbloquear com Premium" que leva à tela
 * de Planos. Para premium/família (blocked=false), renderiza normal.
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({
  blocked,
  children,
  label,
  message,
  onUpgrade,
  style,
  compact = false,
}) => {
  const { goPremium } = usePlanAccess();

  if (!blocked) return <>{children}</>;

  const handleUpgrade = onUpgrade || goPremium;
  const text = message || `${label || "Este recurso"} é exclusivo do plano Premium.`;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Conteúdo esmaecido e não-interativo */}
      <View style={styles.dimmed} pointerEvents="none">
        {children}
      </View>

      {/* Overlay com cadeado + CTA (captura o toque) */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={0.85}
        onPress={handleUpgrade}
      >
        <View style={styles.lockBadge}>
          <Lock size={compact ? 18 : 22} color="#192126" />
        </View>
        {!compact && (
          <>
            <Text style={styles.title}>Recurso Premium</Text>
            <Text style={styles.subtitle}>{text}</Text>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Desbloquear com Premium</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
  },
  dimmed: {
    opacity: 0.35,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  lockBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#192126",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 280,
  },
  cta: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  ctaText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
  },
});

export default PremiumGate;
