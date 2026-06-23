import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  FlatList,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLike } from "../../hooks/useLike";
import { useFollow } from "../../hooks/useFollow";
import { userService } from "../../services/userService";
import { api } from "../../services/api";
import { notifyApiError } from "../../utils/notify";
import { getRelativeTime } from "../../utils/timeUtils";
import { styles } from "./styles";
import { COLORS } from "../../styles/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNavigation } from "@react-navigation/native";

interface PostCardProps {
  post: any;
  onShare?: (post: any) => void;
  /** Disparado quando o usuário toca pra abrir comentários. A tela hospedeira
   *  abre um único CommentsSheet centralizado (evita FlatList aninhada em
   *  ScrollView por card). */
  onCommentPress?: (post: any) => void;
}

// ─── PostCard Principal ───────────────────────────────────────────────────────

const PostCard: React.FC<PostCardProps> = ({ post, onShare, onCommentPress }) => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { isLiked, toggleLike } = useLike(post.post_id, Boolean(post.is_liked));
  // const { isFollowing, follow, unfollow } = useFollow(post.author.user_id);

  const insets = useSafeAreaInsets();

  // Refs para detecção de toques (Double Tap)
  const lastTapRef = useRef(0);
  const doubleTapDebounceRef = useRef<any>(null);

  // Estados para Gestão do Post
  const [showPostActions, setShowPostActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); // Para remoção otimista do feed

  const [heartAnim] = useState(new Animated.Value(0));

  // 🔑 Ref que conecta o FlatList ao Swipeable via NativeViewGestureHandler
  const handleShare = async () => {
    console.log("[PostCard] Clique detectado no ícone de enviar. onShare existe?", !!onShare);
    if (onShare) {
      onShare(post);
    } else {
      try {
        console.log("[PostCard] onShare não fornecido, tentando fallback legado...");
        await api.post(`/user/posts/${post.post_id}/share`);
        Alert.alert("Compartilhado", "Post compartilhado com sucesso!");
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
        notifyApiError(error, "Não foi possível compartilhar o post.");
      }
    }
  };

  const handleNavigateToProfile = () => {
    // Navega para o perfil do autor passando os dados necessários
    navigation.navigate("ProfilePFScreen", {
      user: {
        id: post.author.user_id,
        id_us: post.author.user_id,
        username: post.author.username,
        name: post.author.username, // Usando username como fallback para o nome
        photo: post.author.avatar_url,
      },
    });
  };

  const handleHeartPress = () => {
    // O ícone de coração sempre toggla o estado (like/unlike)
    toggleLike();
  };

  const handleMediaPress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    // Se o tempo entre taps for menor que 300ms, considere um double tap
    if (timeSinceLastTap > 0 && timeSinceLastTap < 300) {
      // Limpa o debounce se existir
      if (doubleTapDebounceRef.current) {
        clearTimeout(doubleTapDebounceRef.current);
        doubleTapDebounceRef.current = null;
      }

      // Apenas like (nunca unlike) com double tap
      if (!isLiked) {
        toggleLike();
      }

      // Animação de "pop" do coração
      Animated.sequence([
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 0,
          duration: 150,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start();

      lastTapRef.current = 0; // Reseta para evitar triple tap contando como double
    } else {
      // Single tap - aguarda para ver se vem outro tap
      lastTapRef.current = now;

      // Configura um debounce para caso não venha segundo tap
      doubleTapDebounceRef.current = setTimeout(() => {
        // Single tap confirmado - poderia ter outras ações aqui se necessário
        lastTapRef.current = 0;
        doubleTapDebounceRef.current = null;
      }, 300);
    }
  };

  const handlePostAction = async (action: "edit" | "delete" | "archive") => {
    setShowPostActions(false);

    if (action === "edit") {
      setShowEditModal(true);
      return;
    }

    if (action === "delete") {
      Alert.alert(
        "Excluir publicação",
        "Tem certeza que deseja apagar este post permanentemente?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await userService.deletePost(post.post_id);
                setIsDeleted(true); // Oculta o post localmente
              } catch (error) {
                console.error("Erro ao deletar post:", error);
                Alert.alert("Erro", "Não foi possível excluir o post.");
              }
            },
          },
        ]
      );
    }

    if (action === "archive") {
      try {
        await userService.archivePost(post.post_id);
        setIsDeleted(true); // Arquivar também remove do feed principal
        Alert.alert("Sucesso", "Post arquivado com sucesso!");
      } catch (error) {
        console.error("Erro ao arquivar post:", error);
        Alert.alert("Erro", "Não foi possível arquivar o post.");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editCaption.trim()) return;
    setIsUpdatingPost(true);
    try {
      await userService.updatePost(post.post_id, editCaption);
      // Atualiza o post localmente? Poderíamos disparar um refresh ou apenas
      // atualizar a variável post.caption no view se estivéssemos gerindo por state aqui.
      // Como estamos no feed, o ideal seria atualizar o objeto post
      post.caption = editCaption; // Atualização local forçada
      setShowEditModal(false);
    } catch (error) {
      console.error("Erro ao editar post:", error);
      Alert.alert("Erro", "Não foi possível atualizar o post.");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    if (post.type === "carousel") {
      return (
        <View style={styles.mediaContainer}>
          <FlatList
            data={post.media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={1} onPress={handleMediaPress}>
                <Image source={{ uri: item.media_url }} style={styles.media} />
                {/* Coração Central Animado para Double Tap */}
                <Animated.View
                  style={[
                    styles.overlayHeart,
                    {
                      opacity: heartAnim,
                      transform: [
                        {
                          scale: heartAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1.5],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="heart" size={80} color="#FFF" />
                </Animated.View>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => String(item?.media_id || index)}
          />
        </View>
      );
    }
    return (
      <View style={styles.mediaContainer}>
        <TouchableOpacity activeOpacity={1} onPress={handleMediaPress}>
          <Image
            source={{
              uri: post.media[0]?.media_url || "https://via.placeholder.com/600",
            }}
            style={styles.media}
            resizeMode="cover"
          />
          {/* Coração Central Animado para Double Tap */}
          <Animated.View
            style={[
              styles.overlayHeart,
              {
                opacity: heartAnim,
                transform: [
                  {
                    scale: heartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={80} color="#FFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!user || isDeleted) return null;

  const currentUserId = user.id_us || user.id;
  const isPostOwner = String(post.author.user_id) === String(currentUserId);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.cardHeaderLeft}
          onPress={handleNavigateToProfile}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: post.author.avatar_url || "https://via.placeholder.com/150",
            }}
            style={styles.cardAvatar}
          />
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.cardUsername}>{post.author.username}</Text>
              {post.author.is_verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={COLORS.primary_green}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            {post.location && <Text style={styles.cardLocation}>{post.location}</Text>}
          </View>
        </TouchableOpacity>
        {isPostOwner && (
          <TouchableOpacity onPress={() => setShowPostActions(true)}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.grayscale[45]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Media */}
      <View>{renderMedia()}</View>

      {/* Actions */}
      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleHeartPress} style={styles.actionIcon}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={28}
              color={isLiked ? "#ED4956" : COLORS.grayscale[100]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onCommentPress?.(post)} style={styles.actionIcon}>
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.grayscale[100]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionIcon}>
            <Ionicons name="paper-plane-outline" size={24} color={COLORS.grayscale[100]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats & Caption */}
      <View style={styles.statsContainer}>
        <Text style={styles.likesText}>{parseInt(post.like_count) || 0} curtidas</Text>
        <View style={styles.captionContainer}>
          <Text style={styles.captionUser}>{post.author.username} </Text>
          <Text style={styles.captionText}>{post.caption}</Text>
        </View>
        {post.comment_count > 0 && (
          <TouchableOpacity onPress={() => onCommentPress?.(post)}>
            <Text style={styles.viewComments}>Ver todos os {post.comment_count} comentários</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>{getRelativeTime(post.created_at)}</Text>
      </View>

      {/* ─── Modal de Ações do Post (ActionSheet) ─────────────────────────── */}
      <Modal
        visible={showPostActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPostActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPostActions(false)}
        >
          <View style={[styles.modalContent, { height: "auto", paddingBottom: 40 }]}>
            <View style={styles.modalIndicator} />

            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => handlePostAction("edit")}
            >
              <Ionicons name="pencil-outline" size={22} color={COLORS.grayscale[100]} />
              <Text style={styles.actionSheetText}>Editar Legenda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => handlePostAction("archive")}
            >
              <Ionicons name="archive-outline" size={22} color={COLORS.grayscale[100]} />
              <Text style={styles.actionSheetText}>Arquivar Publicação</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetItem, { borderBottomWidth: 0 }]}
              onPress={() => handlePostAction("delete")}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
              <Text style={[styles.actionSheetText, { color: "#EF4444" }]}>
                Excluir permanentemente
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Modal de Edição de Post (Premium Layout) ─────────────────────────── */}
      <Modal
        visible={showEditModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.grayscale[0] }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Header Triplo */}
            <View style={styles.editHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.editCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.editTitleText}>Editar informações</Text>
              <TouchableOpacity onPress={handleSaveEdit} disabled={isUpdatingPost}>
                {isUpdatingPost ? (
                  <ActivityIndicator size="small" color={COLORS.primary_green} />
                ) : (
                  <Text style={styles.editDoneText}>Concluir</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* Seção do Autor */}
              <View style={styles.editAuthorSection}>
                <Image
                  source={{ uri: post.author.avatar_url || "https://via.placeholder.com/150" }}
                  style={styles.editAuthorPhoto}
                />
                <Text style={styles.editUsername}>{post.author.username}</Text>
              </View>

              {/* Preview de Mídia (Centralizado e Limpo) */}
              <View style={styles.editMediaPreviewContainer}>
                {post.media && post.media.length > 0 ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: "center", paddingVertical: 16 }}
                  >
                    {post.media.map((m: any, index: number) => (
                      <Image
                        key={index}
                        source={{ uri: m.media_url || m.url || m.image_url }}
                        style={styles.editMediaImage}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                ) : (
                  (post.media?.[0]?.media_url || post.url || post.image_url) && (
                    <Image
                      source={{ uri: post.media?.[0]?.media_url || post.url || post.image_url }}
                      style={[styles.editMediaImage, { marginRight: 0 }]}
                      resizeMode="cover"
                    />
                  )
                )}
              </View>

              {/* Input de Legenda */}
              <TextInput
                style={styles.editCaptionInput}
                multiline
                placeholder="Escreva uma legenda..."
                placeholderTextColor={COLORS.grayscale[30]}
                value={editCaption}
                onChangeText={setEditCaption}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default PostCard;
