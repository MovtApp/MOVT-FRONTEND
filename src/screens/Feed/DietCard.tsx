import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  ScrollView,
  Animated,
} from "react-native";
import { Flame, Clock4, Beef, Wheat, Droplets, Heart } from "lucide-react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Swipeable,
  FlatList as GestureHandlerFlatList,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import { useNavigation } from "@react-navigation/native";
import { DietFeedItem } from "../../hooks/useSelfDiets";
import { COLORS } from "../../styles/colors";
import { getRelativeTime } from "../../utils/timeUtils";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import { styles } from "./styles";

interface DietCardProps {
  diet: DietFeedItem;
  onShare?: (data: any) => void;
}

// ─── CommentItem com Swipe-to-Delete (Adaptado do PostCard) ─────────────────
interface DietCommentItemProps {
  item: any;
  currentUserId: string | number;
  dietAuthorId: string | number;
  onDelete: (id: string | number) => void;
}

const DietCommentItem: React.FC<DietCommentItemProps> = ({
  item,
  currentUserId,
  dietAuthorId,
  onDelete,
}) => {
  const isCommentOwner = String(item.user_id) === String(currentUserId);
  const isDietOwner = String(dietAuthorId) === String(currentUserId);
  const canDelete = isCommentOwner || isDietOwner;

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-72, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.swipeDeleteContainer}>
        <TouchableOpacity
          style={styles.swipeDeleteBtn}
          onPress={() => {
            Alert.alert("Excluir comentário", "Tem certeza que deseja excluir este comentário?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Excluir", style: "destructive", onPress: () => onDelete(item.id) },
            ]);
          }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash" size={22} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const content = (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.photo || "https://gravatar.com/avatar?d=identicon" }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
          <Text style={styles.commentUser}>{item.username || "Usuário"}</Text>
          <Text style={styles.commentDate}> · {getRelativeTime(item.created_at)}</Text>
        </View>
        <Text style={styles.commentBody}>{item.comentario}</Text>
      </View>
    </View>
  );

  if (!canDelete) return content;

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {content}
    </Swipeable>
  );
};

const MacroChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View style={stylesLocal.macroChip}>
    {icon}
    <Text style={stylesLocal.macroLabel}>{label}</Text>
    <Text style={stylesLocal.macroValue}>{value}</Text>
  </View>
);

const DietCard: React.FC<DietCardProps> = ({ diet, onShare }) => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const currentUserId = user?.id_us || user?.id;

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(diet.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(diet.comments_count || 0);
  const [loading, setLoading] = useState(false);

  // Estados dos Comentários
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const flatListGestureRef = useRef<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [modalCommentText, setModalCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const handleOpenComments = () => {
    console.log("[DietCard] Opening comments modal for diet:", diet.id_dieta);
    fetchComments();
    setShowCommentsModal(true);
  };
  const [heartAnim] = useState(new Animated.Value(0));

  const lastTapRef = useRef(0);
  const doubleTapDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (diet.isLiked !== undefined) {
      setIsLiked(diet.isLiked);
    }
  }, [diet.isLiked]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [diet.likes, user?.id]);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const response = await api.get(`/dietas/${diet.id_dieta}/comments`);
      console.log(
        `[DietCard] Comentários recebidos p/ dieta ${diet.id_dieta}:`,
        response.data.data?.length || 0
      );
      if (response.data.success && Array.isArray(response.data.data)) {
        setComments(response.data.data);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Erro ao buscar comentários da dieta:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [diet.id_dieta]);

  const handlePress = () => {
    navigation.navigate("DietDetails", {
      meal: {
        id_dieta: diet.id_dieta,
        id: diet.id_dieta,
        title: diet.title,
        calories: diet.calories,
        minutes: diet.minutes,
        imageUrl: diet.imageUrl,
        authorName: diet.authorName,
        authorAvatar: diet.authorAvatar,
        description: diet.description,
        fat: diet.fat,
        protein: diet.protein,
        carbs: diet.carbs,
        categoria: diet.categoria,
        id_us: diet.id_us,
        likes: diet.likes,
        likes_count: likesCount,
        comments_count: commentsCount,
      },
    });
  };

  const handleMediaPress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap > 0 && timeSinceLastTap < 300) {
      if (doubleTapDebounceRef.current) {
        clearTimeout(doubleTapDebounceRef.current);
        doubleTapDebounceRef.current = null;
      }

      // Curtir se ainda não estiver curtido
      if (!isLiked) {
        handleToggleLike();
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

      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      doubleTapDebounceRef.current = setTimeout(() => {
        // Se não houve segundo toque, navega para detalhes
        handlePress();
        lastTapRef.current = 0;
        doubleTapDebounceRef.current = null;
      }, 300);
    }
  };

  const handleToggleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.post(`/dietas/${diet.id_dieta}/like`);
      if (response.data.success) {
        // Atualiza garantindo que o novo estado (boolean) e contagem venham do servidor
        setIsLiked(Boolean(response.data.isLiked));
        setLikesCount(Number(response.data.likes_count));
      }
    } catch (error) {
      console.error("Erro ao curtir dieta:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!modalCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const response = await api.post(`/dietas/${diet.id_dieta}/comment`, {
        texto: modalCommentText,
      });
      if (response.data.success) {
        setModalCommentText("");
        fetchComments();
        setCommentsCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao comentar na dieta:", error);
      Alert.alert("Erro", "Não foi possível enviar o comentário.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    try {
      await api.delete(`/dietas/${diet.id_dieta}/comment/${commentId}`);
      setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao deletar comentário da dieta:", error);
      Alert.alert("Erro", "Não foi possível excluir o comentário.");
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare({
        post_id: diet.id_dieta,
        url: diet.imageUrl,
        caption: diet.description || diet.title,
        author: {
          user_id: diet.id_us,
          username: diet.authorName,
          avatar_url: diet.authorAvatar,
        },
      });
    }
  };

  return (
    <View style={[styles.card, { position: "relative" }]}>
      {/* ── Author row ──────────────────────────────────────────── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Image source={{ uri: diet.authorAvatar }} style={styles.cardAvatar} />
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.cardUsername}>{diet.authorName}</Text>
              {Number(diet.id_us) === Number(user?.id) && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={COLORS.primary_green}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            {diet.categoria ? <Text style={styles.cardLocation}>{diet.categoria}</Text> : null}
          </View>
        </View>
      </View>

      {/* ── Hero image (Isolated Touch Area) ───────────────────── */}
      <View style={stylesLocal.mediaWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleMediaPress}
          style={{ width: "100%", height: "100%" }}
        >
          <Image source={{ uri: diet.imageUrl }} style={stylesLocal.heroImage} resizeMode="cover" />

          {/* Coração Central Animado para Double Tap */}
          <Animated.View
            style={[
              stylesLocal.overlayHeart,
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
            <Heart size={80} color="#FFF" fill="#FFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── Social toolbar (High Priority Layer) ────────────────── */}
      <View style={[styles.actionsBar, { zIndex: 10, position: "relative" }]}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            onPress={handleToggleLike}
            style={styles.actionIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={28}
              color={isLiked ? "#ED4956" : COLORS.grayscale[100]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenComments}
            style={styles.actionIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}
          >
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.grayscale[100]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShareClick}
            style={styles.actionIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="paper-plane-outline" size={24} color={COLORS.grayscale[100]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Container ────────────────────────────────────── */}
      <View style={[styles.statsContainer, { zIndex: 5 }]}>
        <Text style={styles.likesText}>{likesCount} curtidas</Text>

        <View style={stylesLocal.infoPanel}>
          <Text style={stylesLocal.title}>{diet.title}</Text>
          {diet.description ? (
            <Text style={stylesLocal.description} numberOfLines={2}>
              {diet.description}
            </Text>
          ) : null}

          {/* Macros section */}
          <View style={stylesLocal.macrosRow}>
            <MacroChip
              icon={<Flame size={13} color="#F97316" />}
              label="Cal"
              value={diet.calories}
            />
            <View style={stylesLocal.macroDivider} />
            <MacroChip
              icon={<Clock4 size={13} color="#6B7280" />}
              label="Tempo"
              value={diet.minutes}
            />
            <View style={stylesLocal.macroDivider} />
            <MacroChip
              icon={<Beef size={13} color="#EF4444" />}
              label="Prot"
              value={diet.protein}
            />
            <View style={stylesLocal.macroDivider} />
            <MacroChip icon={<Wheat size={13} color="#EAB308" />} label="Carb" value={diet.carbs} />
            <View style={stylesLocal.macroDivider} />
            <MacroChip
              icon={<Droplets size={13} color="#3B82F6" />}
              label="Gord"
              value={diet.fat}
            />
          </View>
        </View>

        {commentsCount > 0 && (
          <TouchableOpacity
            onPress={handleOpenComments}
            hitSlop={{ top: 5, bottom: 5, left: 0, right: 10 }}
          >
            <Text style={styles.viewComments}>Ver todos os {commentsCount} comentários</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timestamp}>{getRelativeTime(diet.created_at)}</Text>
      </View>

      {/* ─── Modal Premium Original de Comentários idêntico ao PostCard ─── */}
      <Modal
        visible={showCommentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalOverlay}>
              {/* Backdrop transparente que fecha o modal */}
              <TouchableOpacity
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                activeOpacity={1}
                onPress={() => setShowCommentsModal(false)}
              />

              <View style={styles.modalContent}>
                <View style={styles.modalIndicator} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Comentários</Text>
                  <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                    <Ionicons name="close" size={24} color={COLORS.grayscale[100]} />
                  </TouchableOpacity>
                </View>

                {loadingComments ? (
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary_green}
                    style={{ marginTop: 40, flex: 1 }}
                  />
                ) : (
                  <GestureHandlerFlatList
                    ref={flatListGestureRef}
                    data={comments}
                    keyExtractor={(item, index) => `diet-comment-${item.id ?? index}`}
                    renderItem={({ item }) => (
                      <DietCommentItem
                        item={item}
                        currentUserId={currentUserId!}
                        dietAuthorId={diet.id_us}
                        onDelete={handleDeleteComment}
                      />
                    )}
                    ListEmptyComponent={
                      <Text style={styles.noComments}>
                        Nenhum comentário nesta dieta. Seja o primeiro! 💬
                      </Text>
                    }
                    style={styles.modalList}
                    contentContainerStyle={
                      comments.length === 0 ? { flex: 1 } : { paddingBottom: 8 }
                    }
                  />
                )}

                {/* Input de Comentário (Tratamento de teclado) */}
                <View
                  style={[
                    styles.commentInputContainer,
                    isKeyboardVisible && Platform.OS === "ios" && { paddingBottom: 8 },
                  ]}
                >
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Escreva um comentário..."
                    placeholderTextColor={COLORS.grayscale[45]}
                    value={modalCommentText}
                    onChangeText={setModalCommentText}
                    onSubmitEditing={handleSubmitComment}
                    returnKeyType="send"
                    editable={!isSubmittingComment}
                  />
                  <TouchableOpacity
                    onPress={handleSubmitComment}
                    disabled={!modalCommentText.trim() || isSubmittingComment}
                    style={styles.sendButton}
                  >
                    {isSubmittingComment ? (
                      <ActivityIndicator size="small" color={COLORS.primary_green} />
                    ) : (
                      <Ionicons
                        name="send"
                        size={20}
                        color={
                          modalCommentText.trim() ? COLORS.primary_green : COLORS.grayscale[30]
                        }
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};

const stylesLocal = StyleSheet.create({
  mediaWrapper: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    zIndex: 1,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.grayscale[5],
  },
  overlayHeart: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -40,
    marginTop: -40,
    zIndex: 10,
    // pointerEvents: "none", // Não disponível em todas versões do RN, mas útil se possível
  },
  infoPanel: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.grayscale[100],
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.grayscale[60],
    lineHeight: 18,
    marginBottom: 10,
  },
  macrosRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  macroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3 as any,
  },
  macroLabel: {
    fontSize: 10,
    color: COLORS.grayscale[45],
    fontWeight: "500",
  },
  macroValue: {
    fontSize: 11,
    color: COLORS.grayscale[80],
    fontWeight: "700",
  },
  macroDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.grayscale[10],
    marginHorizontal: 7,
  },
});

export default DietCard;
