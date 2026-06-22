import { MessageCircle, Heart, MessageSquare, UserPlus } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@components/BackButton";
import { api } from "@services/api";
import { toastError } from "@/utils/notify";

// Espelha as colunas de `notification_prefs` no backend.
interface Prefs {
  push_chat: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_follows: boolean;
}

const DEFAULT_PREFS: Prefs = {
  push_chat: true,
  push_likes: true,
  push_comments: true,
  push_follows: true,
};

const NotificationPreferencesScreen: React.FC = () => {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

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

  // Atualização otimista: liga/desliga na hora e persiste; reverte se falhar.
  const toggle = useCallback(
    async (key: keyof Prefs, value: boolean) => {
      const previous = prefs;
      const next = { ...prefs, [key]: value };
      setPrefs(next);
      try {
        await api.put("/notifications/preferences", { [key]: value });
      } catch {
        setPrefs(previous);
        toastError("Não foi possível salvar", "Tente novamente.");
      }
    },
    [prefs]
  );

  const Row = ({
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

            <Row
              icon={MessageCircle}
              label="Mensagens"
              description="Novas mensagens no chat"
              value={prefs.push_chat}
              onChange={(v) => toggle("push_chat", v)}
            />
            <Row
              icon={Heart}
              label="Curtidas"
              description="Quando curtirem suas publicações ou dietas"
              value={prefs.push_likes}
              onChange={(v) => toggle("push_likes", v)}
            />
            <Row
              icon={MessageSquare}
              label="Comentários"
              description="Quando comentarem suas publicações ou dietas"
              value={prefs.push_comments}
              onChange={(v) => toggle("push_comments", v)}
            />
            <Row
              icon={UserPlus}
              label="Seguidores"
              description="Quando aceitarem sua solicitação para seguir"
              value={prefs.push_follows}
              onChange={(v) => toggle("push_follows", v)}
            />
          </ScrollView>
        )}
      </View>
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
  intro: { fontSize: 14, color: "#64748B", marginBottom: 12 },
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
});

export default NotificationPreferencesScreen;
