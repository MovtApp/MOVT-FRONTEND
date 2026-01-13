import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Search, Radio, Map as MapIcon, Settings } from "lucide-react-native";
import BackButton from "@components/BackButton";

const ServiceScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>Atendimento</Text>
                <View style={{ width: 46 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.mainTitle}>Como podemos te ajudar?</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Pesquisar"
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                    />
                </View>

                <Text style={styles.sectionTitle}>Tópicos em destaque</Text>

                {/* Chips/Topics Grid */}
                <View style={styles.chipsContainer}>
                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>Como cancelar uma aula?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>Alterar forma de pagamento</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>Alteração de assinatura</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>Política de cancelamento</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Cards */}
                <View style={styles.cardsContainer}>
                    {/* Card 1: Assinatura */}
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Gerenciar assinatura</Text>
                            <Text style={styles.cardSubtitle}>Alterar plano, mudar ou cancelar</Text>
                            <TouchableOpacity
                                style={styles.cardButton}
                                onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "PlanScreen" } })}
                            >
                                <Radio size={16} color="#192126" />
                                <Text style={styles.cardButtonText}>Minha assinatura</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Card 2: Mapa */}
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Contratar personal trainer</Text>
                            <Text style={styles.cardSubtitle}>Contatar e agendar sessões</Text>
                            <TouchableOpacity
                                style={styles.cardButton}
                                onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "MapScreen" } })}
                            >
                                <MapIcon size={16} color="#192126" />
                                <Text style={styles.cardButtonText}>Mapa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Card 3: Perfil */}
                    <View style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Conta e perfil</Text>
                            <Text style={styles.cardSubtitle}>Alterar dados pessoas e senha</Text>
                            <TouchableOpacity
                                style={styles.cardButton}
                                onPress={() => navigation.navigate("App", { screen: "HomeStack", params: { screen: "ConfigScreen" } })}
                            >
                                <Settings size={16} color="#192126" />
                                <Text style={styles.cardButtonText}>Configurações</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ServiceScreen;

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
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    mainTitle: {
        fontSize: 20,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        marginTop: 30,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 56,
        marginBottom: 30,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
    },
    sectionTitle: {
        fontSize: 18,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        marginBottom: 20,
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 30,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#fff",
    },
    chipText: {
        fontSize: 13,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
    },
    cardsContainer: {
        gap: 15,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardContent: {
        gap: 8,
    },
    cardTitle: {
        fontSize: 18,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#94A3B8",
        fontFamily: "Rubik_700Bold",
        marginBottom: 12,
    },
    cardButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    cardButtonText: {
        fontSize: 12,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
    },
});
