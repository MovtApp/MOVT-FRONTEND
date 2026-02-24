import React, { useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { Flame, Repeat, Clock, Play } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface Plan {
  imageUrl: string;
  title: string;
  description: string;
  sets: string;
  calories: string;
  id: string;
  category?: string;
}

const planData: Plan[] = [
  {
    id: "1",
    title: "Prancha (Plank)",
    description: "20 - 30 seg",
    sets: "3 séries",
    calories: "9 - 18 Kcal",
    category: "Core",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513125/prancha_g1v30x.png",
  },
  {
    id: "2",
    title: "Bicicleta no ar",
    description: "60 seg",
    sets: "3 séries",
    calories: "18 - 24 Kcal",
    category: "Abdominal",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513124/bicicleta_yqrmzr.png",
  },
  {
    id: "3",
    title: "Elevação de pernas",
    description: "60 seg",
    sets: "3 séries",
    calories: "12 - 18 Kcal",
    category: "Inferiores",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513123/elevacao_vufoer.png",
  },
];

const PlanTile: React.FC<{ plan: Plan; index: number; onPress?: (plan: Plan) => void }> = ({
  plan,
  index,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Medidas ajustadas para preenchimento total
  const portalWidth = 110; // Largura da seção da imagem

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 2, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }, { translateY }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(plan)}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F9FAFB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          {/* Faixa de Acento Lateral */}
          <View style={styles.accentStripe} />

          {/* Área da Imagem Full Height */}
          <View style={[styles.imagePortal, { width: portalWidth }]}>
            <Image
              source={{ uri: plan.imageUrl }}
              style={styles.planImageFull}
              resizeMode="cover"
            />
            {/* Overlay leve para garantir contraste se necessário */}
            <LinearGradient
              colors={["rgba(0,0,0,0.05)", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Área de Conteúdo */}
          <View style={styles.contentArea}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.categoryText}>{plan.category || "Treino"}</Text>
                <Text
                  style={styles.planTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {plan.title}
                </Text>
              </View>
              {/* Índice sempre visível como na imagem 1 */}
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>0{index + 1}</Text>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.badgesGroup}>
                <View style={styles.badge}>
                  <Clock size={10} color="#6B7280" />
                  <Text style={styles.badgeText}>{plan.description}</Text>
                </View>
                <View style={styles.badge}>
                  <Repeat size={10} color="#6B7280" />
                  <Text style={styles.badgeText}>{plan.sets}</Text>
                </View>
                <View style={[styles.badge, styles.caloriesBadge]}>
                  <Flame size={10} color="#BBF246" fill="#BBF246" />
                  <Text style={[styles.badgeText, styles.caloriesText]}>{plan.calories}</Text>
                </View>
              </View>

              {/* Botão Play sempre fixo à direita */}
              <TouchableOpacity style={styles.playIconButton}>
                <Play size={14} fill="#192126" color="#192126" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const PlanCardTraining: React.FC<{ planData?: Plan[]; onPressPlan?: (plan: Plan) => void }> = ({
  planData: propData,
  onPressPlan,
}) => {
  const data = propData || planData;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Plano de Hoje</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>

      <View style={styles.list}>
        {data.map((plan, idx) => (
          <PlanTile key={plan.id} plan={plan} index={idx} onPress={onPressPlan} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingHorizontal: 4,
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
  list: {
    gap: 16,
  },
  cardWrapper: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  planCard: {
    borderRadius: 24,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    height: 120, // Altura fixa para garantir o 100% visual
  },
  accentStripe: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: 4,
    backgroundColor: "#BBF246",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  imagePortal: {
    height: "100%",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  planImageFull: {
    width: "100%",
    height: "100%",
  },
  contentArea: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 16, // Padding volta aqui para os textos
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  categoryText: {
    fontSize: Platform.select({ ios: 10, android: 10 }),
    fontWeight: "800",
    color: "#BBF246",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: Platform.select({ ios: 17, android: 17 }),
    fontWeight: "700",
    color: "#192126",
    flexShrink: 1,
  },
  indexBadge: {
    opacity: 0.15,
  },
  indexText: {
    fontSize: Platform.select({ ios: 18, android: 18 }),
    fontWeight: "900",
    color: "#192126",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgesGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1, // Permite que as badges ocupem o espaço e quebrem se necessário
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  caloriesBadge: {
    backgroundColor: "rgba(187, 242, 70, 0.15)",
  },
  badgeText: {
    fontSize: Platform.select({ ios: 10, android: 9 }),
    fontWeight: "600",
    color: "#4B5563",
  },
  caloriesText: {
    color: "#7DA625",
  },
  playIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
    marginLeft: 12,
  },
});

export default PlanCardTraining;
