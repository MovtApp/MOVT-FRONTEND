import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "@components/BackButton";
import { AppStackParamList } from "../../../@types/routes";
import { FooterVersion } from "@components/FooterVersion";

interface AboutItemProps {
  title: string;
  rightText?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

const AboutItem: React.FC<AboutItemProps> = ({ title, rightText, onPress, showChevron = true }) => {
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.itemTitle}>{title}</Text>
      <View style={styles.rightContent}>
        {rightText && <Text style={styles.rightText}>{rightText}</Text>}
        {showChevron && <ChevronRight size={24} color="#000" />}
      </View>
    </TouchableOpacity>
  );
};

const AboutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handleNavigate = (route: keyof AppStackParamList) => {
    navigation.navigate(route as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Sobre</Text>
        <View style={{ width: 46 }} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AboutItem title="Versão" rightText="1.0.0" showChevron={false} />

        <AboutItem
          title="Políticas de privacidade"
          onPress={() => handleNavigate("PoliciesScreen")}
        />

        <AboutItem title="Termos e condições" onPress={() => handleNavigate("TermsScreen")} />

        <AboutItem
          title="Regras da plataforma"
          onPress={() => {
            navigation.navigate("PlatformRulesScreen" as never);
          }}
        />

        <AboutItem title="Atendimento" onPress={() => handleNavigate("FAQScreen")} />

        {/* Footer Section */}
        <FooterVersion style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: "#192126",
    fontFamily: "Rubik_700Bold",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  itemTitle: {
    fontSize: 18,
    color: "#192126",
    fontFamily: "Rubik_700Bold",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightText: {
    fontSize: 18,
    color: "#8C8C8C",
    fontFamily: "Rubik_400Regular",
    marginRight: 8,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 40,
    alignItems: "flex-start",
  },
});
