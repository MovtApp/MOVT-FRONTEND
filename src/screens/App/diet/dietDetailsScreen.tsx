import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import {
  Clock4,
  Flame,
  Heart,
  MessageCircle,
  Send,
  MoreVertical,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { CommentsSheet } from "../../../components/CommentsSheet";
import { api } from "../../../services/api";
import { notifyApiError } from "../../../utils/notify";
import { useAuth } from "../../../hooks/useAuth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SharePostSheet from "../../../components/SharePostSheet";
import DietFormSheet from "../../../components/DietFormSheet";
import BackButton from "../../../components/BackButton";
import { COLORS } from "../../../styles/colors";

const { width } = Dimensions.get("window");

interface DietDetailsScreenProps {
  route?: { params?: { meal?: any; mealId?: string | number } };
  navigation?: any;
}

const DietDetailsScreen: React.FC<DietDetailsScreenProps> = ({ route, navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const moreBtnTop =
    Platform.OS === "android"
      ? insets.top > 0
        ? insets.top + 20
        : 40
      : insets.top > 0
        ? insets.top
        : 20;
  const initialMeal = route?.params?.meal || {};
  const [meal, setMeal] = useState(initialMeal);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(meal.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(meal.comments_count || 0);
  const [loading, setLoading] = useState(false);

  // States for Edit Sheet
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const editSheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);

  const shareSheetRef = useRef<any>(null);
  // CommentsSheet montado só quando aberto (autoOpen). Mesmo padrão do FeedScreen:
  // evita o sheet ficar montado/persistente e abre de forma confiável no clique.
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchMealById = async (id: string | number) => {
      setLoading(true);
      try {
        const response = await api.get(`/dietas/${id}`);
        const mealData = response.data.data;
        if (mealData) {
          setMeal(mealData);
          setLikesCount(mealData.likes_count || 0);
          setCommentsCount(mealData.comments_count || 0);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes da dieta por ID:", error);
      } finally {
        setLoading(false);
      }
    };

    const currentId = meal?.id_dieta || meal?.id || route?.params?.mealId;
    if (currentId) {
      fetchMealById(currentId);
    }
  }, [route?.params?.mealId, meal?.id_dieta]);

  useEffect(() => {
    if (meal.isLiked !== undefined) {
      setIsLiked(meal.isLiked);
    } else if (Array.isArray(meal.likes) && user?.id) {
      setIsLiked(meal.likes.map(String).includes(String(user.id)));
    }
  }, [meal.isLiked, meal.likes, user?.id]);

  const description =
    ((meal?.description ?? meal?.details ?? meal?.desc ?? "") as string)?.toString?.().trim?.() ||
    "";

  const planItems = Array.isArray(meal?.planMeals)
    ? meal.planMeals
    : Array.isArray(meal?.plan)
      ? meal.plan
      : [];

  const handleToggleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.post(`/dietas/${meal.id_dieta || meal.id}/like`);
      if (response.data.success) {
        setIsLiked(response.data.isLiked);
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      console.error("Erro ao curtir dieta:", error);
      notifyApiError(error, "Não foi possível curtir a dieta.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShare = () => {
    shareSheetRef.current?.present();
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleMorePress = () => {
    const isOwner = Number(meal.id_us) === Number(user?.id);

    if (isOwner) {
      Alert.alert("Opções da Dieta", "O que você deseja fazer?", [
        { text: "Editar Dieta", onPress: () => handleOpenEdit() },
        { text: "Excluir Dieta", onPress: handleDelete, style: "destructive" },
        { text: "Cancelar", style: "cancel" },
      ]);
    } else {
      Alert.alert("Opções", "Deseja denunciar esta publicação?", [
        { text: "Denunciar", onPress: () => Alert.alert("Sucesso", "Denúncia enviada.") },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  };

  const handleOpenEdit = () => {
    setIsEditSheetOpen(true);
    setSheetIndex(0);
    editSheetRef.current?.expand();
  };

  const handleCloseEdit = () => {
    setIsEditSheetOpen(false);
    setSheetIndex(-1);
    editSheetRef.current?.close();
  };

  const handleDelete = () => {
    Alert.alert("Confirmar exclusão", "Tem certeza que deseja apagar esta dieta?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/dietas/${meal.id_dieta || meal.id}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert("Erro", "Não foi possível excluir a dieta.");
          }
        },
      },
    ]);
  };

  const handleUpdateSuccess = async () => {
    try {
      const id = meal.id_dieta || meal.id;
      const response = await api.get(`/dietas/${id}`);
      if (response.data.data) {
        setMeal(response.data.data);
      }
      Alert.alert("Sucesso", "Dieta atualizada com sucesso!");
      handleCloseEdit();
    } catch (error) {
      handleCloseEdit();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Hero Image Section --- */}
        <View style={styles.heroContainer}>
          {meal?.imageUrl ? (
            <Image source={{ uri: meal.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: "#F1F5F9" }]} />
          )}

          {/* Back Button Component */}
          <View style={styles.backBtnWrapper}>
            <BackButton autoTopInset />
          </View>

          {Number(meal.id_us) === Number(user?.id) && (
            <TouchableOpacity
              style={[styles.moreBtn, { top: moreBtnTop }]}
              onPress={handleMorePress}
            >
              <MoreVertical size={22} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Info Over Image */}
          <View style={styles.heroInfo}>
            {meal?.categoria && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{meal.categoria.toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>{meal?.title || "Refeição"}</Text>
          </View>
        </View>

        {/* --- Main Content --- */}
        <View style={styles.content}>
          {/* Interaction Bar */}
          <View style={styles.interactionBar}>
            <View style={styles.interactionItem}>
              <TouchableOpacity
                onPress={handleToggleLike}
                activeOpacity={0.7}
                style={styles.socialIcon}
              >
                <Heart
                  size={24}
                  color={isLiked ? "#EF4444" : "#64748B"}
                  fill={isLiked ? "#EF4444" : "transparent"}
                />
              </TouchableOpacity>
              <Text style={styles.interactionCount}>{likesCount}</Text>
            </View>

            <View style={styles.interactionItem}>
              <TouchableOpacity
                onPress={handleComment}
                activeOpacity={0.7}
                style={styles.socialIcon}
              >
                <MessageCircle size={24} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.interactionCount}>{commentsCount}</Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenShare}
              activeOpacity={0.7}
              style={styles.socialIcon}
            >
              <Send size={24} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.flexFiller} />

            {/* Author Small */}
            <View style={styles.authorSmall}>
              {meal?.authorAvatar || meal?.avatar_autor_url ? (
                <Image
                  source={{ uri: meal.authorAvatar || meal.avatar_autor_url }}
                  style={styles.authorAvatarSm}
                />
              ) : null}
              <Text style={styles.authorNameSm}>
                {meal?.authorName || meal?.nome_autor || "MOVT User"}
              </Text>
            </View>
          </View>

          {/* Key Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Flame size={20} color="#F97316" fill="#F97316" />
              <View>
                <Text style={styles.statVal}>{meal?.calories || "—"}</Text>
                <Text style={styles.statLabel}>kcal</Text>
              </View>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statBox}>
              <Clock4 size={20} color="#3B82F6" />
              <View>
                <Text style={styles.statVal}>{meal?.minutes || "—"}</Text>
                <Text style={styles.statLabel}>minutos</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.paragraph}>{description || "Sem descrição disponível."}</Text>

          {/* Macro Grid */}
          <Text style={styles.sectionTitle}>Macronutrientes</Text>
          <View style={styles.macroGrid}>
            <View style={[styles.macroItem, { backgroundColor: "#E0F2FE" }]}>
              <Beef size={20} color="#0369A1" />
              <Text style={styles.macroValueText}>{meal?.protein || "0"}</Text>
              <Text style={styles.macroLabelText}>Proteína</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: "#FEF3C7" }]}>
              <Wheat size={20} color="#B45309" />
              <Text style={styles.macroValueText}>{meal?.carbs || "0"}</Text>
              <Text style={styles.macroLabelText}>Carboidrato</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: "#FCE7F3" }]}>
              <Droplets size={20} color="#BE185D" />
              <Text style={styles.macroValueText}>{meal?.fat || "0"}</Text>
              <Text style={styles.macroLabelText}>Gordura</Text>
            </View>
          </View>

          {/* Plano de refeições */}
          {planItems?.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Plano associado</Text>
                <Text style={styles.itemsCount}>{planItems.length} itens</Text>
              </View>
              <View style={styles.planList}>
                {planItems.map((item: any, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.planCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (navigation?.push) {
                        navigation.push("DietDetails", {
                          meal: { ...meal, ...item },
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: item.imageUrl || meal.imageUrl }}
                      style={styles.planImage}
                    />
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.planStats}>
                        <Text style={styles.planStatText}>{item.calories || "—"} kcal</Text>
                        <View style={styles.dot} />
                        <Text style={styles.planStatText}>{item.minutes || "—"} min</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Share Sheet Portal */}
      <SharePostSheet
        postData={{
          id: meal.id_dieta || meal.id,
          url: meal.imageUrl,
          legenda: meal.description || meal.title,
          author_id: meal.id_us,
          author_name: meal.authorName,
          author_avatar: meal.authorAvatar,
        }}
        bottomSheetRef={shareSheetRef}
      />

      {/* Edit Form Sheet */}
      {isEditSheetOpen && (
        <View pointerEvents="box-none" style={styles.sheetPortal}>
          <DietFormSheet
            isOpen={isEditSheetOpen}
            onClose={handleCloseEdit}
            initialData={meal}
            bottomSheetRef={editSheetRef}
            sheetIndex={sheetIndex}
            setSheetIndex={setSheetIndex}
            onSuccess={handleUpdateSuccess}
          />
        </View>
      )}

      {/* Sheet centralizado de comentários — montado só quando aberto. autoOpen
          abre no mount; onClose desmonta quando o usuário fecha. */}
      {showComments && (
        <CommentsSheet
          type="diet"
          targetId={meal.id_dieta || meal.id}
          authorId={meal.id_us}
          autoOpen
          onClose={() => setShowComments(false)}
          onCountChange={(delta) => setCommentsCount((prev: number) => Math.max(0, prev + delta))}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heroContainer: {
    height: width * 0.9,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  categoryBadge: {
    backgroundColor: "#BBF246",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  categoryText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  backBtnWrapper: {
    position: "absolute",
    top: 0,
    left: 20,
    zIndex: 100,
  },
  moreBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  content: {
    marginTop: -20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  interactionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  interactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  socialIcon: {
    padding: 2,
  },
  interactionCount: {
    marginLeft: 6,
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  flexFiller: {
    flex: 1,
  },
  authorSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  authorAvatarSm: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  authorNameSm: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: -4,
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
    marginTop: 8,
  },
  itemsCount: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  paragraph: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 20,
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  macroItem: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  macroValueText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 8,
  },
  macroLabelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planList: {
    gap: 12,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 10,
  },
  planImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  planInfo: {
    marginLeft: 12,
    flex: 1,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  planStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  planStatText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 6,
  },
  sheetPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: "box-none",
  },
  // Modal Comments Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.grayscale[0],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "70%",
    paddingTop: 12,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.grayscale[20],
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[10],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.grayscale[100],
  },
  modalList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grayscale[5],
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.grayscale[100],
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
    color: COLORS.grayscale[30],
    lineHeight: 18,
  },
  commentBody: {
    fontSize: 13,
    color: COLORS.grayscale[80],
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.grayscale[10],
    backgroundColor: COLORS.grayscale[0],
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 11,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.grayscale[5],
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.grayscale[100],
  },
  sendButton: {
    marginLeft: 12,
    padding: 4,
  },
  postButton: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary_green,
    marginLeft: 10,
  },
  noComments: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.grayscale[45],
    fontSize: 14,
  },
  // Swipe-to-delete styles
  swipeDeleteContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    backgroundColor: "#EF4444",
    borderRadius: 0,
  },
  swipeDeleteBtn: {
    width: 72,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DietDetailsScreen;
