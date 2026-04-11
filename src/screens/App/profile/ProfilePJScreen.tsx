import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, MapPin, Award, Dumbbell, BadgeCheck } from "lucide-react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../@types/routes";
import BackButton from "../../../components/BackButton";
import { API_BASE_URL } from "../../../config/api";
import { useAuth } from "../../../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

type ProfilePJRouteProp = RouteProp<
  {
    ProfilePJ: {
      trainer: {
        id: string;
        name: string;
        description: string;
        rating: number;
        imageUrl: string;
      };
    };
  },
  "ProfilePJ"
>;

const ProfilePJScreen = () => {
  const route = useRoute<ProfilePJRouteProp>();
  const { trainer } = route.params || {};
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user: authUser } = useAuth();

  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trainerData, setTrainerData] = useState<any>(null);
  const insets = useSafeAreaInsets();

  const trainerId = trainer?.id || (route.params as any)?.trainerId;

  const fetchTrainerDetails = useCallback(async () => {
    if (!trainerId) {
      console.warn("fetchTrainerDetails: No trainerId found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Buscando detalhes do trainer: ${trainerId}`);
      const response = await fetch(`${API_BASE_URL}/trainers/${trainerId}`);

      if (response.ok) {
        const json = await response.json();
        setTrainerData(json.data);
      } else {
        console.error("Erro na resposta da API:", response.status);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do trainer:", error);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    fetchTrainerDetails();
  }, [fetchTrainerDetails]);

  // Use trainerData if available, fallback to route.params or defaults
  const trainerName = trainerData?.name || trainer?.name;
  const trainerImageUrl = trainerData?.avatar_url || trainer?.imageUrl;
  const trainerDescription = trainerData?.description || trainer?.description;
  const trainerRating = trainerData?.avaliacoesCount || trainer?.rating || 0;
  const trainerVerificado = trainerData?.verificado === true;
  const trainerAddress =
    trainerData?.address || (trainer as any)?.location || "Endereço não informado";

  // Standard padding calculation
  const paddingTop =
    Platform.OS === "android" ? (insets.top > 0 ? insets.top + 20 : 40) : Math.max(insets.top, 10);

  const toggleNotificationModal = () => {
    setIsNotificationModalVisible(!isNotificationModalVisible);
  };

  const handleViewProfile = () => {
    // Navigate to the ProfilePFScreen with the trainer data as user
    // We map the trainer data to match what ProfilePFScreen expects in 'user' param
    navigation.navigate("ProfilePFScreen", {
      user: {
        id: trainerData?.id || trainer?.id || "",
        name: trainerName || "Personal Trainer",
        username: trainerData?.username || (trainer?.name || "").toLowerCase().replace(/\s+/g, "_"),
        photo: trainerImageUrl || "",
        banner:
          trainerData?.banner_url ||
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
        location: trainerData?.address || "São Paulo",
        job_title: "Personal Trainer",
        bio: trainerDescription || "",
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Header com botões padronizados e espaçamento dinâmico */}
      <View style={[styles.header, { paddingTop }]}>
        <BackButton />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BBF246" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* PREMIUM HEADER SECTION */}
          <View style={styles.premiumHeader}>
            <Image
              source={{
                uri:
                  trainerData?.banner_url ||
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
              }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(25, 33, 38, 0.4)"]}
              style={styles.bannerOverlay}
            />

            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorder}>
                <Image
                  source={{ uri: trainerImageUrl || "https://via.placeholder.com/400" }}
                  style={styles.avatarImage}
                />
              </View>
              {trainerVerificado && (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck size={18} color="#192126" fill="#BBF246" />
                </View>
              )}
            </View>
          </View>

          {/* PROFILE DATA SECTION */}
          <View style={styles.profileContentArea}>
            <View style={styles.identitySection}>
              <Text style={styles.nameText}>{trainerName}</Text>
              <View style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>
                  {trainerData?.especialidades
                    ? Array.isArray(trainerData.especialidades)
                      ? trainerData.especialidades[0]
                      : trainerData.especialidades.split(",")[0]
                    : "Personal Trainer"}
                </Text>
              </View>
            </View>

            {/* KPI STRIP */}
            <View style={styles.kpiStrip}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{trainerData?.experienceYears || 0}</Text>
                <Text style={styles.kpiLabel}>Anos Exp.</Text>
              </View>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{trainerData?.agendamentosCount || 0}</Text>
                <Text style={styles.kpiLabel}>Treinos</Text>
              </View>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>{trainerRating}</Text>
                <Text style={styles.kpiLabel}>Avaliações</Text>
              </View>
            </View>

            <View style={styles.mainBioCard}>
              <Text style={styles.bioTitle}>Sobre o Profissional</Text>
              <Text style={styles.bioText}>
                {trainerDescription || "Nenhuma descrição informada pelo profissional."}
              </Text>
            </View>

            {/* REGULAMENTO E FORMAÇÃO */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Credenciais</Text>
              <View style={styles.credentialBox}>
                <View style={styles.credentialRow}>
                  <Award size={18} color="#BBF246" />
                  <Text style={styles.credentialText}>CREF: {trainerData?.cref || "Pendente"}</Text>
                </View>
                <View style={styles.credentialRow}>
                  <Award size={18} color="#BBF246" />
                  <Text style={styles.credentialText}>
                    {trainerData?.formacao || "Formação em Educação Física"}
                  </Text>
                </View>
              </View>
            </View>

            {/* LOCALIZAÇÃO */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Onde Atende</Text>
              <TouchableOpacity style={styles.locationCard}>
                <View style={styles.locationIconBox}>
                  <MapPin size={20} color="#192126" />
                </View>
                <View style={{ flex: 1 }}>
                  {trainerData?.gym?.nome && (
                    <Text style={styles.gymNameText}>{trainerData.gym.nome}</Text>
                  )}
                  <Text style={styles.addressText}>{trainerAddress}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ height: 140 }} />
          </View>
        </ScrollView>
      )}

      {/* Botões Fixos no Final (sempre visíveis ou após carregar) */}
      {!loading && (
        <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() =>
                navigation.navigate("AppointmentScreen", {
                  trainerId: trainerData?.id || trainer?.id || undefined,
                  trainer: {
                    id: trainerData?.id || trainer?.id || undefined,
                    name: trainerName,
                  },
                } as any)
              }
            >
              <Calendar size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={handleViewProfile}>
              <Text style={styles.buttonText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  contentContainer: {
    flex: 1,
  },
  premiumHeader: {
    height: 240,
    width: "100%",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: 200,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 200,
  },
  avatarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 20,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    left: 74,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileContentArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  identitySection: {
    marginBottom: 20,
  },
  nameText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#192126",
  },
  specialtyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  kpiStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#192126",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  kpiItem: {
    flex: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#BBF246",
  },
  kpiLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    fontWeight: "600",
  },
  kpiDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  mainBioCard: {
    marginBottom: 25,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#192126",
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
  },
  cardSection: {
    marginBottom: 25,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1,
  },
  credentialBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  credentialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  credentialText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#192126",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 15,
  },
  locationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
  },
  gymNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#192126",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: "#64748B",
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#ffffff",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  outlineButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#192126",
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    flex: 1,
    borderRadius: 20,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#192126",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#192126",
    fontWeight: "600",
  },
});

export default ProfilePJScreen;
