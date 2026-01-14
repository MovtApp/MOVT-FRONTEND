import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Star, Send } from "lucide-react-native";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";

const ReviewScreen: React.FC = () => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleRating = (index: number) => {
        setRating(index + 1);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>Nos avalie</Text>
                <View style={{ width: 46 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.content}>
                    <Text style={styles.mainTitle}>Como foi sua experiência com o app?</Text>
                    <Text style={styles.subtitle}>
                        Sua avaliação é essencial para nos ajudar a melhorar o app!
                    </Text>

                    {/* Star Rating Section */}
                    <View style={styles.starsContainer}>
                        {[...Array(5)].map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleRating(index)}
                                activeOpacity={0.7}
                            >
                                <Star
                                    size={46}
                                    color={rating > index ? "#192126" : "#E2E8F0"}
                                    fill={rating > index ? "#192126" : "transparent"}
                                    strokeWidth={1.5}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Comment Section */}
                    <View style={styles.commentSection}>
                        <Text style={styles.commentTitle}>Deixe um comentário (opcional)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Conte-nos mais sobre sua experiência..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                maxLength={500}
                                value={comment}
                                onChangeText={setComment}
                                textAlignVertical="top"
                            />
                        </View>
                        <Text style={styles.charCount}>{comment.length}/500 caracteres</Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
                        <Send size={18} color="#fff" style={styles.sendIcon} />
                        <Text style={styles.submitButtonText}>Enviar</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <FooterVersion style={styles.footer} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ReviewScreen;

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
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    content: {
        marginTop: 30,
        flex: 1,
    },
    mainTitle: {
        fontSize: 20,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        lineHeight: 28,
    },
    subtitle: {
        fontSize: 14,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
        marginTop: 8,
        opacity: 0.8,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
        paddingHorizontal: 10,
    },
    commentSection: {
        marginTop: 40,
    },
    commentTitle: {
        fontSize: 18,
        color: "#192126",
        fontFamily: "Rubik_700Bold",
        marginBottom: 15,
    },
    inputWrapper: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        height: 150,
        padding: 15,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
    },
    charCount: {
        fontSize: 14,
        color: "#94A3B8",
        fontFamily: "Rubik_400Regular",
        textAlign: "right",
        marginTop: 8,
    },
    submitButton: {
        backgroundColor: "#192126",
        borderRadius: 10,
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
    },
    sendIcon: {
        marginRight: 10,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Rubik_700Bold",
    },
    footer: {
        marginTop: "auto",
        paddingTop: 60,
        paddingBottom: 20,
    },
});
