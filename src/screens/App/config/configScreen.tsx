import {
  ChevronRight,
  User,
  Radio,
  Calendar,
  Bell,
  Key,
  Target,
  Globe,
  HelpCircle,
  PhoneCall,
  UserStar,
  ClipboardMinus,
  BookText,
} from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";

const ConfigScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(true);

  const SettingItem = ({
    icon: Icon,
    label,
    onPress,
    hasSwitch = false,
    switchValue = false,
    onSwitchChange = () => { },
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
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "ProfilePFScreen" } })}
          />
          <SettingItem
            icon={Radio}
            label="Minha assinatura"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "PlanScreen" } })}
          />
          <SettingItem
            icon={Calendar}
            label="Meus agendamentos"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "Appointments" } })}
          />

          <Separator />

          {/* Notificações */}
          <SectionTitle title="Notificações" />
          <SettingItem
            icon={Bell}
            label="Notificações de aplicativos"
            hasSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
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
            onPress={() => navigation.navigate("Info", { screen: "ObjectivesScreen" })}
          />
          <SettingItem
            icon={Globe}
            label="Mudar idioma"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "LanguageScreen" } })}
          />

          <Separator />

          {/* Ajuda e suporte */}
          <SectionTitle title="Ajuda e suporte" />
          <SettingItem
            icon={HelpCircle}
            label="FAQ"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "FAQScreen" } })}
          />
          <SettingItem
            icon={PhoneCall}
            label="Atendimento"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "ServiceScreen" } })}
          />
          <SettingItem
            icon={UserStar}
            label="Nos avalie"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "ReviewScreen" } })}
          />

          <Separator />

          {/* Regulamentos */}
          <SectionTitle title="Regulamentos" />
          <SettingItem
            icon={ClipboardMinus}
            label="Termos e condições"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "TermsScreen" } })}
          />
          <SettingItem
            icon={BookText}
            label="Política de privacidade"
            onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "PoliciesScreen" } })}
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
