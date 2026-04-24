import React, { useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackButton from "@components/BackButton";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../../contexts/AuthContext";
import { useAppData } from "../../../contexts/AppDataContext";
import StripePlansSheet, {
  StripePlansSheetRef,
} from "../admin/[protected]/components/StripePlansSheet";
import {
  Settings,
  Zap,
  Users,
  Gift,
  Shield,
  Star,
  Clock,
  CheckCircle,
  Lock,
  Unlock,
} from "lucide-react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_GAP = 16; // espaço entre cards
const CARD_WIDTH = SCREEN_WIDTH * 0.75; // largura visual do card
const CARD_ITEM_WIDTH = CARD_WIDTH + CARD_GAP; // snap interval
const CARD_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_GAP / 2; // padding lateral que centraliza

interface Plan {
  id: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  metadata: { plan_type?: string };
}

const PLAN_CONFIG: Record<
  string,
  {
    label: string;
    emoji: string;
    gradient: readonly [string, string, ...string[]];
    accentColor: string;
    textColor: string;
    badge?: string;
    features: { icon: any; text: string }[];
  }
> = {
  free: {
    label: "Gratuito",
    emoji: "🎁",
    gradient: ["#1E293B", "#334155"] as const,
    accentColor: "#94A3B8",
    textColor: "#F8FAFC",
    features: [
      { icon: Clock, text: "Acesso limitado (2 treinos/semana)" },
      { icon: CheckCircle, text: "Perfil pessoal completo" },
      { icon: Users, text: "Acesso a comunidades públicas" },
      { icon: Star, text: "Acompanhamento de progresso básico" },
      { icon: Lock, text: "Planos de dieta bloqueados" },
      { icon: Lock, text: "Telas e conteúdos restritos" },
      { icon: Shield, text: "Suporte básico da comunidade" },
    ],
  },
  premium: {
    label: "Premium",
    emoji: "⚡",
    gradient: ["#BBF246", "#8FD916"] as const,
    accentColor: "#1A2126",
    textColor: "#0F172A",
    badge: "Mais Popular",
    features: [
      { icon: Zap, text: "Treinos e dietas ilimitados" },
      { icon: Unlock, text: "Todas as telas desbloqueadas" },
      { icon: Star, text: "Conteúdos e rotinas exclusivas" },
      { icon: Shield, text: "Suporte profissional prioritário" },
      { icon: CheckCircle, text: "Sem anúncios ou interrupções" },
    ],
  },
  family: {
    label: "Família",
    emoji: "👨‍👩‍👧",
    gradient: ["#818CF8", "#4F46E5"] as const,
    accentColor: "#EDE9FE",
    textColor: "#EEF2FF",
    badge: "Melhor Valor",
    features: [
      { icon: Users, text: "Acesso total para até 10 pessoas" },
      { icon: Unlock, text: "Zero limitações em todas as contas" },
      { icon: Zap, text: "Tudo do plano Premium incluso" },
      { icon: Star, text: "Configurações de grupo exclusivas" },
      { icon: Shield, text: "Suporte prioritário 24/7" },
    ],
  },
  familia: {
    label: "Família",
    emoji: "👨‍👩‍👧",
    gradient: ["#818CF8", "#4F46E5"] as const,
    accentColor: "#EDE9FE",
    textColor: "#EEF2FF",
    badge: "Melhor Valor",
    features: [
      { icon: Users, text: "Acesso total para até 10 pessoas" },
      { icon: Unlock, text: "Zero limitações em todas as contas" },
      { icon: Zap, text: "Tudo do plano Premium incluso" },
      { icon: Star, text: "Configurações de grupo exclusivas" },
      { icon: Shield, text: "Suporte prioritário 24/7" },
    ],
  },
};

const PlanScreen: React.FC = () => {
  const { stripePlans, loadingStripePlans: loading, fetchStripePlans } = useAppData();
  const [subscribing, setSubscribing] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [familyMembers, setFamilyMembers] = React.useState(2);

  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.id === "15" || String(user?.id_us) === "15";
  const adminSheetRef = useRef<StripePlansSheetRef>(null);
  const flatListRef = useRef<FlatList>(null);
  const featuresOpacity = useRef(new Animated.Value(1)).current;

  const getPlanType = (p: Plan | undefined) => {
    if (!p) return "free";
    if (p.metadata?.plan_type) return p.metadata.plan_type.toLowerCase();
    const name = p.name.toLowerCase();
    if (name.includes("gratuito")) return "free";
    if (name.includes("premium")) return "premium";
    if (name.includes("famili") || name.includes("familia")) return "family";
    return "free";
  };

  const getConfig = (planType: string) => PLAN_CONFIG[planType] || PLAN_CONFIG.free;

  useEffect(() => {
    fetchStripePlans();
  }, [fetchStripePlans]);

  const plans = useMemo(() => {
    const order = ["free", "premium", "family", "familia"];
    return [...stripePlans].sort((a: Plan, b: Plan) => {
      const ia = order.indexOf(getPlanType(a));
      const ib = order.indexOf(getPlanType(b));
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [stripePlans]);

  useEffect(() => {
    if (plans.length > 0) {
      const premiumIdx = plans.findIndex((p: Plan) => getPlanType(p) === "premium");
      const defaultIdx = premiumIdx >= 0 ? premiumIdx : 0;
      setActiveIndex(defaultIdx);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: defaultIdx,
          animated: false,
          viewOffset: 0,
        });
      }, 100);
    }
  }, [plans]);

  const animateFeatures = useCallback(() => {
    featuresOpacity.setValue(0);
    Animated.timing(featuresOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [featuresOpacity]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offset / CARD_WIDTH);
      if (idx !== activeIndex) {
        setActiveIndex(idx);
        animateFeatures();
      }
    },
    [activeIndex, animateFeatures]
  );

  const handleSubscribe = async () => {
    const selectedPlan = plans[activeIndex];
    if (!selectedPlan) return;

    const planType = getPlanType(selectedPlan);
    if (planType === "free") {
      Alert.alert("Plano Atual", "Você já está no plano gratuito!");
      return;
    }

    try {
      setSubscribing(true);
      const sessionId = await AsyncStorage.getItem("userSessionId");
      const response = await axios.post(
        `${API_URL}/api/create-checkout-session`,
        {
          priceId: selectedPlan.stripe_price_id,
          quantity: planType === "family" || planType === "familia" ? familyMembers : 1,
        },
        { headers: { Authorization: `Bearer ${sessionId}` } }
      );
      if (response.data.url) {
        await WebBrowser.openBrowserAsync(response.data.url);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setSubscribing(false);
    }
  };

  const activePlan = plans[activeIndex];
  const activePlanType = getPlanType(activePlan);
  const activeConfig = getConfig(activePlanType);
  const isFree = activePlanType === "free";
  const isFamilyPlan = activePlanType === "family" || activePlanType === "familia";

  const renderCard = ({ item, index }: { item: Plan; index: number }) => {
    const pType = getPlanType(item);
    const cfg = getConfig(pType);
    const isActive = index === activeIndex;

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          if (index !== activeIndex) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
            setActiveIndex(index);
            animateFeatures();
          }
        }}
        style={[styles.cardWrapper]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: isActive ? 1 : 0.55,
              transform: [{ scale: isActive ? 1 : 0.9 }],
            },
          ]}
        >
          <LinearGradient
            colors={cfg.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Badge */}
            {cfg.badge && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>✦ {cfg.badge}</Text>
              </View>
            )}

            {/* Emoji */}
            <View style={styles.emojiCircle}>
              <Text style={styles.emojiText}>{cfg.emoji}</Text>
            </View>

            {/* Name */}
            <Text style={[styles.cardPlanName, { color: cfg.textColor }]}>{cfg.label}</Text>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceCurrency, { color: cfg.textColor }]}>R$</Text>
              <Text style={[styles.priceValue, { color: cfg.textColor }]}>
                {(pType === "family" || pType === "familia"
                  ? familyMembers <= 3
                    ? 69.9
                    : familyMembers <= 6
                      ? 124.9
                      : 199.9
                  : item.price
                )
                  .toFixed(2)
                  .replace(".", ",")}
              </Text>
            </View>
            <Text style={[styles.priceInterval, { color: cfg.textColor }]}>
              {pType === "family" || pType === "familia"
                ? `${familyMembers} membros · R$ ${((familyMembers <= 3 ? 69.9 : familyMembers <= 6 ? 124.9 : 199.9) / familyMembers).toFixed(2).replace(".", ",")} cada`
                : item.interval === "year"
                  ? "por ano"
                  : item.interval === "month"
                    ? "por mês"
                    : "acesso limitado"}
            </Text>

            {/* Divider */}
            <View style={[styles.cardDivider, { backgroundColor: cfg.textColor + "33" }]} />

            {/* Mini features preview */}
            <Text style={[styles.cardFeatureCount, { color: cfg.textColor }]}>
              {cfg.features.length} benefícios incluídos
            </Text>

            {/* Selected check */}
            {isActive && (
              <View style={styles.activeIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={cfg.textColor} />
                <Text style={[styles.activeIndicatorText, { color: cfg.textColor }]}>
                  Selecionado
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        bounces={false}
      >
        {/* ─── HERO ─────────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.backBtnWrapper}>
            <BackButton autoTopInset />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="star" size={11} color="#BBF246" />
              <Text style={styles.heroBadgeText}>MOVT Premium</Text>
            </View>
            <Text style={styles.heroTitle}>Escolha seu{"\n"}plano ideal</Text>
            <Text style={styles.heroSubtitle}>Deslize para ver todas as opções</Text>
          </View>
        </View>

        {/* ─── CAROUSEL ─────────────────────────────────────── */}
        <View style={styles.carouselSection}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#BBF246" />
              <Text style={styles.loadingText}>Carregando planos...</Text>
            </View>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={plans}
                renderItem={renderCard}
                keyExtractor={(item, index) => String(item?.id || index)}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_ITEM_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: CARD_PADDING }}
                onMomentumScrollEnd={onScrollEnd}
                getItemLayout={(_, index) => ({
                  length: CARD_ITEM_WIDTH,
                  offset: CARD_ITEM_WIDTH * index,
                  index,
                })}
              />

              {/* Dot indicators */}
              <View style={styles.dotsRow}>
                {plans.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({ index: i, animated: true });
                      setActiveIndex(i);
                      animateFeatures();
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.dot,
                        i === activeIndex ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ─── BENEFITS PANEL ───────────────────────────────── */}
        {!loading && activePlan && (
          <Animated.View style={[styles.benefitsPanel, { opacity: featuresOpacity }]}>
            {/* Header */}
            <LinearGradient
              colors={activeConfig.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.benefitsHeader}
            >
              <Text style={[styles.benefitsHeaderTitle, { color: activeConfig.textColor }]}>
                O que está incluído
              </Text>
              <Text style={[styles.benefitsHeaderSub, { color: activeConfig.textColor + "CC" }]}>
                Plano {activeConfig.label}
              </Text>
            </LinearGradient>

            {/* Features list */}
            <View style={styles.benefitsList}>
              {activeConfig.features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <View key={i} style={styles.benefitRow}>
                    <View style={styles.benefitIconWrap}>
                      <Icon size={18} color="#1A2126" />
                    </View>
                    <Text style={styles.benefitText}>{f.text}</Text>
                  </View>
                );
              })}
            </View>

            {/* Family stepper */}
            {isFamilyPlan && (
              <View style={styles.stepperCard}>
                <Text style={styles.stepperTitle}>👨‍👩‍👧‍👦 Quantidade de membros</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    onPress={() => setFamilyMembers(Math.max(2, familyMembers - 1))}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="remove" size={20} color="#1A2126" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{familyMembers}</Text>
                  <TouchableOpacity
                    onPress={() => setFamilyMembers(Math.min(10, familyMembers + 1))}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="add" size={20} color="#1A2126" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.stepperHint}>
                  Valor total atualizado no card principal e botão abaixo ⚡
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* ─── CTA BUTTON ───────────────────────────────────── */}
        {!loading && (
          <View style={styles.ctaSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubscribe}
              disabled={subscribing || isFree}
              style={styles.ctaWrapper}
            >
              <LinearGradient
                colors={isFree ? ["#94A3B8", "#CBD5E1"] : ["#1A2126", "#2D3748"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {subscribing ? (
                  <ActivityIndicator color="#BBF246" />
                ) : (
                  <>
                    <Ionicons
                      name={isFree ? "checkmark-circle" : "flash"}
                      size={20}
                      color={isFree ? "#fff" : "#BBF246"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.ctaText}>
                      {isFree
                        ? "Plano Atual"
                        : `Assinar ${activeConfig.label} · R$ ${(isFamilyPlan
                            ? familyMembers <= 3
                              ? 69.9
                              : familyMembers <= 6
                                ? 124.9
                                : 199.9
                            : activePlan?.price
                          )
                            .toFixed(2)
                            .replace(".", ",")}`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              Assinatura renovada automaticamente. Cancele quando quiser.{"\n"}
              Pagamento seguro via Stripe 🔒
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ─── ADMIN FAB ────────────────────────────────────── */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.adminFab}
          onPress={() => adminSheetRef.current?.open()}
          activeOpacity={0.8}
        >
          <Settings size={26} color="#000" />
        </TouchableOpacity>
      )}

      {isAdmin && <StripePlansSheet ref={adminSheetRef} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // ── HERO ───────────────────────────────────────────────
  heroContainer: {
    height: 300,
    width: "100%",
  },
  heroImage: { width: "100%", height: "100%" },
  backBtnWrapper: {
    position: "absolute",
    top: 0,
    left: 20,
    zIndex: 10,
  },
  heroContent: {
    position: "absolute",
    bottom: 32,
    left: 24,
    right: 24,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(187,242,70,0.4)",
    marginBottom: 10,
    gap: 5,
  },
  heroBadgeText: {
    color: "#BBF246",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },

  // ── CAROUSEL ───────────────────────────────────────────
  carouselSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  loadingBox: {
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#94A3B8", fontSize: 14 },

  cardWrapper: {
    width: CARD_ITEM_WIDTH,
    paddingRight: CARD_GAP,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  cardGradient: {
    padding: 28,
    minHeight: 280,
  },
  planBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  planBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emojiText: { fontSize: 26 },
  cardPlanName: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 46,
  },
  priceInterval: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.75,
    marginBottom: 16,
  },
  cardDivider: {
    height: 1,
    marginVertical: 16,
    borderRadius: 1,
  },
  cardFeatureCount: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.85,
    marginBottom: 12,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeIndicatorText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // ── DOTS ───────────────────────────────────────────────
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#1A2126",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#CBD5E1",
  },

  // ── BENEFITS ───────────────────────────────────────────
  benefitsPanel: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  benefitsHeader: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  benefitsHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  benefitsHeaderSub: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  benefitsList: {
    padding: 22,
    gap: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },

  // ── FAMILY STEPPER ─────────────────────────────────────
  stepperCard: {
    margin: 16,
    marginTop: 0,
    padding: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E293B",
    minWidth: 36,
    textAlign: "center",
  },
  stepperHint: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
    fontWeight: "500",
  },

  // ── CTA ────────────────────────────────────────────────
  ctaSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  ctaWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#1A2126",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  ctaGradient: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  legalText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 20,
  },

  // ── ADMIN FAB ──────────────────────────────────────────
  adminFab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default PlanScreen;
