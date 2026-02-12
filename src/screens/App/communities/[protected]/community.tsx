import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Calendar, Users, Activity, Trophy, Phone } from "lucide-react-native";
import BackButton from "@components/BackButton";
import { StatsCard } from "@components/StatsCard";
import { AppStackParamList, Community } from "../../../../@types/routes";
import { getCommunityDetails, joinCommunity } from "@services/communityService";
import { useAuth } from "@contexts/AuthContext";

type CommunityDetailsRouteProp = RouteProp<AppStackParamList, "CommunityDetails">;

const { width } = Dimensions.get("window");

const CommunityDetails = () => {
  const { user } = useAuth();
  const route = useRoute<CommunityDetailsRouteProp>();
  const navigation = useNavigation();

  const initialCommunity = route.params?.community;

  const [community, setCommunity] = useState<Community | null>(initialCommunity || null);
  const [members, setMembers] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState<number>(
    initialCommunity ? parseInt(initialCommunity.participantes || "0") : 0
  );
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (initialCommunity?.id_comunidade && user?.sessionId) {
      loadDetails();
    }
  }, [initialCommunity, user]);

  const loadDetails = async () => {
    if (!initialCommunity?.id_comunidade || !user?.sessionId) return;
    try {
      const response = await getCommunityDetails(
        String(initialCommunity.id_comunidade),
        user.sessionId
      );
      // A API retorna { data: comunidade }
      const details = response.data || response;
      setCommunity(details);

      // Por enquanto, vamos usar o número de participantes como total
      // até implementarmos a lista real de membros
      const participantesNum = parseInt(details.participantes || "0");
      setTotalMembers(participantesNum);
      setMembers([]); // Lista vazia por enquanto
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    }
  };

  const handleJoin = async () => {
    if (!community?.id_comunidade || !user?.sessionId) return;
    try {
      setIsJoining(true);
      await joinCommunity(String(community.id_comunidade), user.sessionId);
      await loadDetails();
      Alert.alert("Sucesso", "Você agora faz parte desta comunidade!");
    } catch (error) {
      console.error("Erro ao entrar:", error);
      Alert.alert("Erro", "Não foi possível entrar na comunidade.");
    } finally {
      setIsJoining(false);
    }
  };

  const formatEventDate = (dateString?: string) => {
    if (!dateString) return "Data a definir";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
        .format(date)
        .replace(" ", " às ");
    } catch (e) {
      return dateString;
    }
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
          <StatsCard
            time={community.duracao || "N/A"}
            calories={community.calorias || "N/A"}
            style={{ position: "absolute", bottom: -25 }}
          />
        </View>

        {/* Title & Description */}
        <View style={styles.infoSection}>
          <Text style={styles.communityTitle}>
            {community.nome}{" "}
            {totalMembers
              ? `(${totalMembers})`
              : community.max_participantes
                ? `(${community.max_participantes}+)`
                : "(50+)"}
          </Text>
          <Text style={styles.description}>
            {community.descricao ||
              "Esta comunidade é uma oportunidade para se conectar e desafiar juntos. Organizada por uma comunidade acolhedora, o evento foca no apoio mútuo e no fortalecimento de laços."}
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsHeader}>Detalhes</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Calendar size={20} color="#192126" />
              <Text style={styles.detailText}>{formatEventDate(community.data_evento)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Activity size={20} color="#192126" />
              <Text style={styles.detailText}>
                {community.tipo_comunidade || community.categoria}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Users size={20} color="#192126" />
              <Text style={styles.detailText}>{community.faixa_etaria || "Livre"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Trophy size={20} color="#192126" />
              <Text style={styles.detailText}>{community.premiacao || "Sem premiação"}</Text>
            </View>
          </View>
        </View>

        {/* Contact Data Header */}
        <View style={styles.contactSection}>
          <Text style={styles.contactHeader}>Dados de contato</Text>
          <View style={styles.contactContent}>
            <Text style={styles.contactText}>
              <Text style={styles.boldText}>Início:</Text> {community.local_inicio || "A definir"}
            </Text>
            <Text style={styles.contactText}>
              <Text style={styles.boldText}>Chegada:</Text> {community.local_fim || "A definir"}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={18} color="#059669" />
              <Text style={styles.phoneText}>{community.telefone_contato || "Sem contato"}</Text>
            </View>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <Text style={styles.participantsHeader}>Participantes</Text>
          <View style={styles.participantsRow}>
            <View style={styles.avatarGroup}>
              {members.length > 0 ? (
                members.map((member, index) => (
                  <Image
                    key={member.id_us || index}
                    source={{
                      uri: member.avatar_url || `https://i.pravatar.cc/100?img=${index + 10}`,
                    }}
                    style={[styles.avatar, { marginLeft: index === 0 ? 0 : -15 }]}
                  />
                ))
              ) : (
                <Text style={{ color: "#666", fontSize: 14 }}>Seja o primeiro a participar!</Text>
              )}
            </View>
            <Text style={styles.participantsCount}>
              {totalMembers}/{community.max_participantes || 50} Confirmados
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Join Button */}
        <TouchableOpacity
          style={styles.joinButton}
          activeOpacity={0.8}
          onPress={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>Participar</Text>
          )}
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
    alignItems: "center",
    justifyContent: "center",
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
    alignSelf: "center",
    width: "80%",
    justifyContent: "space-between",
    alignItems: "center",
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
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 30,
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
    marginBottom: 10,
  },
  contactContent: {
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "bold",
    color: "#192126",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },
  phoneText: {
    fontSize: 14,
    color: "#4B5563",
  },
  participantsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  participantsHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 15,
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  avatarGroup: {
    flexDirection: "row",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  participantsCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
    marginBottom: 20,
  },
});

export default CommunityDetails;
