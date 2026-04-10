import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import BackButton from "@components/BackButton";

const languages = [
  { code: "pt", name: "portuguese" },
  { code: "en", name: "english" },
  { code: "es", name: "spanish" },
  { code: "fr", name: "french" },
  { code: "it", name: "italian" },
  { code: "de", name: "german" },
];

const LanguageScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{t("settings.language")}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t("settings.manage_language")}</Text>

        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.languageItem}
            onPress={() => changeLanguage(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.languageName}>{t(`settings.${lang.name}`)}</Text>
            {currentLanguage.startsWith(lang.code) && (
              <Check size={20} color="#192126" strokeWidth={3} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

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
    fontWeight: "bold",
    color: "#192126",
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
    fontWeight: "500",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  languageName: {
    fontSize: 16,
    color: "#192126",
    fontWeight: "500",
  },
});

export default LanguageScreen;
