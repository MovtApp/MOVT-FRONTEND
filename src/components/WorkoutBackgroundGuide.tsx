/**
 * WorkoutBackgroundGuide — guia de permissões de segundo plano para o treino.
 *
 * PROBLEMA QUE RESOLVE
 * Em ROMs agressivas (MIUI/Xiaomi, EMUI/Huawei, ColorOS/Oppo, FuntouchOS/Vivo…),
 * o SO mata o foreground service do rastreamento com a tela bloqueada — o treino
 * "para no meio e não volta". A isenção de otimização de bateria padrão do Android
 * NÃO cobre isso: esses fabricantes têm uma lista separada de "Autostart / iniciar
 * automaticamente". É exatamente o que o Strava resolve orientando o usuário a
 * liberar essas telas (ver dontkillmyapp.com).
 *
 * Este modal guia o usuário por 3 passos (bateria, Autostart, localização o tempo
 * todo), cada um abrindo a tela do sistema correta. É best-effort e não bloqueia
 * o treino — apenas maximiza a chance de o rastreio sobreviver à tela apagada.
 */
import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BatteryCharging, Rocket, MapPin, ShieldCheck, X, ChevronRight } from "lucide-react-native";
import {
  requestIgnoreBatteryOptimizations,
  openAutoStartSettings,
  openAppDetailsSettings,
} from "../services/movtService";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Fabricante em minúsculas (ex.: "xiaomi") — personaliza o texto do Autostart. */
  manufacturer?: string;
}

interface StepProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  onPress: () => void;
}

const Step: React.FC<StepProps> = ({ icon, title, desc, cta, onPress }) => (
  <View style={s.step}>
    <View style={s.stepIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={s.stepTitle}>{title}</Text>
      <Text style={s.stepDesc}>{desc}</Text>
      <TouchableOpacity style={s.stepCta} onPress={onPress} activeOpacity={0.85}>
        <Text style={s.stepCtaText}>{cta}</Text>
        <ChevronRight size={16} color="#365314" />
      </TouchableOpacity>
    </View>
  </View>
);

const oemLabel = (m?: string): string => {
  const x = (m || "").toLowerCase();
  if (x.includes("xiaomi") || x.includes("redmi") || x.includes("poco")) return "MIUI (Xiaomi)";
  if (x.includes("huawei") || x.includes("honor")) return "EMUI (Huawei)";
  if (x.includes("oppo") || x.includes("realme")) return "ColorOS (Oppo)";
  if (x.includes("vivo")) return "FuntouchOS (Vivo)";
  if (x.includes("samsung")) return "One UI (Samsung)";
  return "seu aparelho";
};

const WorkoutBackgroundGuide: React.FC<Props> = ({ visible, onClose, manufacturer }) => {
  const insets = useSafeAreaInsets();

  const openAutoStart = async () => {
    const opened = await openAutoStartSettings();
    // Se não existir tela de Autostart específica, o nativo já abriu os detalhes
    // do app como fallback — nada mais a fazer aqui.
    if (!opened) {
      // no-op: fallback já tratado no nativo
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={s.header}>
            <View style={s.headerIcon}>
              <ShieldCheck size={22} color="#365314" />
            </View>
            <Text style={s.title}>Não deixe o treino parar</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={8}>
              <X size={22} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <Text style={s.subtitle}>
            No {oemLabel(manufacturer)}, o sistema pode encerrar o rastreamento com a tela bloqueada.
            Libere estes 3 acessos para o MOVT continuar gravando sua rota até o fim — como no Strava.
          </Text>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 8 }}>
            <Step
              icon={<BatteryCharging size={22} color="#365314" />}
              title="1. Bateria sem restrição"
              desc="Impede o sistema de congelar o app para economizar bateria durante o treino."
              cta="Permitir"
              onPress={requestIgnoreBatteryOptimizations}
            />
            <Step
              icon={<Rocket size={22} color="#365314" />}
              title="2. Iniciar automaticamente (Autostart)"
              desc="Deixa o MOVT manter o serviço de rastreamento vivo em segundo plano."
              cta="Abrir Autostart"
              onPress={openAutoStart}
            />
            <Step
              icon={<MapPin size={22} color="#365314" />}
              title='3. Localização: "Permitir o tempo todo"'
              desc="Necessário para o GPS registrar o percurso com a tela apagada."
              cta="Abrir ajustes do app"
              onPress={() => {
                // Linking.openSettings abre os detalhes do app; se falhar, usa o nativo.
                Linking.openSettings().catch(() => openAppDetailsSettings());
              }}
            />
          </ScrollView>

          <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.9}>
            <Text style={s.doneText}>Pronto, entendi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "900", color: "#0F172A", letterSpacing: -0.4 },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, color: "#475569", lineHeight: 19, marginBottom: 16 },
  step: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F7FEE7",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 2 },
  stepDesc: { fontSize: 12, color: "#64748B", lineHeight: 17, marginBottom: 8 },
  stepCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    backgroundColor: "#ECFCCB",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  stepCtaText: { fontSize: 12, fontWeight: "800", color: "#365314" },
  doneBtn: {
    marginTop: 14,
    backgroundColor: "#192126",
    borderRadius: 18,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});

export default WorkoutBackgroundGuide;
