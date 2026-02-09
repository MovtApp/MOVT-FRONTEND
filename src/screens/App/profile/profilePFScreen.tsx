import { useState, useEffect, useRef } from "react";
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
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "@contexts/AuthContext";
import { Heart, Grid3X3, Bookmark, Plus, Camera, MoreVertical, X as CloseIcon, MessageCircle, Send, Trash2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { userService } from "@services/userService";
import BackButton from "@components/BackButton";
import FollowListModal from "@components/FollowListModal";
import PostFormSheet from "@components/PostFormSheet";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../../@types/routes";
import { useProfileCache } from "@/hooks/useChat";

const { width } = Dimensions.get("window");

const ProfilePFScreen = () => {
  const { user: authUser, updateUser } = useAuth();
  const currentUserId = authUser?.id_us || authUser?.id;
  const route = useRoute<RouteProp<AppStackParamList, "ProfilePFScreen">>();
  const navigation = useNavigation<any>();

  // Normalize user data to handle both AuthContext structure and Search results structure
  const baseUser = route.params?.user || authUser;
  const targetUserId = String(route.params?.user?.id || route.params?.user?.id_us || authUser?.id || "");

  // Use global cache for profile data
  const { profile: cachedProfile, updateProfileCache } = useProfileCache(targetUserId);

  // State for fully fetched user data
  const [fetchedUser, setFetchedUser] = useState<any>(cachedProfile);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Initialize posts from params or cache if available
  const [posts, setPosts] = useState<any[]>(() => {
    const sourcePosts = route.params?.user?.posts || cachedProfile?.posts;
    if (sourcePosts) {
      return sourcePosts.filter((p: any) => p.tipo === 'POST' || !p.tipo);
    }
    return [];
  });
  const [loadingPosts, setLoadingPosts] = useState(!route.params?.user?.posts && !cachedProfile?.posts);

  // Initialize highlights and tagged from params or cache
  const [highlights, setHighlights] = useState<any[]>(() => {
    const sourcePosts = route.params?.user?.posts || cachedProfile?.posts;
    if (sourcePosts) {
      return sourcePosts.filter((p: any) => p.tipo === 'DESTAQUE');
    }
    return [];
  });
  const [tagged, setTagged] = useState<any[]>(() => {
    const sourcePosts = route.params?.user?.posts || cachedProfile?.posts;
    if (sourcePosts) {
      return sourcePosts.filter((p: any) => p.tipo === 'MARCADO');
    }
    return [];
  });
  const postSheetRef = useRef<any>(null);
  const [postSheetIndex, setPostSheetIndex] = useState(0);

  // Post setup
  const [isPostSheetOpen, setIsPostSheetOpen] = useState(false);

  // Stats and modal states
  const [stats, setStats] = useState(route.params?.user?.stats || cachedProfile?.stats || { posts: 0, followers: 0, following: 0 });
  const [loadingStats, setLoadingStats] = useState(!route.params?.user?.stats && !cachedProfile?.stats);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);

  // New state for post management
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [viewPostVisible, setViewPostVisible] = useState(false);

  // States for post interactions
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Social state
  const [isFollowing, setIsFollowing] = useState(route.params?.user?.isFollowing || cachedProfile?.isFollowing || baseUser?.isFollowing || false);
  const [loadingFollow, setLoadingFollow] = useState(false);


  // Social states
  // highlights and tagged are now initialized above

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
        // Only set loading if data is not present in params or cache
        const hasData = route.params?.user?.posts || cachedProfile?.posts;
        const hasStats = route.params?.user?.stats || cachedProfile?.stats;

        if (!hasData) setLoadingProfile(true);
        if (!hasData) setLoadingPosts(true);
        if (!hasStats) setLoadingStats(true);

        const promises: Promise<any>[] = [
          userService.getUserProfile(String(targetId)),
          userService.getUserPosts(String(targetId)),
          userService.getUserStats(String(targetId))
        ];

        const [profileRes, postsRes, statsRes] = await Promise.all(promises);

        if (profileRes.success) {
          setFetchedUser(profileRes.data);
          setIsFollowing(profileRes.data.isFollowing);
          updateProfileCache(profileRes.data);
        }
        if (postsRes.success) {
          const allPosts = postsRes.data;
          // Filtra os posts por tipo conforme definido na estrutura do banco
          setPosts(allPosts.filter((p: any) => p.tipo === 'POST' || !p.tipo));
          setHighlights(allPosts.filter((p: any) => p.tipo === 'DESTAQUE'));
          setTagged(allPosts.filter((p: any) => p.tipo === 'MARCADO'));
          updateProfileCache({ posts: allPosts });
        }
        if (statsRes.success) {
          setStats(statsRes.data);
          updateProfileCache({ stats: statsRes.data });
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

  const fetchPosts = async () => {
    const targetId = route.params?.user?.id || route.params?.user?.id_us || authUser?.id;
    if (!targetId) return;
    try {
      setLoadingPosts(true);
      const res = await userService.getUserPosts(String(targetId));
      if (res.success) {
        const allPosts = res.data;
        setPosts(allPosts.filter((p: any) => p.tipo === 'POST' || !p.tipo));
        setHighlights(allPosts.filter((p: any) => p.tipo === 'DESTAQUE'));
        setTagged(allPosts.filter((p: any) => p.tipo === 'MARCADO'));
      }
    } catch (error) {
      console.error("Erro ao atualizar posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

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

  const handleCreatePost = () => {
    setSelectedPost(null); // Garante que é um novo post
    setIsPostSheetOpen(true);
  };

  const handleManagePost = async (post: any) => {
    setSelectedPost(post);
    setViewPostVisible(true);
    setLoadingComments(true);
    try {
      const res = await userService.getComments(String(post.id));
      if (res.success) {
        setComments(res.data);
      }
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleLike = async () => {
    if (!selectedPost || isLiking) return;

    setIsLiking(true);
    const originalPost = { ...selectedPost };

    // Optimistic UI Update
    const newIsLiked = !selectedPost.is_liked;
    const newLikesCount = newIsLiked
      ? Number(selectedPost.likes_count) + 1
      : Math.max(0, Number(selectedPost.likes_count) - 1);

    setSelectedPost((prev: any) => ({
      ...prev,
      is_liked: newIsLiked,
      likes_count: newLikesCount
    }));

    // Update main posts list as well
    setPosts(prev => prev.map(p =>
      p.id === selectedPost.id ? { ...p, is_liked: newIsLiked, likes_count: newLikesCount } : p
    ));

    try {
      const res = await userService.toggleLike(String(selectedPost.id));
      if (!res.success) {
        // Rollback on error
        setSelectedPost(originalPost);
        setPosts(prev => prev.map(p => p.id === originalPost.id ? originalPost : p));
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
      setSelectedPost(originalPost);
      setPosts(prev => prev.map(p => p.id === originalPost.id ? originalPost : p));
    } finally {
      setIsLiking(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedPost || isSendingComment) return;

    setIsSendingComment(true);
    try {
      const res = await userService.addComment(String(selectedPost.id), newComment);
      if (res.success) {
        const commentData = res.data;
        // Adicionar os IDs necessários para controle de exclusão local
        const normalizedComment = {
          ...commentData,
          comment_user_id: currentUserId,
          post_owner_id: selectedPost.id_us // ID do dono do post
        };
        setComments(prev => [...prev, normalizedComment]);
        setNewComment("");

        // Update counts in selectedPost and main list
        setSelectedPost((prev: any) => ({
          ...prev,
          comments_count: Number(prev.comments_count) + 1
        }));
        setPosts(prev => prev.map(p =>
          p.id === selectedPost.id ? { ...p, comments_count: Number(p.comments_count) + 1 } : p
        ));
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
      Alert.alert("Erro", "Não foi possível enviar o comentário.");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      "Excluir Comentário",
      "Deseja remover este comentário?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await userService.deleteComment(commentId);
              if (res.success) {
                setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));
                setSelectedPost((prev: any) => ({
                  ...prev,
                  comments_count: Math.max(0, Number(prev.comments_count) - 1)
                }));
                setPosts(prev => prev.map(p =>
                  p.id === selectedPost.id ? { ...p, comments_count: Math.max(0, Number(p.comments_count) - 1) } : p
                ));
              }
            } catch (error) {
              console.error("Erro ao excluir comentário:", error);
              Alert.alert("Erro", "Não foi possível excluir o comentário.");
            }
          }
        }
      ]
    );
  };

  const handleDeletePost = () => {
    if (!selectedPost?.id) {
      Alert.alert("Erro", "Não foi possível identificar a publicação para exclusão.");
      return;
    }

    Alert.alert(
      "Excluir Publicação",
      "Tem certeza que deseja excluir esta foto permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await userService.deletePost(String(selectedPost.id));
              if (res.success) {
                setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
                setManageModalVisible(false);
                Alert.alert("Sucesso", "Publicação excluída.");
              } else {
                Alert.alert("Erro", res.message || "Não foi possível excluir a publicação.");
              }
            } catch (error) {
              console.error("Erro ao excluir post:", error);
              Alert.alert("Erro", "Ocorreu um problema ao tentar excluir.");
            }
          }
        }
      ]
    );
  };

  const handleEditPost = () => {
    setManageModalVisible(false);
    setIsPostSheetOpen(true);
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

  const renderActiveGrid = () => {
    // Use the posts, highlights, or tagged arrays after filtering them for valid entries
    const getFilteredData = () => {
      let rawData = posts;
      if (activeTab === "Destaques") rawData = highlights;
      if (activeTab === "Marcados") rawData = tagged;

      // Only keep items that are strings (URLs) or objects with a valid URL
      return (rawData || []).filter(item => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        return (item.url || item.image_url);
      });
    };

    const data = getFilteredData();

    if (data.length === 0) {
      let emptyMessage = "Nenhuma publicação ainda";
      if (activeTab === "Destaques") emptyMessage = "Nenhum destaque disponível";
      if (activeTab === "Marcados") emptyMessage = "Nenhuma foto marcada";

      return (
        <View style={styles.emptyContainer}>
          <Camera size={48} color="#CBD5E1" strokeWidth={1.5} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {data.map((item, index) => {
          const imageUri = typeof item === 'string' ? item : (item.url || item.image_url);
          return (
            <TouchableOpacity
              key={item.id || `post-${index}`}
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={() => handleManagePost(item)}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.gridImage}
              // defaultSource removed
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

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
              <View style={styles.statItemHorizontal}>
                <Text style={styles.statNumber}>
                  {loadingStats ? "..." : stats.posts}
                </Text>
                <Text style={styles.statLabel}>Publicações</Text>
              </View>

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

          {/* Botões de Ação: Seguir e Mensagem / Novo Post */}
          {!isOwnProfile ? (
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
          ) : null}

          {/* Linha Separadora */}
          <View style={styles.separator} />

          {/* Abas / Categorias */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab("Posts")}
              activeOpacity={0.7}
            >
              <Grid3X3 color={activeTab === "Posts" ? "#000" : "#94A3B8"} size={20} />
              <Text style={[styles.tabText, activeTab === "Posts" && styles.tabTextActive]}>
                Posts
              </Text>
              {activeTab === "Posts" && <View style={styles.activeLine} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab("Destaques")}
              activeOpacity={0.7}
            >
              <Heart color={activeTab === "Destaques" ? "#000" : "#94A3B8"} size={20} />
              <Text style={[styles.tabText, activeTab === "Destaques" && styles.tabTextActive]}>
                Destaques
              </Text>
              {activeTab === "Destaques" && <View style={styles.activeLine} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab("Marcados")}
              activeOpacity={0.7}
            >
              <Bookmark color={activeTab === "Marcados" ? "#000" : "#94A3B8"} size={20} />
              <Text style={[styles.tabText, activeTab === "Marcados" && styles.tabTextActive]}>
                Marcados
              </Text>
              {activeTab === "Marcados" && <View style={styles.activeLine} />}
            </TouchableOpacity>
          </View>

          {/* Grid de Fotos Dinâmico */}
          {loadingPosts ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#CBFB5E" />
            </View>
          ) : renderActiveGrid()}
        </View>
      </ScrollView>

      {/* Modal de Gerenciamento de Post (Estratégia Profissional) */}
      {manageModalVisible && (
        <View style={styles.loadingOverlay}>
          <View style={styles.manageModal}>
            <Text style={styles.manageTitle}>Opções da Publicação</Text>
            <TouchableOpacity style={styles.manageOption} onPress={handleEditPost}>
              <Text style={styles.manageOptionText}>Editar Legenda</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.manageOption, styles.deleteOption]} onPress={handleDeletePost}>
              <Text style={styles.deleteOptionText}>Excluir Publicação</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelManage}
              onPress={() => setManageModalVisible(false)}
            >
              <Text style={styles.cancelManageText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loadingUpdate && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#CBFB5E" />
        </View>
      )}

      {isOwnProfile && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePost}
          activeOpacity={0.9}
        >
          <Plus color="#0F172A" size={24} />
        </TouchableOpacity>
      )}

      {/* PostFormSheet Portal */}
      <View pointerEvents="box-none" style={styles.sheetPortal}>
        <PostFormSheet
          isOpen={isPostSheetOpen}
          initialData={selectedPost}
          onClose={() => {
            setIsPostSheetOpen(false);
            setSelectedPost(null);
          }}
          bottomSheetRef={postSheetRef}
          sheetIndex={postSheetIndex}
          setSheetIndex={setPostSheetIndex}
          onSuccess={fetchPosts}
        />
      </View>

      {/* Modal de Visualização de Post */}
      <Modal
        visible={viewPostVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setViewPostVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerCloseArea}
            activeOpacity={1}
            onPress={() => setViewPostVisible(false)}
          />
          <View style={styles.viewerContent}>
            <View style={styles.viewerHeader}>
              <View style={styles.viewerUserInfo}>
                <Image
                  source={{ uri: profileData.photo || DEFAULT_AVATAR }}
                  style={styles.viewerAvatar}
                />
                <Text style={styles.viewerUsername}>{profileData.username || profileData.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isOwnProfile && (
                  <TouchableOpacity
                    onPress={() => {
                      setViewPostVisible(false);
                      setManageModalVisible(true);
                    }}
                    style={{ marginRight: 15 }}
                  >
                    <MoreVertical size={20} color="#1E293B" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setViewPostVisible(false)}>
                  <CloseIcon size={24} color="#1E293B" />
                </TouchableOpacity>
              </View>
            </View>

            <Image
              source={{ uri: selectedPost?.url || selectedPost?.image_url }}
              style={styles.viewerImage}
            />

            <View style={styles.viewerFooter}>
              <View style={styles.viewerActions}>
                <TouchableOpacity
                  style={styles.viewerActionItem}
                  onPress={handleToggleLike}
                  disabled={isLiking}
                >
                  <Heart size={22} color={selectedPost?.is_liked ? "#EF4444" : "#1E293B"} fill={selectedPost?.is_liked ? "#EF4444" : "none"} />
                  <Text style={styles.viewerActionText}>{selectedPost?.likes_count || 0}</Text>
                </TouchableOpacity>
                <View style={styles.viewerActionItem}>
                  <MessageCircle size={22} color="#1E293B" />
                  <Text style={styles.viewerActionText}>{selectedPost?.comments_count || 0}</Text>
                </View>
              </View>

              <View style={styles.viewerCaptionRow}>
                <View style={{ flex: 1 }}>
                  {(selectedPost?.legenda || selectedPost?.caption) && (
                    <Text style={styles.viewerCaption}>
                      <Text style={styles.viewerCaptionUsername}>{profileData.username || profileData.name} </Text>
                      {selectedPost.legenda || selectedPost.caption}
                    </Text>
                  )}
                </View>

                {selectedPost?.created_at && (
                  <Text style={styles.viewerDate}>
                    {new Date(selectedPost.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </Text>
                )}
              </View>

              {/* Seção de Comentários */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comentários</Text>
                {loadingComments ? (
                  <ActivityIndicator size="small" color="#CBFB5E" style={{ marginVertical: 10 }} />
                ) : comments.length > 0 ? (
                  <View style={styles.commentsList}>
                    {comments.slice(-5).map((comment) => {
                      const canDelete = currentUserId === comment.comment_user_id ||
                        currentUserId === comment.post_owner_id;

                      return (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.commentText}>
                              <Text style={styles.commentUsername}>{comment.username || comment.name} </Text>
                              {comment.comentario}
                            </Text>
                          </View>
                          {canDelete && (
                            <TouchableOpacity
                              onPress={() => handleDeleteComment(String(comment.id))}
                              style={styles.deleteCommentBtn}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                    {comments.length > 3 && (
                      <Text style={styles.viewMoreComments}>Ver todos os {comments.length} comentários...</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noComments}>Nenhum comentário ainda. Seja o primeiro!</Text>
                )}
              </View>

              {/* Input de Comentário */}
              <View style={styles.commentInputContainer}>
                <Image
                  source={{ uri: authUser?.photo || DEFAULT_AVATAR }}
                  style={styles.inputAvatar}
                />
                <TextInput
                  style={styles.commentInput}
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  disabled={!newComment.trim() || isSendingComment}
                  style={styles.sendButton}
                >
                  <Send size={20} color={newComment.trim() ? "#CBFB5E" : "#94A3B8"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
    top: 40,
    left: 20,
    zIndex: 10,
  },
  bannerContainer: {
    width: "100%",
    height: 180,
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
    marginTop: -50,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#eee",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "space-around",
    marginBottom: 5,
    marginLeft: 10,
    marginTop: 65,
  },
  statItemHorizontal: {
    alignItems: "flex-start",
  },
  nameSection: {
    marginTop: 15,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  bioText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 20,
  },
  followButtonContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  createPostButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createPostButtonText: {
    color: "#1E293B",
    fontWeight: "bold",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  sheetPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: "box-none",
  },
  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginTop: 25,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    flex: 1,
    position: "relative",
  },
  tabText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#1E293B",
  },
  activeLine: {
    position: "absolute",
    bottom: 0,
    width: 40,
    height: 3,
    backgroundColor: "#CBFB5E",
    borderRadius: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
    paddingBottom: 40,
  },
  gridItem: {
    width: (width - 64) / 2,
    height: 220,
    marginBottom: 16,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  followButton: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  messageButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  messageButtonText: {
    color: "#1E293B",
    fontWeight: "bold",
    fontSize: 14,
  },
  unfollowButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  unfollowButtonText: {
    color: "#1E293B",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  manageModal: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 20,
  },
  manageOption: {
    width: "100%",
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  manageOptionText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "bold",
  },
  cancelManage: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelManageText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
  },
  // Post Viewer Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewerContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  viewerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  viewerUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewerImage: {
    width: "100%",
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  viewerFooter: {
    padding: 16,
    backgroundColor: '#fff',
  },
  viewerActions: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20,
  },
  viewerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  viewerCaptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  viewerCaption: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  viewerCaptionUsername: {
    fontWeight: '800',
    color: '#1E293B',
  },
  viewerDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2, // Ajuste fino para alinhar com a primeira linha do texto
  },
  // Comentários
  commentsSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  commentsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  commentsList: {
    gap: 6,
  },
  commentItem: {
    flexDirection: 'row',
  },
  commentText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: '700',
    color: '#1E293B',
  },
  noComments: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  viewMoreComments: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 6,
  },
  sendButton: {
    padding: 6,
  },
  deleteCommentBtn: {
    padding: 4,
    marginLeft: 8,
  }
});

export default ProfilePFScreen;
