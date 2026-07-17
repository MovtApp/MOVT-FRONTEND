import {
  ChevronRight,
  User,
  Radio,
  Calendar,
  Bell,
  Key,
  Target,
  HelpCircle,
  PhoneCall,
  UserStar,
  ClipboardMinus,
  BookText,
  Link2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";
import { useAuth } from "@contexts/AuthContext";
import { useGoogleOAuth } from "@hooks/useGoogleOAuth";
import { api } from "@services/api";

const ConfigScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuth();
  const { startGoogleOAuth } = useGoogleOAuth();
  const [privateAccount, setPrivateAccount] = useState(true);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const isGoogleLinked = !!user?.supabaseUserId;

  // Conecta/desconecta a conta Google usando exatamente o mesmo fluxo OAuth do
  // login (hook compartilhado). O vínculo em si é decidido pelo backend, que
  // valida o token, confere o e-mail e rejeita se já estiver ligado a outro
  // usuário. Aqui só refletimos o resultado no estado local.
  const handleToggleGoogleLink = async () => {
    if (linkingGoogle) return;

    // Desvincular — pede confirmação, já que o usuário perde o login social.
    if (isGoogleLinked) {
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
                setLinkingGoogle(true);
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
                setLinkingGoogle(false);
              }
            },
          },
        ]
      );
      return;
    }

    // Vincular — abre o OAuth; o hook valida a sessão do Supabase antes de voltar.
    try {
      setLinkingGoogle(true);
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
      setLinkingGoogle(false);
    }
  };

  const SettingItem = ({
    icon: Icon,
    label,
    onPress,
    hasSwitch = false,
    switchValue = false,
    onSwitchChange = () => {},
    iconColor,
    hideChevron = false,
  }: {
    icon: any;
    label: string;
    onPress?: () => void;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
    iconColor?: string;
    hideChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onPress}
      disabled={hasSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Icon size={24} color={iconColor || "#000"} />
        <Text style={[styles.itemLabel, iconColor ? { color: iconColor } : {}]}>{label}</Text>
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
          thumbColor="#F9FAFB"
        />
      ) : (
        !hideChevron && <ChevronRight size={24} color={iconColor || "#000"} />
      )}
    </TouchableOpacity>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const Separator = () => <View style={styles.separator} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Minha conta */}
          <SectionTitle title="Minha conta" />
          <SettingItem
            icon={User}
            label="Perfil"
            onPress={() => navigation.navigate("ProfilePFScreen")}
          />
          <SettingItem
            icon={Radio}
            label="Minha assinatura"
            onPress={() => navigation.navigate("PlanScreen")}
          />
          <SettingItem
            icon={Calendar}
            label="Meus agendamentos"
            onPress={() => navigation.navigate("Appointments")}
          />
          <SettingItem
            icon={Link2}
            label={
              linkingGoogle
                ? "Processando..."
                : isGoogleLinked
                  ? "Desconectar conta Google"
                  : "Conectar conta Google"
            }
            onPress={handleToggleGoogleLink}
          />

          <Separator />

          {/* Notificações */}
          <SectionTitle title="Notificações" />
          <SettingItem
            icon={Bell}
            label="Preferências de notificação"
            onPress={() => navigation.navigate("NotificationPreferencesScreen")}
          />

          <Separator />

          {/* Privacidade */}
          <SectionTitle title="Privacidade" />
          <SettingItem
            icon={User}
            label="Conta privada"
            hasSwitch
            switchValue={privateAccount}
            onSwitchChange={setPrivateAccount}
          />

          <SettingItem
            icon={Key}
            label="Redefinir de senha"
            onPress={() => navigation.navigate("Verify", { screen: "RecoveryScreen" })}
          />
          <SettingItem
            icon={Target}
            label="Editar objetivos"
            onPress={() =>
              navigation.navigate("Info", {
                screen: "ObjectivesScreen",
                params: { isEditing: true },
              })
            }
          />

          <Separator />

          {/* Ajuda e suporte */}
          <SectionTitle title="Ajuda e suporte" />
          <SettingItem
            icon={HelpCircle}
            label="FAQ"
            onPress={() => navigation.navigate("FAQScreen")}
          />
          <SettingItem
            icon={PhoneCall}
            label="Atendimento"
            onPress={() => navigation.navigate("ServiceScreen")}
          />
          <SettingItem
            icon={UserStar}
            label="Nos avalie"
            onPress={() => navigation.navigate("ReviewScreen")}
          />

          <Separator />

          {/* Regulamentos */}
          <SectionTitle title="Regulamentos" />
          <SettingItem
            icon={ClipboardMinus}
            label="Termos e condições"
            onPress={() => navigation.navigate("TermsScreen")}
          />
          <SettingItem
            icon={BookText}
            label="Política de privacidade"
            onPress={() => navigation.navigate("PoliciesScreen")}
          />

          <Separator />

          {/* Footer */}
          <FooterVersion style={styles.footer} />
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
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: "#192126",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
    marginTop: 25,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 16,
    color: "#192126",
    marginLeft: 15,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginTop: 10,
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
});

export default ConfigScreen;
