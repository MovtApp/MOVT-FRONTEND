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
import { Flame, Clock, Play, ChevronRight, TrendingUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface Plan {
  imageUrl: string;
  title: string;
  description: string;
  level: string;
  calories: string;
  id: string;
}

const planData: Plan[] = [
  {
    id: "1",
    title: "Flexão de braços",
    description: "10 min",
    level: "Iniciante",
    calories: "9 - 18 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/attractive-muscular-guy-doing-push-ups-exercises-workout-outdoors_8353-6810.jpg?t=st=1758299243~exp=1758302843~hmac=866e9287d1c5a35e749499d3834583b6d760a6f73f43fb417f8e6e4902d86482&w=1480",
  },
  {
    id: "2",
    title: "Desenvolvimento Ombro",
    description: "15 min",
    level: "Intermediário",
    calories: "18 - 24 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/back-view-woman-exercising-with-dumbbells_23-2147789670.jpg?t=st=1758299206~exp=1758302806~hmac=bff78dbb457f1c6240bcc258cbbe9b600464ea7ddb82594670b14a3dc2148004&w=1480",
  },
  {
    id: "3",
    title: "Puxada frontal",
    description: "12 min",
    level: "Avançado",
    calories: "12 - 18 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/side-view-man-working-out-gym-with-medical-mask-his-forearm_23-2148769885.jpg?t=st=1758299397~exp=1758302997~hmac=dab2f29800d935c2c137bfb5c63b70efa494456a6f61ba060c7285eef018c745&w=1480",
  },
];

const SmallPlanCard: React.FC<{ plan: Plan; onPress?: () => void }> = ({ plan, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 2, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const getLevelColor = (level: string) => {
    if (level.includes("Iniciante")) return { bg: "rgba(46, 125, 50, 0.1)", text: "#2E7D32" };
    if (level.includes("Intermediário")) return { bg: "rgba(239, 108, 0, 0.1)", text: "#EF6C00" };
    return { bg: "rgba(198, 40, 40, 0.1)", text: "#C62828" };
  };

  const levelStyles = getLevelColor(plan.level);

  // Medidas ajustadas para preenchimento total
  const portalWidth = 110;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }, { translateY }] }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <LinearGradient
          colors={["#FFFFFF", "#F9FAFB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Imagem Full Height */}
          <View style={[styles.imageContainer, { width: portalWidth }]}>
            <Image source={{ uri: plan.imageUrl }} style={styles.cardImage} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.05)"]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <View style={[styles.levelBadge, { backgroundColor: levelStyles.bg }]}>
                <TrendingUp size={10} color={levelStyles.text} />
                <Text style={[styles.levelText, { color: levelStyles.text }]}>
                  {plan.level.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.planTitle} numberOfLines={1}>
              {plan.title}
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={styles.infoText}>{plan.description}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoItem}>
                <Flame size={12} color="#BBF246" fill="#BBF246" />
                <Text style={styles.infoText}>{plan.calories}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <View style={styles.startBadge}>
                <Text style={styles.startText}>Ver detalhes</Text>
                <ChevronRight size={14} color="#6B7280" />
              </View>
            </View>
          </View>

          {/* Botão flutuante sutil no canto */}
          <TouchableOpacity style={styles.playIconButton} onPress={onPress}>
            <Play size={Platform.select({ ios: 12, android: 14 })} fill="#192126" color="#192126" />
          </TouchableOpacity>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

interface TheBestForYouProps {
  planData?: Plan[];
  onPressPlan?: (plan: Plan) => void;
}

const TheBestForYou: React.FC<TheBestForYouProps> = ({ planData: propData, onPressPlan }) => {
  const data = propData || planData;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Melhores treinos para você</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>

      <View style={styles.planCardsContainer}>
        {data.map((plan) => (
          <SmallPlanCard key={plan.id} plan={plan} onPress={() => onPressPlan?.(plan)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: 10,
    marginBottom: 30,
  },
  header: {
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
  planCardsContainer: {
    gap: 16,
  },
  cardWrapper: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    height: 120, // Altura fixa para imagem ocupar 100%
  },
  imageContainer: {
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 12,
    paddingRight: 12,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  planTitle: {
    fontSize: Platform.select({ ios: 17, android: 16 }),
    fontWeight: "800",
    color: "#192126",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  infoText: {
    fontSize: Platform.select({ ios: 11, android: 9 }),
    color: "#9CA3AF",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  startBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  startText: {
    fontSize: Platform.select({ ios: 12, android: 10 }),
    fontWeight: "700",
    color: "#4B5563",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
  },
  levelText: {
    fontSize: Platform.select({ ios: 9, android: 7 }),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  playIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
});

export default TheBestForYou;
