import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react-native";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";
import "@/i18n"; // Import the config

const languages = [
    { id: "pt", name: "portuguese", flag: "🇧🇷" },
    { id: "es", name: "spanish", flag: "🇪🇸" },
    { id: "en", name: "english", flag: "🇺🇸" },
    { id: "de", name: "german", flag: "🇩🇪" },
    { id: "ja", name: "japanese", flag: "🇯🇵" },
    { id: "fr", name: "french", flag: "🇫🇷" },
    { id: "it", name: "italian", flag: "🇮🇹" },
    { id: "ko", name: "korean", flag: "🇰🇷" },
    { id: "zh", name: "chinese", flag: "🇨🇳" },
    { id: "ru", name: "russian", flag: "🇷🇺" },
];

const LanguageScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    const handleLanguageChange = (langId: string) => {
        i18n.changeLanguage(langId);
    };

    const displayedLanguages = showAll ? languages : languages.slice(0, 5);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton />
                    <Text style={styles.headerTitle}>{t("settings.language")}</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={styles.sectionTitle}>{t("settings.manage_language")}</Text>

                    <View style={styles.selectionTitleContainer}>
                        <Text style={styles.selectionTitle}>{t("settings.selected_language")}</Text>
                        <View style={styles.selectionUnderline} />
                    </View>

                    <View style={styles.languageList}>
                        {displayedLanguages.map((lang) => {
                            const isSelected = i18n.language.startsWith(lang.id);
                            return (
                                <TouchableOpacity
                                    key={lang.id}
                                    style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                                    onPress={() => handleLanguageChange(lang.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.languageName}>{t(`settings.${lang.name}`)}</Text>
                                    <View style={styles.flagContainer}>
                                        <Text style={styles.flagText}>{lang.flag}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {!showAll && (
                        <TouchableOpacity
                            style={styles.othersButton}
                            activeOpacity={0.7}
                            onPress={() => setShowAll(true)}
                        >
                            <Text style={styles.othersButtonText}>{t("settings.others")}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.footerDivider} />

                    {/* Edit Button - Static in Scroll but could be Absolute if desired */}
                    <View style={styles.editButtonContainer}>
                        <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                            <Pencil size={18} color="#fff" />
                            <Text style={styles.editButtonText}>{t("settings.edit")}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Logo */}
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
        fontSize: 18,
        fontWeight: "bold",
        color: "#192126",
        marginTop: 25,
        marginBottom: 25,
    },
    selectionTitleContainer: {
        marginBottom: 10,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#192126",
        marginBottom: 8,
    },
    selectionUnderline: {
        height: 1,
        backgroundColor: "#E5E7EB",
        width: "100%",
    },
    languageList: {
        marginTop: 20,
        gap: 12,
    },
    languageItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#fff",
    },
    languageItemSelected: {
        borderColor: "#192126",
        borderWidth: 1.5,
    },
    languageName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#192126",
    },
    flagContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    flagText: {
        fontSize: 24,
    },
    othersButton: {
        alignSelf: "center",
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    othersButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#192126",
    },
    footerDivider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginTop: 30,
        width: "100%",
    },
    editButtonContainer: {
        alignItems: "flex-end",
        marginTop: 30,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#192126",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 10,
    },
    editButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    footer: {
        alignItems: "center",
        marginTop: 80,
        marginBottom: 20,
    },
});

export default LanguageScreen;
