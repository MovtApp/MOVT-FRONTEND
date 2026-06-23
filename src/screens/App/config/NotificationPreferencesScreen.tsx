import { MessageCircle, Heart, MessageSquare, UserPlus, EyeOff, Moon, Clock } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Localization from "expo-localization";
import BackButton from "@components/BackButton";
import { api } from "@services/api";
import { toastError } from "@/utils/notify";

// Espelha as colunas de `notification_prefs` no backend.
interface Prefs {
  push_chat: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_follows: boolean;
  hide_message_preview: boolean;
  quiet_hours_enabled: boolean;
  quiet_start: string | null;
  quiet_end: string | null;
  timezone: string | null;
}

const DEVICE_TZ = Localization.getCalendars?.()[0]?.timeZone || "America/Sao_Paulo";

const DEFAULT_PREFS: Prefs = {
  push_chat: true,
  push_likes: true,
  push_comments: true,
  push_follows: true,
  hide_message_preview: false,
  quiet_hours_enabled: false,
  quiet_start: "22:00",
  quiet_end: "07:00",
  timezone: DEVICE_TZ,
};

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const parseTime = (s?: string | null) => {
  const [h, m] = (s || "22:00").split(":").map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const NotificationPreferencesScreen: React.FC = () => {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<null | "start" | "end">(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await api.get("/notifications/preferences");
        if (active && resp.data?.data) {
          setPrefs({ ...DEFAULT_PREFS, ...resp.data.data });
        }
      } catch {
        // Mantém defaults (tudo ligado) se a leitura falhar.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Atualização otimista: aplica na hora e persiste; reverte se falhar. Envia
  // sempre o fuso do device junto, para o backend calcular o horário silencioso.
  const save = useCallback(
    async (partial: Partial<Prefs>) => {
      const previous = prefs;
      const next = { ...prefs, ...partial };
      setPrefs(next);
      try {
        await api.put("/notifications/preferences", { ...partial, timezone: DEVICE_TZ });
      } catch {
        setPrefs(previous);
        toastError("Não foi possível salvar", "Tente novamente.");
      }
    },
    [prefs]
  );

  const onConfirmTime = (date: Date) => {
    const value = fmtTime(date);
    if (picker === "start") save({ quiet_start: value });
    else if (picker === "end") save({ quiet_end: value });
    setPicker(null);
  };

  const ToggleRow = ({
    icon: Icon,
    label,
    description,
    value,
    onChange,
  }: {
    icon: any;
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={22} color="#192126" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
        thumbColor="#F9FAFB"
      />
    </View>
  );

  const TimeRow = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.timeRow} onPress={onPress} activeOpacity={0.7}>
      <Clock size={18} color="#64748B" />
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Notificações</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#192126" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.intro}>
              Escolha o que você quer receber como notificação no seu dispositivo.
            </Text>

            <Text style={styles.sectionTitle}>Atividade</Text>
            <ToggleRow
              icon={MessageCircle}
              label="Mensagens"
              description="Novas mensagens no chat"
              value={prefs.push_chat}
              onChange={(v) => save({ push_chat: v })}
            />
            <ToggleRow
              icon={Heart}
              label="Curtidas"
              description="Quando curtirem suas publicações ou dietas"
              value={prefs.push_likes}
              onChange={(v) => save({ push_likes: v })}
            />
            <ToggleRow
              icon={MessageSquare}
              label="Comentários"
              description="Quando comentarem suas publicações ou dietas"
              value={prefs.push_comments}
              onChange={(v) => save({ push_comments: v })}
            />
            <ToggleRow
              icon={UserPlus}
              label="Seguidores"
              description="Quando aceitarem sua solicitação para seguir"
              value={prefs.push_follows}
              onChange={(v) => save({ push_follows: v })}
            />

            <Text style={styles.sectionTitle}>Privacidade</Text>
            <ToggleRow
              icon={EyeOff}
              label="Ocultar prévia da mensagem"
              description="Mostra quem enviou, mas esconde o texto na notificação"
              value={prefs.hide_message_preview}
              onChange={(v) => save({ hide_message_preview: v })}
            />

            <Text style={styles.sectionTitle}>Horário silencioso</Text>
            <ToggleRow
              icon={Moon}
              label="Não perturbe"
              description="Não envia notificações dentro do intervalo escolhido"
              value={prefs.quiet_hours_enabled}
              onChange={(v) => save({ quiet_hours_enabled: v })}
            />
            {prefs.quiet_hours_enabled && (
              <View style={styles.timeGroup}>
                <TimeRow label="Início" value={prefs.quiet_start || "22:00"} onPress={() => setPicker("start")} />
                <TimeRow label="Fim" value={prefs.quiet_end || "07:00"} onPress={() => setPicker("end")} />
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <DateTimePickerModal
        isVisible={picker !== null}
        mode="time"
        locale="pt-BR"
        date={parseTime(picker === "end" ? prefs.quiet_end : prefs.quiet_start)}
        onConfirm={onConfirmTime}
        onCancel={() => setPicker(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#192126" },
  headerPlaceholder: { width: 44 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingBottom: 40, paddingTop: 8 },
  intro: { fontSize: 14, color: "#64748B", marginBottom: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
    marginTop: 22,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 16, fontWeight: "600", color: "#192126" },
  rowDescription: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  timeGroup: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 14,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  timeLabel: { flex: 1, fontSize: 15, color: "#192126", marginLeft: 10 },
  timeValue: { fontSize: 16, fontWeight: "700", color: "#192126" },
});

export default NotificationPreferencesScreen;
