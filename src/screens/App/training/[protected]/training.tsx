import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Play, Clock, Flame, Zap, Info } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppStackParamList } from "../../../../@types/routes";
import { FooterVersion } from "@components/FooterVersion";
import BackButton from "@components/BackButton";

const { width } = Dimensions.get("window");

type TrainingDetailsRouteProp = RouteProp<AppStackParamList, "TrainingDetails">;
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const TrainingDetails: React.FC = () => {
  const route = useRoute<TrainingDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { training } = route.params || {};

  if (!training) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Treino não encontrado.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnErrorText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const exercicios = training.exercicios || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── Hero Image Section ─── */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri:
                training.imageurl ||
                "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_71_jntmsv.jpg",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.8)", "#fff"]}
            style={styles.heroGradient}
            locations={[0, 0.3, 0.7, 1]}
          />

          {/* Floating Header Controls */}
          <View style={styles.absoluteHeader}>
            <BackButton autoTopInset />
          </View>

          {/* Training Main Info */}
          <View style={styles.heroInfoContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{training.categoria || "Geral"}</Text>
            </View>
            <Text style={styles.mainTitle}>{training.nome}</Text>
          </View>
        </View>

        {/* ─── Stats Dashboard Card ─── */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <View style={[styles.statIconWrap, { backgroundColor: "#EEF2FF" }]}>
                <Clock size={18} color="#6366F1" />
              </View>
              <Text style={styles.statVal}>{training.duracao || "30 min"}</Text>
              <Text style={styles.statLabel}>Tempo</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={[styles.statIconWrap, { backgroundColor: "#FFF7ED" }]}>
                <Flame size={18} color="#F97316" />
              </View>
              <Text style={styles.statVal}>{training.calorias || "250 Kcal"}</Text>
              <Text style={styles.statLabel}>Queima</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={[styles.statIconWrap, { backgroundColor: "#F7FEE7" }]}>
                <Zap size={18} color="#BBF246" fill="#BBF246" />
              </View>
              <Text style={styles.statVal}>{training.nivel || "Iniciante"}</Text>
              <Text style={styles.statLabel}>Dificuldade</Text>
            </View>
          </View>
        </View>

        {/* ─── About Section ─── */}
        <View style={styles.sectionPadding}>
          <View style={styles.rowCenter}>
            <Text style={styles.sectionTitle}>Sobre o Treino</Text>
            <Info size={16} color="#94A3B8" />
          </View>
          <Text style={styles.descriptionText}>
            {training.descricao ||
              "Este treino foi planejado para maximizar seus resultados, focando na técnica correta e na intensidade necessária para sua evolução."}
          </Text>
        </View>

        {/* ─── Exercises List ─── */}
        <View style={styles.sectionPadding}>
          <View style={styles.variationsHeader}>
            <Text style={styles.sectionTitle}>Roteiro de Exercícios</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{exercicios.length} total</Text>
            </View>
          </View>

          {exercicios.length > 0 ? (
            exercicios.map((ex: any, idx: number) => (
              <View key={idx} style={styles.exerciseCard}>
                <View style={styles.exCardHeader}>
                  <View style={styles.exNumberBox}>
                    <Text style={styles.exNumberText}>{String(idx + 1).padStart(2, "0")}</Text>
                  </View>
                  <View style={styles.exMainInfo}>
                    <Text style={styles.exName}>{ex.nome}</Text>
                    <View style={styles.exSpecsRow}>
                      <View style={styles.exSpecItem}>
                        <Text style={styles.exSpecVal}>{ex.series}</Text>
                        <Text style={styles.exSpecLabel}>Séries</Text>
                      </View>
                      <View style={styles.exSpecDot} />
                      <View style={styles.exSpecItem}>
                        <Text style={styles.exSpecVal}>{ex.repeticoes}</Text>
                        <Text style={styles.exSpecLabel}>Reps</Text>
                      </View>
                      {ex.descanso && (
                        <>
                          <View style={styles.exSpecDot} />
                          <View style={styles.exSpecItem}>
                            <Text style={styles.exSpecVal}>{ex.descanso}</Text>
                            <Text style={styles.exSpecLabel}>Rest</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.exPlayTrigger}>
                    <Play size={14} color="#fff" fill="#fff" />
                  </View>
                </View>
                {ex.observacoes && (
                  <View style={styles.obsBox}>
                    <Text style={styles.obsText}>💡 {ex.observacoes}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyExercises}>
              <Zap size={32} color="#E2E8F0" />
              <Text style={styles.emptyText}>
                Este treino ainda não possui exercícios cadastrados.
              </Text>
            </View>
          )}
        </View>

        <FooterVersion style={styles.footer} />
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate("ActiveWorkout", { training })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#BBF246", "#A3E635"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startBtnGradient}
          >
            <Text style={styles.startBtnText}>COMEÇAR AGORA</Text>
            <View style={styles.startBtnArrow}>
              <Play size={12} fill="#1E293B" color="#1E293B" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 20,
    fontWeight: "600",
  },
  backBtnError: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderRadius: 12,
  },
  backBtnErrorText: {
    color: "#fff",
    fontWeight: "700",
  },

  // Hero Section
  heroContainer: {
    height: width * 1.1,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  heroInfoContent: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
  categoryBadge: {
    backgroundColor: "rgba(187, 242, 70, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1E293B",
    textTransform: "uppercase",
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -1,
  },

  // Stats Dashboard
  statsContainer: {
    marginTop: -30,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statVal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F1F5F9",
  },

  // Content Sections
  sectionPadding: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
    fontWeight: "500",
  },

  // Exercises List
  variationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  exerciseCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  exCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  exNumberBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  exNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#94A3B8",
  },
  exMainInfo: {
    flex: 1,
  },
  exName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  exSpecsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exSpecItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exSpecVal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6366F1",
  },
  exSpecLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  exSpecDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  exPlayTrigger: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  obsBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#BBF246",
  },
  obsText: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    lineHeight: 18,
  },
  emptyExercises: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
    paddingHorizontal: 40,
  },

  // Bottom Nav
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 10 : 30,
  },
  startBtn: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  startBtnGradient: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  startBtnArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(30,41,59,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 30,
    alignItems: "flex-start",
  },
});

export default TrainingDetails;
