import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Animated,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Flame, Clock, Play } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const CARD_WIDTH = Platform.select({
  ios: 260,
  android: 280,
  default: 300,
}) as number;
const CARD_MARGIN = 16;
const CARD_TOTAL = CARD_WIDTH + CARD_MARGIN;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ExerciseItem {
  id: string;
  title: string;
  calories: string;
  minutes: string;
  imageUrl: string;
}

interface PopularExercisesProps {
  trainings: ExerciseItem[];
  selectedSpecialty: string | null;
  loadingTrainings: boolean;
  onPressExercise?: (exercise: ExerciseItem) => void;
}

// ─── Card individual com animação de pressão ──────────────────────────────────
const ExerciseCard: React.FC<{
  exercise: ExerciseItem;
  onPress?: (exercise: ExerciseItem) => void;
}> = ({ exercise, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(exercise)}
        style={styles.cardPressable}
      >
        <ImageBackground
          source={{ uri: exercise.imageUrl }}
          style={styles.exerciseCard}
          imageStyle={styles.cardImage}
        >
          {/* Gradiente de cima (transparente) para baixo (escuro) */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)", "rgba(0,0,0,0.92)"]}
            locations={[0.2, 0.65, 1]}
            style={styles.gradient}
          >
            {/* Título no meio superior da área do gradiente */}
            <Text style={styles.exerciseTitle} numberOfLines={1}>
              {(exercise.title?.length || 0) > 22
                ? `${exercise.title.substring(0, 22)}...`
                : exercise.title}
            </Text>

            {/* Rodapé: tags + botão play */}
            <View style={styles.cardFooter}>
              <View style={styles.tagsRow}>
                {/* Tag de calorias */}
                <View style={styles.tag}>
                  <Flame size={11} color="#BBF246" strokeWidth={2.2} />
                  <Text style={styles.tagText}>{exercise.calories}</Text>
                </View>

                {/* Tag de minutos */}
                <View style={[styles.tag, styles.tagSpaced]}>
                  <Clock size={11} color="#BBF246" strokeWidth={2.2} />
                  <Text style={styles.tagText}>{exercise.minutes}</Text>
                </View>
              </View>

              {/* Botão play */}
              <TouchableOpacity style={styles.playButton} onPress={() => onPress?.(exercise)}>
                <Play size={13} fill="#192126" color="#192126" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

// ─── Dots de paginação ────────────────────────────────────────────────────────
const PaginationDots: React.FC<{
  count: number;
  activeIndex: number;
}> = ({ count, activeIndex }) => (
  <View style={styles.dotsContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
      />
    ))}
  </View>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const PopularExercises: React.FC<PopularExercisesProps> = ({
  trainings,
  selectedSpecialty,
  loadingTrainings,
  onPressExercise,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / CARD_TOTAL);
      setActiveIndex(Math.max(0, Math.min(index, trainings.length - 1)));
    },
    [trainings.length]
  );

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {selectedSpecialty ? `Treinos de ${selectedSpecialty}` : "Exercícios populares"}
          </Text>
          <View style={styles.activeIndicator} />
        </View>
        {loadingTrainings && <ActivityIndicator size="small" color="#BBF246" />}
      </View>

      {/* Lista horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_TOTAL}
        decelerationRate="fast"
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {trainings.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} onPress={onPressExercise} />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  activeIndicator: {
    width: 30,
    height: 4,
    backgroundColor: "#BBF246",
    borderRadius: 2,
    marginTop: 4,
  },

  // Lista
  listContent: {
    paddingLeft: 2,
    paddingRight: 8,
  },

  // Wrapper com animação de escala
  cardWrapper: {
    marginRight: CARD_MARGIN,
    borderRadius: 20,
  },
  cardPressable: {
    borderRadius: 20,
    overflow: "hidden",
  },

  // Card com imagem de fundo
  exerciseCard: {
    width: CARD_WIDTH,
    height: 160,
  },
  cardImage: {
    borderRadius: 20,
  },

  // Gradiente ocupa todo o card
  gradient: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: "flex-end",
  },

  // Título
  exerciseTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Rodapé
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  tagSpaced: {
    // reutilizando tag base, sem style extra necessário
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // Botão play
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
    marginLeft: 10,
    transform: [{ translateY: -14 }],
  },

  // Dots de paginação
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#192126",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "#D1D5DB",
  },
});

export default React.memo(PopularExercises);
