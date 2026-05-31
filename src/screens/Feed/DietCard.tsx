import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { Flame, Clock4, Beef, Wheat, Droplets, Heart } from "lucide-react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { DietFeedItem } from "../../hooks/useSelfDiets";
import { COLORS } from "../../styles/colors";
import { getRelativeTime } from "../../utils/timeUtils";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "./styles";

interface DietCardProps {
  diet: DietFeedItem;
  onShare?: (data: any) => void;
  /** Disparado quando o usuário toca pra abrir comentários. A tela hospedeira
   *  abre um único CommentsSheet centralizado. */
  onCommentPress?: (diet: any) => void;
}

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

const DietCard: React.FC<DietCardProps> = ({ diet, onShare, onCommentPress }) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(diet.likes_count || 0);
  const [commentsCount] = useState(diet.comments_count || 0);
  const [loading, setLoading] = useState(false);

  const handleOpenComments = () => {
    onCommentPress?.(diet);
  };
  const [heartAnim] = useState(new Animated.Value(0));

  const lastTapRef = useRef(0);
  const doubleTapDebounceRef = useRef<any>(null);

  useEffect(() => {
    if (diet.isLiked !== undefined) {
      setIsLiked(diet.isLiked);
    }
  }, [diet.isLiked]);

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
