import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Minus } from "lucide-react-native";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";

// Habilita animações no Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemProps {
    question: string;
    answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(!isOpen);
    };

    return (
        <View style={styles.faqItemContainer}>
            <TouchableOpacity
                style={styles.faqHeader}
                onPress={toggleOpen}
                activeOpacity={0.7}
            >
                <Text style={styles.questionText}>{question}</Text>
                {isOpen ? (
                    <Minus size={24} color="#000" strokeWidth={1.5} />
                ) : (
                    <Plus size={24} color="#000" strokeWidth={1.5} />
                )}
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{answer}</Text>
                </View>
            )}
            <View style={styles.divider} />
        </View>
    );
};

const FAQScreen: React.FC = () => {
    const faqData = [
        {
            question: "Como encontro um personal trainer próximo a mim no Movt APP?",
            answer: "Treinadores enviam certificações, que são verificadas e as avaliações de usuários ajudam a manter a qualidade.",
        },
        {
            question: "O que fazer se um treinador cancela sessões repetidamente?",
            answer: "Você pode reportar o comportamento através do nosso suporte ou solicitar o reembolso da sessão caso o cancelamento ocorra fora das políticas permitidas.",
        },
        {
            question: "Como resolver disputas com treinadores?",
            answer: "Nossa equipe de suporte está disponível para mediar qualquer conflito. Basta acessar a aba de atendimento.",
        },
        {
            question: "E se não houver treinadores na minha área?",
            answer: "Estamos expandindo rapidamente! Você também pode optar por sessões de treinamento online.",
        },
        {
            question: "Meus dados de localização estão seguros?",
            answer: "Sim, utilizamos criptografia de ponta a ponta e seus dados seguem as normas da LGPD.",
        },
        {
            question: "Haverá comunidades ou treinos em grupo?",
            answer: "Sim! Em breve teremos novidades sobre grupos de corrida e treinos coletivos.",
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>FAQ</Text>
                <View style={{ width: 46 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.mainTitle}>Tire aqui suas dúvidas</Text>
                <View style={[styles.divider, { marginBottom: 10 }]} />

                {faqData.map((item, index) => (
                    <FAQItem key={index} question={item.question} answer={item.answer} />
                ))}

                {/* Footer alinhado à esquerda conforme a imagem */}
                <FooterVersion style={styles.footer} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default FAQScreen;

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
    faqItemContainer: {
        marginTop: 10,
    },
    faqHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 20,
    },
    questionText: {
        flex: 1,
        fontSize: 16,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        marginRight: 10,
        lineHeight: 22,
    },
    answerContainer: {
        paddingBottom: 20,
    },
    answerText: {
        fontSize: 14,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
        lineHeight: 20,
        opacity: 0.8,
    },
    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    footer: {
        alignItems: "flex-start",
        marginTop: 60,
        marginBottom: 20,
    },
});