import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@contexts/AuthContext";
import { Heart, Grid3X3, Bookmark, MessageCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { userService } from "@services/userService";
import BackButton from "@components/BackButton";
import FollowListModal from "@components/FollowListModal";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../../@types/routes";

const { width } = Dimensions.get("window");

const ProfilePFScreen = () => {
  const { user: authUser, updateUser } = useAuth();
  const route = useRoute<RouteProp<AppStackParamList, "ProfilePFScreen">>();
  const navigation = useNavigation<any>();

  // State for fully fetched user data
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [posts, setPosts] = useState<string[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Stats and modal states
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

  // Normalize user data to handle both AuthContext structure and Search results structure
  // Priority: Fetched from DB > Route Param > Auth User
  const baseUser = route.params?.user || authUser;

  // Social state
  const [isFollowing, setIsFollowing] = useState(baseUser?.isFollowing || false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const profileData = {
    id: fetchedUser?.id || baseUser?.id || baseUser?.id_us,
    name: fetchedUser?.name || baseUser?.name || baseUser?.title || "Usuário",
    username: fetchedUser?.username || baseUser?.username || baseUser?.subtitle || "usuario",
    photo: fetchedUser?.photo || baseUser?.photo || baseUser?.image || baseUser?.avatar_url,
    banner: fetchedUser?.banner || baseUser?.banner || baseUser?.banner_url,
    location: fetchedUser?.location || baseUser?.location || "São Paulo",
    job_title: fetchedUser?.job_title || baseUser?.job_title || "Entusiasta Fitness",
    bio: fetchedUser?.bio || baseUser?.bio || null,
  };

  const isOwnProfile = !route.params?.user || String(profileData.id) === String(authUser?.id);

  // Fetch full profile, posts, follow status and stats
  useEffect(() => {
    async function loadFullProfile() {
      const targetId = route.params?.user?.id || route.params?.user?.id_us || authUser?.id;
      if (!targetId) return;

      try {
        setLoadingProfile(true);
        setLoadingPosts(true);
        setLoadingStats(true);

        const promises: Promise<any>[] = [
          userService.getUserProfile(String(targetId)),
          userService.getUserPosts(String(targetId)),
          userService.getUserStats(String(targetId))
        ];

        const [profileRes, postsRes, statsRes] = await Promise.all(promises);

        if (profileRes.success) {
          setFetchedUser(profileRes.data);
          setIsFollowing(profileRes.data.isFollowing); // Update with absolute truth from DB
        }
        if (postsRes.success) {
          setPosts(postsRes.data);
        }
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
      } finally {
        setLoadingProfile(false);
        setLoadingPosts(false);
        setLoadingStats(false);
      }
    }

    loadFullProfile();
  }, [route.params?.user?.id, route.params?.user?.id_us, authUser?.id]);

  const toggleFollow = async () => {
    if (!profileData.id || loadingFollow) return;

    if (isFollowing) {
      Alert.alert(
        "Deixar de seguir",
        `Deseja parar de seguir ${profileData.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Deixar de seguir",
            style: "destructive",
            onPress: async () => {
              try {
                setLoadingFollow(true);
                const res = await userService.unfollowUser(String(profileData.id));
                if (res.success) setIsFollowing(false);
              } catch (error) {
                console.error("Erro ao deixar de seguir:", error);
                Alert.alert("Erro", "Não foi possível deixar de seguir.");
              } finally {
                setLoadingFollow(false);
              }
            }
          }
        ]
      );
      return;
    }

    try {
      setLoadingFollow(true);
      const res = await userService.followUser(String(profileData.id));
      if (res.success) setIsFollowing(true);
    } catch (error) {
      console.error("Erro ao seguir:", error);
      Alert.alert("Erro", "Não foi possível seguir.");
    } finally {
      setLoadingFollow(false);
    }
  };

  const handlePickImage = async (type: "avatar" | "banner") => {
    if (!isOwnProfile) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoadingUpdate(true);
        const imageUri = result.assets[0].uri;

        if (type === "avatar") {
          const response = await userService.updateAvatar(imageUri);
          if (response.success) {
            updateUser({ photo: response.data.photo });
            setFetchedUser((prev: any) => ({ ...prev, photo: response.data.photo }));
            Alert.alert("Sucesso", "Foto de perfil atualizada!");
          }
        } else {
          const response = await userService.updateBanner(imageUri);
          if (response.success) {
            updateUser({ banner: response.data.banner });
            setFetchedUser((prev: any) => ({ ...prev, banner: response.data.banner }));
            Alert.alert("Sucesso", "Banner atualizado!");
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao atualizar imagem:", error);
      Alert.alert("Erro", "Não foi possível atualizar a imagem.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (loadingProfile && !fetchedUser && !route.params?.user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CBFB5E" />
      </View>
    );
  }

  // Placeholder URLs
  const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop";
  const DEFAULT_BANNER = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.backButtonContainer}>
        <BackButton />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Banner de Topo */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: profileData.banner || DEFAULT_BANNER }}
            style={styles.banner}
          />
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => handlePickImage("banner")}
              disabled={loadingUpdate}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>

        {/* Informações do Perfil */}
        <View style={styles.contentWrap}>
          {/* Foto de Perfil + Estatísticas */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileData.photo || DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              {isOwnProfile && (
                <TouchableOpacity
                  onPress={() => handlePickImage("avatar")}
                  disabled={loadingUpdate}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>

            {/* Estatísticas: Posts, Seguidores, Seguindo */}
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItemHorizontal} activeOpacity={0.7}>
                <Text style={styles.statNumber}>
                  {loadingStats ? "..." : stats.posts}
                </Text>
                <Text style={styles.statLabel}>Publicações</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statItemHorizontal}
                onPress={() => {
                  setModalType("followers");
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>
                  {loadingStats ? "..." : stats.followers}
                </Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statItemHorizontal}
                onPress={() => {
                  setModalType("following");
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>
                  {loadingStats ? "..." : stats.following}
                </Text>
                <Text style={styles.statLabel}>Seguindo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nome e Bio */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>{profileData.name}</Text>
            {profileData.bio && (
              <Text style={styles.bioText}>{profileData.bio}</Text>
            )}
          </View>

          {/* Botões de Ação: Seguir e Mensagem */}
          {!isOwnProfile && (
            <View style={styles.followButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.unfollowButton
                ]}
                onPress={toggleFollow}
                disabled={loadingFollow}
              >
                {loadingFollow ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#1E293B" : "#fff"} />
                ) : (
                  <Text style={[
                    styles.followButtonText,
                    isFollowing && styles.unfollowButtonText
                  ]}>
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => Alert.alert("Mensagem", "Funcionalidade de chat em breve!")}
              >
                <Text style={styles.messageButtonText}>Mensagem</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Linha Separadora */}
          <View style={styles.separator} />

          {/* Abas / Categorias */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Posts")}>
              <Grid3X3 color={activeTab === "Posts" ? "#000" : "#94A3B8"} size={22} />
              <Text style={[styles.tabText, activeTab === "Posts" && styles.tabTextActive]}>
                Posts
              </Text>
              {activeTab === "Posts" && <View style={styles.activeLine} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Destaques")}>
              <Heart color={activeTab === "Destaques" ? "#000" : "#94A3B8"} size={22} />
              <Text style={[styles.tabText, activeTab === "Destaques" && styles.tabTextActive]}>
                Destaques
              </Text>
              {activeTab === "Destaques" && <View style={styles.activeLine} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Marcados")}>
              <Bookmark color={activeTab === "Marcados" ? "#000" : "#94A3B8"} size={22} />
              <Text style={[styles.tabText, activeTab === "Marcados" && styles.tabTextActive]}>
                Marcados
              </Text>
              {activeTab === "Marcados" && <View style={styles.activeLine} />}
            </TouchableOpacity>
          </View>

          {/* Grid de Fotos */}
          {loadingPosts ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#CBFB5E" />
            </View>
          ) : (
            <View style={styles.grid}>
              {posts.map((url, index) => (
                <View key={index} style={styles.gridItem}>
                  <Image source={{ uri: url }} style={styles.gridImage} />
                </View>
              ))}
              {posts.length === 0 && (
                <View style={{ width: '100%', alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ color: '#94A3B8' }}>Nenhum post encontrado.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {loadingUpdate && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#CBFB5E" />
        </View>
      )}

      <FollowListModal
        visible={modalVisible}
        type={modalType}
        userId={profileData.id}
        onClose={() => setModalVisible(false)}
        onUserPress={(user) => {
          setModalVisible(false);
          navigation.push("ProfilePFScreen", { user });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContainer: {
    width: "100%",
    height: 150,
  },
  banner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentWrap: {
    paddingHorizontal: 24,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: -55, // Overlap exato da foto com o banner
    marginBottom: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
    flex: 1,
    justifyContent: "space-around",
    marginBottom: 8,
  },
  statItemHorizontal: {
    alignItems: "flex-start",
  },
  settingsButton: {
    backgroundColor: "#F1F5F9",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  nameSection: {
    marginTop: 10,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
  },
  bioText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 20,
  },
  usernameText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  followButtonContainer: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#94A3B8",
    marginTop: 30,
    marginBottom: 30,
    marginHorizontal: -2
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 18,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 15,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  tabText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#000",
  },
  activeLine: {
    position: "absolute",
    bottom: -16,
    width: "40%",
    height: 3,
    backgroundColor: "#CBFB5E",
    borderRadius: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
    paddingBottom: 40,
  },
  gridItem: {
    width: (width - 64) / 2, // Ajustado para contemplar o paddingHorizontal 24 (24*2 + gap 16)
    height: 200,
    marginBottom: 16,
    borderRadius: 25, // Bordas bem arredondadas conforme a imagem
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editProfileButton: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  editProfileText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalScrollContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  editModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  saveButton: {
    backgroundColor: "#CBFB5E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  followButton: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 18,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 36,
  },
  messageButtonText: {
    color: "#1E293B",
    fontWeight: "bold",
    fontSize: 12,
  },
  unfollowButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  unfollowButtonText: {
    color: "#1E293B",
  },
});

export default ProfilePFScreen;
