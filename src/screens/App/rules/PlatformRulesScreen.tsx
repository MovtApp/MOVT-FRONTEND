import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";

const PlatformRulesScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>Regras da plataforma</Text>
                <View style={{ width: 46 }} />
            </View>
            <View style={styles.headerDivider} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.lastUpdate}>Última atualização: 07 de junho de 2025</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introdução</Text>
                    <Text style={styles.sectionText}>
                        Bem-vindo ao Movt App! Para garantir uma experiência segura e agradável para todos os usuários e treinadores, estabelecemos estas Regras da Plataforma. Ao utilizar nossos serviços, você concorda em cumprir estas diretrizes.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Comportamento do Usuário</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Respeito Mútuo: Trate todos os treinadores e outros usuários com respeito e cortesia. Não toleramos assédio, discriminação, discurso de ódio ou comportamento abusivo.</Text>
                        <Text style={styles.bulletItem}>• Uso Adequado: Utilize o aplicativo apenas para fins relacionados a fitness e bem-estar. O uso para atividades ilegais ou não autorizadas é estritamente proibido.</Text>
                        <Text style={styles.bulletItem}>• Pontualidade: Respeite os horários agendados com os treinadores. Cancelamentos ou atrasos devem seguir a política de cancelamento estabelecida.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Responsabilidades dos Treinadores</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Profissionalismo: Mantenha um alto padrão de profissionalismo em todas as interações. Forneça orientações claras e seguras.</Text>
                        <Text style={styles.bulletItem}>• Certificações: Mantenha suas certificações e licenças profissionais atualizadas e válidas.</Text>
                        <Text style={styles.bulletItem}>• Segurança: Priorize a segurança física dos usuários durante as sessões de treinamento.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Conteúdo e Propriedade Intelectual</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Conteúdo do Usuário: Você é responsável por qualquer conteúdo (fotos, textos, avaliações) que postar no aplicativo. Não publique material ofensivo ou que viole direitos autorais.</Text>
                        <Text style={styles.bulletItem}>• Propriedade do Movt: Todo o design, logotipos e funcionalidades do aplicativo são propriedade do Movt App e não podem ser copiados ou reproduzidos sem permissão.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Pagamentos e Transações</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Transações Seguras: Todos os pagamentos devem ser processados através da plataforma do Movt App para garantir segurança e suporte.</Text>
                        <Text style={styles.bulletItem}>• Reembolsos: Solicitações de reembolso serão analisadas de acordo com nossa Política de Reembolso e as circunstâncias específicas de cada caso.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Consequências de Violações</Text>
                    <Text style={styles.sectionText}>
                        O desrespeito a estas regras pode resultar em advertências, suspensão temporária ou banimento permanente da plataforma, a critério exclusivo da equipe do Movt App.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Contato</Text>
                    <Text style={styles.sectionText}>
                        Se você presenciar qualquer violação destas regras ou tiver dúvidas, entre em contato conosco através do suporte no aplicativo ou pelo e-mail suporte@movtapp.com.
                    </Text>
                </View>

                <FooterVersion />
            </ScrollView>
        </SafeAreaView>
    );
};

export default PlatformRulesScreen;

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
        marginHorizontal: 0,
        marginVertical: 10,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    lastUpdate: {
        fontSize: 18,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        marginTop: 20,
        marginBottom: 30,
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 16,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 14,
        color: "#111",
        fontFamily: "Rubik_400Regular",
        lineHeight: 20,
    },
    bulletList: {
        marginVertical: 5,
        paddingLeft: 5,
    },
    bulletItem: {
        fontSize: 14,
        color: "#111",
        fontFamily: "Rubik_400Regular",
        lineHeight: 20,
        marginBottom: 5,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 20,
    },
    footer: {
        alignItems: "flex-start",
        marginTop: 50,
        marginBottom: 30,
    },
    logoImage: {
        width: 50,
        height: 25,
        marginBottom: 4,
    },
    versionText: {
        fontSize: 14,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
        opacity: 0.8,
    },
});
