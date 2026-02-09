import React, { useMemo, useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Linking,
    Platform,
    ActivityIndicator,
    Modal,
    Image,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Gym } from "@services/gymService";
import { PersonalTrainerCard, PersonalTrainer } from "@components/PersonalTrainerCard";
import { api } from "@services/api";
import { useLocationContext } from "@contexts/LocationContext";
import { useBottomNav } from "@contexts/BottomNavContext";
import { useGymDetails } from "@hooks/useGymDetails";
import { OpeningHours } from "@components/OpeningHours";
import {
    MapPin,
    Phone,
    Star,
    MessageCircle,
    Clock,
    Info,
    Navigation,
    Users
} from "lucide-react-native";

interface GymDetailsSheetProps {
    gym: Gym | null;
    isOpen: boolean;
    onClose: () => void;
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onTrainerPress?: (trainer: PersonalTrainer) => void;
}

export const GymDetailsSheet: React.FC<GymDetailsSheetProps> = ({
    gym,
    isOpen,
    onClose,
    bottomSheetRef,
    onTrainerPress,
}) => {
    const [personals, setPersonals] = useState<PersonalTrainer[]>([]);
    const [loadingPersonals, setLoadingPersonals] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const { location: userLocation } = useLocationContext();
    const { setIsVisible: setBottomNavVisible } = useBottomNav();
    const { gymDetails, loading: loadingDetails, error: detailsError } = useGymDetails(
        gym?.id_academia || null,
        isOpen
    );
    const snapPoints = useMemo(() => ["50%", "85%"], []);

    // Control BottomNavigationBar visibility
    useEffect(() => {
        setBottomNavVisible(!isOpen);
    }, [isOpen, setBottomNavVisible]);

    // Fetch personals when sheet opens
    useEffect(() => {
        if (!isOpen || !gym) {
            setPersonals([]);
            return;
        }

        const fetchPersonals = async () => {
            setLoadingPersonals(true);
            try {
                const res = await api.get("/personals?limit=100&offset=0");
                const data = res?.data?.data || [];
                const mapped: PersonalTrainer[] = data.map((t: any) => ({
                    id: String(t.id),
                    name: t.name || t.nome || t.username || "Sem nome",
                    description: t.description || t.descricao || "",
                    rating: typeof t.rating === "number" ? t.rating : 0,
                    imageUrl: t.avatarUrl || t.avatar_url || t.avatar || "",
                    id_academia: t.id_academia,
                }));

                // Filter personals by gym ID
                const filtered = mapped.filter(p => p.id_academia === gym.id_academia);
                setPersonals(filtered);
            } catch (err) {
                console.error("Erro ao buscar personals:", err);
                setPersonals([]);
            } finally {
                setLoadingPersonals(false);
            }
        };

        fetchPersonals();
    }, [isOpen, gym]);

    if (!gym || !isOpen) return null;

    // Use gymDetails if available, otherwise fallback to gym prop
    const displayData = gymDetails || gym;
    const isLoadingData = loadingDetails && !gymDetails;

    const handleOpenMap = () => {
        setShowRouteModal(true);
    };

    const openGoogleMaps = () => {
        const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : '';
        const destination = `${gym.latitude},${gym.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${origin}` : ''}&destination=${destination}`;
        Linking.openURL(url).catch(() => {
            // Fallback para versão web
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destination}`);
        });
        setShowRouteModal(false);
    };

    const openAppleMaps = () => {
        const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : '';
        const destination = `${gym.latitude},${gym.longitude}`;
        const url = origin
            ? `http://maps.apple.com/?saddr=${origin}&daddr=${destination}`
            : `http://maps.apple.com/?daddr=${destination}`;
        Linking.openURL(url).catch(() => {
            // Se falhar, tenta abrir Google Maps como fallback
            openGoogleMaps();
        });
        setShowRouteModal(false);
    };

    const openWaze = () => {
        const url = `https://waze.com/ul?ll=${gym.latitude},${gym.longitude}&navigate=yes`;
        Linking.openURL(url).catch(() => {
            // Fallback para versão web do Waze
            Linking.openURL(`https://www.waze.com/live-map/directions?to=ll.${gym.latitude}%2C${gym.longitude}`);
        });
        setShowRouteModal(false);
    };

    const handleCall = () => {
        const phone = displayData.telefone || gym.telefone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleWhatsApp = () => {
        const phone = displayData.whatsapp || displayData.telefone || gym.whatsapp || gym.telefone;
        if (phone) {
            let number = phone.replace(/\D/g, "");
            // Se o número já começar com 55 e tiver 12 ou 13 dígitos, não adiciona 55 novamente
            if (!(number.startsWith("55") && (number.length === 12 || number.length === 13))) {
                number = `55${number}`;
            }
            Linking.openURL(`whatsapp://send?phone=${number}`);
        }
    };

    const getDynamicStatus = () => {
        if (!displayData.horarios_funcionamento) {
            return displayData.ativo ? { isOpen: true, label: "Disponível" } : { isOpen: false, label: "Inativo" };
        }

        const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const now = new Date();
        const dayName = daysMap[now.getDay()];
        const todayHours = displayData.horarios_funcionamento[dayName];

        if (!todayHours || todayHours.length === 0) {
            return { isOpen: false, label: "Fechado hoje" };
        }

        const currentTime = now.getHours() * 100 + now.getMinutes();

        const isOpen = todayHours.some((period: any) => {
            const abre = parseInt(period.abre);
            let fecha = parseInt(period.fecha);

            // Se fecha for 0000 ou menor que abre, consideramos que fecha no dia seguinte
            // Google às vezes retorna 0000 para meia-noite
            if (fecha === 0) fecha = 2400;

            if (fecha < abre) {
                return currentTime >= abre || currentTime <= fecha;
            }

            return currentTime >= abre && currentTime <= fecha;
        });

        return isOpen
            ? { isOpen: true, label: "Aberto agora" }
            : { isOpen: false, label: "Fechado no momento" };
    };

    const status = getDynamicStatus();

    const handleWebsite = () => {
        const website = displayData.website;
        if (website) {
            Linking.openURL(website.startsWith('http') ? website : `https://${website}`);
        }
    };

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backgroundStyle={styles.background}
            handleIndicatorStyle={styles.handle}
        >
            <BottomSheetScrollView contentContainerStyle={styles.container}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.name}>{displayData.nome}</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.ratingText}>
                                {Number(displayData.rating || 0).toFixed(1)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.totalReviews}>
                        {displayData.total_avaliacoes || 0} avaliações no Google
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleOpenMap}>
                        <View style={[styles.iconCircle, { backgroundColor: "#E0F2FE" }]}>
                            <Navigation size={20} color="#0284C7" />
                        </View>
                        <Text style={styles.actionLabel}>Rota</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                        <View style={[styles.iconCircle, { backgroundColor: "#F0FDF4" }]}>
                            <Phone size={20} color="#059669" />
                        </View>
                        <Text style={styles.actionLabel}>Ligar</Text>
                    </TouchableOpacity>

                    {(() => {
                        const phone = displayData.whatsapp || displayData.telefone || gym.whatsapp || gym.telefone;
                        const isMobile = phone && phone.replace(/\D/g, "").length >= 10 && (
                            phone.replace(/\D/g, "").slice(-9).startsWith("9") ||
                            phone.replace(/\D/g, "").slice(-8).startsWith("9")
                        );

                        if (!isMobile) return null;

                        return (
                            <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
                                <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
                                    <MessageCircle size={20} color="#16A34A" />
                                </View>
                                <Text style={styles.actionLabel}>WhatsApp</Text>
                            </TouchableOpacity>
                        );
                    })()}
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Info size={20} color="#192126" />
                        <Text style={styles.sectionTitle}>Informações</Text>
                    </View>

                    <View style={styles.infoWrapper}>
                        <View style={styles.infoItem}>
                            <MapPin size={20} color="#64748B" />
                            <View style={styles.infoTextContent}>
                                <Text style={styles.infoLabel}>Endereço</Text>
                                <Text style={styles.infoValue}>{displayData.endereco_completo}</Text>
                            </View>
                        </View>

                        {(displayData.telefone || displayData.whatsapp) && (
                            <View style={styles.infoItem}>
                                <Phone size={20} color="#64748B" />
                                <View style={styles.infoTextContent}>
                                    <Text style={styles.infoLabel}>Contato</Text>
                                    <Text style={styles.infoValue}>{displayData.whatsapp || displayData.telefone}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.infoItem}>
                            <Clock size={20} color="#64748B" />
                            <View style={styles.infoTextContent}>
                                <Text style={styles.infoLabel}>Status</Text>
                                <Text style={[styles.infoValue, { color: status.isOpen ? "#059669" : "#EF4444" }]}>
                                    {status.label}
                                </Text>
                            </View>
                        </View>

                        {displayData.website && (
                            <View style={styles.infoItem}>
                                <Info size={20} color="#64748B" />
                                <View style={styles.infoTextContent}>
                                    <Text style={styles.infoLabel}>Website</Text>
                                    <TouchableOpacity onPress={handleWebsite}>
                                        <Text style={[styles.infoValue, { color: '#0284C7' }]}>
                                            {displayData.website}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Opening Hours Section */}
                {displayData.horarios_funcionamento && (
                    <OpeningHours hours={displayData.horarios_funcionamento} />
                )}

                {/* Personals Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Users size={20} color="#192126" />
                        <Text style={styles.sectionTitle}>Personais Disponíveis</Text>
                    </View>

                    {loadingPersonals ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#192126" />
                        </View>
                    ) : personals.length > 0 ? (
                        <View>
                            {personals.map((trainer) => (
                                <PersonalTrainerCard
                                    key={trainer.id}
                                    trainer={trainer}
                                    onPress={onTrainerPress}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.noPersonalsContainer}>
                            <Text style={styles.noPersonalsText}>
                                Nenhum personal vinculado a esta academia no momento.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Description / Extra Info if needed */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionText}>
                        Esta academia faz parte da rede MOVT. Utilize seu token de acesso para realizar o check-in na recepção.
                    </Text>
                </View>
            </BottomSheetScrollView>

            {/* Route Selection Modal */}
            <Modal
                visible={showRouteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRouteModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRouteModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Escolha o aplicativo de rotas</Text>
                        <Text style={styles.modalSubtitle}>
                            {userLocation
                                ? 'Navegue da sua localização até a academia'
                                : 'Abrir localização da academia'}
                        </Text>

                        <TouchableOpacity
                            style={styles.routeOption}
                            onPress={openGoogleMaps}
                        >
                            <View style={[styles.routeIconCircle, { backgroundColor: '#E3F2FD' }]}>
                                <Image
                                    source={{ uri: 'https://www.edigitalagency.com.au/wp-content/uploads/Google-Maps-icon-png-medium-size.png' }}
                                    style={styles.routeIconImage}
                                />
                            </View>
                            <View style={styles.routeTextContainer}>
                                <Text style={styles.routeOptionTitle}>Google Maps</Text>
                                <Text style={styles.routeOptionSubtitle}>Navegação completa</Text>
                            </View>
                        </TouchableOpacity>

                        {Platform.OS === 'ios' && (
                            <TouchableOpacity
                                style={styles.routeOption}
                                onPress={openAppleMaps}
                            >
                                <View style={[styles.routeIconCircle, { backgroundColor: '#E3F2FD' }]}>
                                    <Image
                                        source={{ uri: 'https://cdn.jim-nielsen.com/macos/1024/maps-2023-05-19.png' }}
                                        style={styles.routeIconImage}
                                    />
                                </View>
                                <View style={styles.routeTextContainer}>
                                    <Text style={styles.routeOptionTitle}>Apple Maps</Text>
                                    <Text style={styles.routeOptionSubtitle}>Nativo do iOS</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.routeOption}
                            onPress={openWaze}
                        >
                            <View style={[styles.routeIconCircle, { backgroundColor: '#E3F2FD' }]}>
                                <Image
                                    source={{ uri: 'https://logospng.org/download/waze/logo-waze-icone-4096.png' }}
                                    style={{ width: 46, height: 46 }}
                                />
                            </View>
                            <View style={styles.routeTextContainer}>
                                <Text style={styles.routeOptionTitle}>Waze</Text>
                                <Text style={styles.routeOptionSubtitle}>Rotas com trânsito em tempo real</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowRouteModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    background: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    handle: {
        backgroundColor: "#CBD5E1",
        width: 40,
    },
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    name: {
        fontSize: 24,
        fontWeight: "800",
        color: "#192126",
        flex: 1,
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#192126",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    ratingText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    totalReviews: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 4,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 32,
    },
    actionButton: {
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#192126",
    },
    infoWrapper: {
        backgroundColor: "#F8FAFC",
        borderRadius: 20,
        padding: 16,
        gap: 20,
    },
    infoItem: {
        flexDirection: "row",
        gap: 16,
        alignItems: "flex-start",
    },
    infoTextContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "600",
        textTransform: "uppercase",
    },
    infoValue: {
        fontSize: 14,
        color: "#1e293b",
        fontWeight: "500",
        marginTop: 2,
    },
    descriptionSection: {
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        borderLeftWidth: 4,
        borderLeftColor: "#B1F232",
    },
    descriptionText: {
        fontSize: 14,
        color: "#166534",
        lineHeight: 20,
    },
    mainButton: {
        backgroundColor: "#192126",
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    mainButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    loadingContainer: {
        padding: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    noPersonalsContainer: {
        backgroundColor: "#F8FAFC",
        padding: 24,
        borderRadius: 16,
        alignItems: "center",
    },
    noPersonalsText: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#192126',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        textAlign: 'center',
    },
    routeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginBottom: 12,
    },
    routeIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    routeIconText: {
        fontSize: 28,
    },
    routeIconImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    routeTextContainer: {
        flex: 1,
    },
    routeOptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#192126',
        marginBottom: 2,
    },
    routeOptionSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    cancelButton: {
        marginTop: 8,
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
});
