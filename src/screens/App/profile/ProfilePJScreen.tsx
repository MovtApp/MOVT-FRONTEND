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
import { Calendar, MapPin, Award, Dumbbell, BadgeCheck } from "lucide-react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../@types/routes";
import BackButton from "../../../components/BackButton";
import NotificationModal from "../../../components/NotificationModal";
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

  const showNotifications = true;
  const notificationSheetHeight = "90%";

  // Use trainerData if available, fallback to route.params or defaults
  const trainerName = trainerData?.name || trainer?.name;
  const trainerImageUrl = trainerData?.avatar_url || trainer?.imageUrl;
  const trainerDescription = trainerData?.description || trainer?.description;
  const trainerRating = trainerData?.avaliacoesCount || trainer?.rating || 0;
  const trainerVerificado = trainerData?.verificado === true;
  const trainerAddress = trainerData?.address || (trainer as any)?.location || "Endereço não informado";

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
        banner: trainerData?.banner_url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
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
          {/* Imagem como parte do conteúdo do ScrollView */}
          <View style={styles.imageSection}>
            <Image
              source={{ uri: trainerImageUrl || 'https://via.placeholder.com/400' }}
              style={styles.topImage}
              resizeMode="cover"
            />
          </View>

          {/* Card branco com dados - com arredondamento nos 4 cantos */}
          <View style={styles.profileCardSeparated}>
            <View style={styles.mainContent}>
              {/* Nome e descrição */}
              <View style={styles.textLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.nameText}>{trainerName}</Text>
                </View>
                <Text style={styles.titleText}>{trainerDescription}</Text>
              </View>

              {/* Experiência */}
              <View style={styles.singleCardSection}>
                <View style={styles.centerRow}>
                  <BadgeCheck size={30} color="#BBF246" fill="#192126" />
                  <Text style={[styles.textBold]}>
                    {trainerData?.experienceYears || 0} anos de experiência
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Regulamento */}
              <View style={styles.singleCardSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Regulamento</Text>
                </View>
                <View style={styles.credentialsList}>
                  <View style={styles.credentialItem}>
                    <BadgeCheck size={20} color="#fff" fill="#192126" />
                    <Text style={styles.credentialText}>
                      CREF: {trainerData?.cref || "Pendente"}
                    </Text>
                  </View>
                  <View style={styles.credentialItem}>
                    <BadgeCheck size={20} color="#fff" fill="#192126" />
                    <Text style={styles.credentialText}>
                      {trainerData?.formacao || "Formação em Educação Física"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Informações */}
              <View style={styles.singleCardSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Informações</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <View style={styles.infoRow}>
                      <Dumbbell size={20} color="#192126" style={{ marginRight: 8 }} />
                      <Text style={styles.infoText}>
                        {trainerData?.especialidades ?
                          (Array.isArray(trainerData.especialidades) ? trainerData.especialidades[0] : trainerData.especialidades.split(',')[0])
                          : "Musculação"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Calendar size={20} color="#192126" style={{ marginRight: 8 }} />
                      <Text style={styles.infoText}>
                        {trainerData?.agendamentosCount || 0} treinos
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoCol}>
                    <View style={styles.infoRow}>
                      <Award size={20} color="#192126" style={{ marginRight: 8 }} />
                      <Text style={styles.infoText}>{trainerRating} avaliações</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <BadgeCheck size={20} color="#192126" style={{ marginRight: 8 }} />
                      <Text style={styles.infoText}>
                        {trainerVerificado ? "Conta verificada" : "Em análise"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.singleCardSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Dados para contato</Text>
                </View>
                <View style={styles.contactRow}>
                  <MapPin size={20} color="#192126" style={{ marginRight: 8, marginTop: 4 }} />
                  <View style={{ flex: 1 }}>
                    {trainerData?.gym?.nome && (
                      <Text style={[styles.contactText, { fontWeight: "bold", marginBottom: 2 }]}>
                        {trainerData.gym.nome}
                      </Text>
                    )}
                    <Text style={styles.contactText}>
                      {trainerAddress}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Espaço extra para garantir que o card vá até o fundo sem mostrar o "fim" */}
              <View style={{ height: 120 }} />
            </View>
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

      {showNotifications && (
        <NotificationModal
          isVisible={isNotificationModalVisible}
          onClose={toggleNotificationModal}
          sheetHeight={notificationSheetHeight}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "space-between",
  },
  iconButton: {
    padding: 0,
    zIndex: 46,
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  imageSection: {
    width: "100%",
    height: 192,
    position: "relative",
  },
  topImage: {
    width: "100%",
    height: 300,
  },
  contentContainer: {
    flex: 1,
  },
  profileCardSeparated: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 30,
    minHeight: height,
    overflow: "visible",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 0,
    paddingBottom: 150,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  textLeft: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  titleText: {
    fontSize: 16,
    color: "#192126",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BBF246",
    height: 50,
    width: "100%",
    borderRadius: 8,
  },
  textBold: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#192126",
    textAlign: "center",
    justifyContent: "center",
    marginLeft: 10
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#45525F",
    fontWeight: "bold",
  },
  credentialsList: {
    gap: 8,
  },
  credentialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  credentialText: {
    color: "#192126",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontWeight: "500",
    color: "#192126",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contactText: {
    color: "#192126",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  outlineButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#192126",
    backgroundColor: "#192126",
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    flex: 1,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#192126",
    backgroundColor: "#192126",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  singleCardSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
    fontWeight: "500",
  },
});

export default ProfilePJScreen;
