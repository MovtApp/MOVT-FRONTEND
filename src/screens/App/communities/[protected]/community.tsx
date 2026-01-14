import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import {
    Clock,
    Flame,
    Calendar,
    Users,
    Activity,
    Trophy,
    Heart,
    Share2,
    Play,
} from "lucide-react-native";
import BackButton from "@components/BackButton";
import { AppStackParamList } from "../../../../@types/routes";

interface Community {
    id_comunidade: number;
    nome: string;
    descricao: string;
    imageurl: string;
    participantes: string;
    max_participantes: number;
    categoria: string;
    tipo_comunidade: string;
}

type CommunityDetailsRouteProp = RouteProp<AppStackParamList, "CommunityDetails">;

const { width } = Dimensions.get("window");

const CommunityDetails: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { community } = (route.params as { community: Community }) || {};

    // Mock data for missing fields in the API response (based on the image)
    const mockData = {
        time: "1h30 min",
        calories: "500 kcal",
        music: {
            title: "Hotline Bling",
            artist: "Drake", // "M" in the design looks like artist initial or name
            cover: "https://i.scdn.co/image/ab67616d0000b27341fe146f6bc42b26097e3a67", // Placeholder
        },
        date: "30/03/2025 às 17h",
        ageGroup: "Faixa etária: +50",
        type: community?.categoria || "Maratona",
        reward: "Premiação",
    };

    const handleBack = () => {
        navigation.goBack();
    };

    if (!community) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <BackButton />
                </View>
                <View style={styles.errorContainer}>
                    <Text>Comunidade não encontrada.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>{community.nome}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Banner Image */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={{ uri: community.imageurl || "https://via.placeholder.com/400" }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />

                    {/* Stats Overlay */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <View style={[styles.iconBox, { backgroundColor: "#C2F74D" }]}>
                                <Clock size={20} color="#192126" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Tempo</Text>
                                <Text style={styles.statValue}>{mockData.time}</Text>
                            </View>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.iconBox, { backgroundColor: "#C2F74D" }]}>
                                <Flame size={20} color="#192126" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Calorias</Text>
                                <Text style={styles.statValue}>{mockData.calories}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Music Player Mock */}
                <View style={styles.musicPlayer}>
                    <Image source={{ uri: mockData.music.cover }} style={styles.albumCover} />
                    <View style={styles.musicInfo}>
                        <Text style={styles.musicTitle}>{mockData.music.title}</Text>
                        <Text style={styles.musicArtist}>{mockData.music.artist}</Text>
                    </View>
                    <View style={styles.musicControls}>
                        <TouchableOpacity style={styles.controlIcon}>
                            <Share2 size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlIcon}>
                            <Heart size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlIcon}>
                            <Play size={20} color="#fff" fill="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Title & Description */}
                <View style={styles.infoSection}>
                    <Text style={styles.communityTitle}>{community.nome} {community.max_participantes ? `(${community.max_participantes}+)` : '(50+)'}</Text>
                    <Text style={styles.description}>
                        {community.descricao || "Esta comunidade é uma oportunidade para se conectar e desafiar juntos. Organizada por uma comunidade acolhedora, o evento foca no apoio mútuo e no fortalecimento de laços."}
                    </Text>
                </View>

                {/* Details Section */}
                <View style={styles.detailsSection}>
                    <Text style={styles.detailsHeader}>Detalhes</Text>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailRow}>
                            <Calendar size={20} color="#192126" />
                            <Text style={styles.detailText}>{mockData.date}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Activity size={20} color="#192126" />
                            <Text style={styles.detailText}>{mockData.type}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Users size={20} color="#192126" />
                            <Text style={styles.detailText}>{mockData.ageGroup}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Trophy size={20} color="#192126" />
                            <Text style={styles.detailText}>{mockData.reward}</Text>
                        </View>
                    </View>
                </View>

                {/* Contact Data Header (mocking the bottom cut-off text from image) */}
                <View style={styles.contactSection}>
                    <Text style={styles.contactHeader}>Dados de contato</Text>
                </View>

                {/* Join Button */}
                <TouchableOpacity style={styles.joinButton} activeOpacity={0.8}>
                    <Text style={styles.joinButtonText}>Participar</Text>
                </TouchableOpacity>

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
        backgroundColor: "#fff",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#192126",
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    bannerContainer: {
        alignItems: "center",
        marginTop: 10,
        paddingHorizontal: 20,
        marginBottom: 25, // space for the floating stats
    },
    bannerImage: {
        width: "100%",
        height: 250,
        borderRadius: 24,
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: "#192126",
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        position: "absolute",
        bottom: -25, // Half overlap or separate as per design. Design shows full overlap at bottom
        alignSelf: 'center',
        width: '80%',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    statLabel: {
        color: "#9CA3AF",
        fontSize: 10,
        fontWeight: "500",
    },
    statValue: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    statDivider: {
        width: 1,
        height: "80%",
        backgroundColor: "#374151",
    },
    musicPlayer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0F172A", // Dark blue/black
        marginHorizontal: 20,
        marginTop: 40,
        marginBottom: 20,
        borderRadius: 16,
        padding: 12,
    },
    albumCover: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "#333",
    },
    musicInfo: {
        flex: 1,
        marginLeft: 12,
    },
    musicTitle: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    musicArtist: {
        color: "#94A3B8",
        fontSize: 12,
    },
    musicControls: {
        flexDirection: "row",
        gap: 15,
        marginRight: 5,
    },
    controlIcon: {
        // padding: 4,
    },
    infoSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    communityTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#192126",
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: "#4B5563",
        lineHeight: 22,
    },
    detailsSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    detailsHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#192126",
        marginBottom: 15,
    },
    detailsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "48%", // 2 items per row
        marginBottom: 15,
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: "#4B5563",
        flex: 1, // Allow text to wrap if needed
    },
    joinButton: {
        backgroundColor: "#192126",
        marginHorizontal: 20,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    joinButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    contactSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    contactHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#192126",
    },
});

export default CommunityDetails;
