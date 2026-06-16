import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock, Check, Sparkles } from "lucide-react-native";
import { navigateToPlans } from "../services/navigationRef";
import { FEATURE_LABELS, type GatedFeature } from "../config/planLimits";

interface UpgradeSheetContextValue {
  openUpgrade: (feature?: GatedFeature) => void;
}

const UpgradeSheetContext = createContext<UpgradeSheetContextValue>({
  openUpgrade: () => {},
});

export const useUpgradeSheet = () => useContext(UpgradeSheetContext);

const BENEFITS = [
  "Treinos e dietas ilimitados",
  "Todos os dados de saúde (batimentos, sono, ciclismo)",
  "Desafios e comparativo Expectativa x Realidade",
  "Agendamentos e comunidades sem limite",
  "Sem anúncios ou interrupções",
];

/**
 * Provider do sheet global de upgrade. Qualquer tela chama
 * useUpgradeSheet().openUpgrade(feature?) para abrir uma chamada profissional
 * de conversão do plano free para Premium/Família.
 */
export const UpgradeSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [feature, setFeature] = useState<GatedFeature | null>(null);
  const insets = useSafeAreaInsets();

  const openUpgrade = useCallback((f?: GatedFeature) => {
    setFeature(f ?? null);
    sheetRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleSubscribe = useCallback(() => {
    sheetRef.current?.dismiss();
    // Deixa o sheet fechar antes de navegar (evita conflito de gesto/transição).
    setTimeout(() => navigateToPlans(), 220);
  }, []);

  const value = useMemo(() => ({ openUpgrade }), [openUpgrade]);

  const featureLabel = feature ? FEATURE_LABELS[feature] : null;

  return (
    <UpgradeSheetContext.Provider value={value}>
      {children}

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["70%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: "#CBD5E1" }}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.badge}>
            <Lock size={28} color="#192126" />
          </View>

          <View style={styles.tag}>
            <Sparkles size={12} color="#192126" />
            <Text style={styles.tagText}>MOVT PREMIUM</Text>
          </View>

          <Text style={styles.title}>
            {featureLabel ? `${featureLabel} é Premium` : "Desbloqueie tudo no MOVT"}
          </Text>
          <Text style={styles.subtitle}>
            Seu plano gratuito tem acesso limitado. Faça upgrade e leve seus resultados a sério —
            sem travas, sem limites.
          </Text>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Check size={14} color="#192126" />
                </View>
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleSubscribe}>
            <Text style={styles.ctaText}>Ver planos</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} style={styles.laterBtn}>
            <Text style={styles.laterText}>Agora não</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </UpgradeSheetContext.Provider>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: "center",
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  tagText: { fontSize: 11, fontWeight: "800", color: "#192126", letterSpacing: 0.5 },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 22,
    color: "#192126",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  benefits: { alignSelf: "stretch", gap: 12, marginBottom: 24 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1, fontFamily: "Rubik_500Medium", fontSize: 14, color: "#1E293B" },
  cta: {
    alignSelf: "stretch",
    backgroundColor: "#192126",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontFamily: "Rubik_700Bold", fontSize: 16 },
  laterBtn: { paddingVertical: 12, marginTop: 4 },
  laterText: { color: "#94A3B8", fontFamily: "Rubik_500Medium", fontSize: 14 },
});

export default UpgradeSheetProvider;
