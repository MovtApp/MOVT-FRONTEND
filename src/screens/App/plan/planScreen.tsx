import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@components/BackButton";
import { SelectButton } from "@components/SelectButton";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Constants from "expo-constants";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

interface Plan {
  id: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  metadata: {
    plan_type?: string;
  };
}

const { width } = Dimensions.get("window");

const PlanScreen: React.FC = () => {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [subscribing, setSubscribing] = React.useState(false);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = React.useState(2);

  const getPlanType = (p: Plan | undefined) => {
    if (!p) return "free";
    if (p.metadata?.plan_type) return p.metadata.plan_type.toLowerCase();
    const lowerName = p.name.toLowerCase();
    if (lowerName.includes("gratuito")) return "free";
    if (lowerName.includes("premium")) return "premium";
    if (lowerName.includes("famili") || lowerName.includes("familia")) return "family";
    return "free";
  };

  const features = [
    "Crie seu plano de treino personalizado",
    "Acesso a conteúdos exclusivos",
    "Suporte profissional especializado",
    "Atualizações frequentes com novas rotinas",
  ];

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/plans`);
        const sortedPlans = response.data.sort((a: Plan, b: Plan) => {
          const order = ["free", "premium", "family", "familia"];
          const indexA = order.indexOf(getPlanType(a));
          const indexB = order.indexOf(getPlanType(b));
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });
        setPlans(sortedPlans);
        if (sortedPlans.length > 0) {
          // Seleciona o plano Premium por padrão
          const premiumPlan =
            sortedPlans.find((p: Plan) => getPlanType(p) === "premium") ||
            sortedPlans[1] ||
            sortedPlans[0];
          setSelectedPlanId(premiumPlan.id);
        }
      } catch (error) {
        console.error("Erro ao buscar planos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) return;

    if (getPlanType(selectedPlan) === "free") {
      Alert.alert("Sucesso", "Você já está no plano gratuito!");
      return;
    }

    try {
      setSubscribing(true);
      const sessionId = await AsyncStorage.getItem("userSessionId");

      const response = await axios.post(
        `${API_URL}/api/create-checkout-session`,
        {
          priceId: selectedPlan.stripe_price_id,
          quantity: getPlanType(selectedPlan) === "family" ? familyMembers : 1,
        },
        {
          headers: { Authorization: `Bearer ${sessionId}` },
        }
      );

      if (response.data.url) {
        await WebBrowser.openBrowserAsync(response.data.url);
      }
    } catch (error: any) {
      console.error("Erro ao iniciar checkout:", error);
      Alert.alert("Erro", "Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setSubscribing(false);
    }
  };

  const getButtonText = () => {
    if (subscribing) return "";
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (selectedPlan && getPlanType(selectedPlan) === "free") {
      return "Plano Atual";
    }
    return "Inscreva-se";
  };

  const getPlanStyles = (planType: string | undefined, isSelected: boolean) => {
    switch (planType) {
      case "premium":
        return {
          header: styles.bgLime,
          body: styles.bgLightLime,
          selected: isSelected,
        };
      case "family":
      case "familia":
        return {
          header: styles.bgBeige,
          body: styles.bgGrey,
          selected: isSelected,
        };
      default:
        return {
          header: styles.bgBeige,
          body: styles.bgGrey,
          selected: isSelected,
        };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop",
            }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
          <View style={styles.backButtonWrapper}>
            <BackButton />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Plano de Assinatura</Text>
          <Text style={styles.subtitle}>
            Transforme seu treino com um plano que se adapta a você.
          </Text>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plansRow}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando planos...</Text>
              </View>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const planType = getPlanType(plan);
                const planStyles = getPlanStyles(planType, isSelected);

                return (
                  <View
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.shadowCard,
                      planType === "free" && styles.freePlanCard,
                    ]}
                    onTouchEnd={() => {
                      if (planType !== "free") {
                        setSelectedPlanId(plan.id);
                      }
                    }}
                  >
                    <View style={[styles.planHeader, planStyles.header]}>
                      <Text style={styles.planTitle}>{plan.name}</Text>
                    </View>
                    <View style={[styles.planBody, planStyles.body]}>
                      <Text style={[styles.planPeriod, isSelected && styles.textBold]}>
                        {plan.interval === "year"
                          ? "Anual"
                          : plan.interval === "month"
                            ? "Mensal"
                            : "Limitado"}
                      </Text>
                      <Text style={styles.planPrice}>
                        R$ {plan.price.toFixed(2).replace(".", ",")}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedIcon}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {selectedPlanId &&
            getPlanType(plans.find((p) => p.id === selectedPlanId)) === "family" && (
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantidade de membros: {familyMembers}</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    onPress={() => setFamilyMembers(Math.max(2, familyMembers - 1))}
                    style={styles.stepButton}
                  >
                    <Ionicons name="remove" size={20} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{familyMembers}</Text>
                  <TouchableOpacity
                    onPress={() => setFamilyMembers(Math.min(10, familyMembers + 1))}
                    style={styles.stepButton}
                  >
                    <Ionicons name="add" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityHint}>
                  {familyMembers <= 3
                    ? "Faixa 1: R$ 69,90 total"
                    : familyMembers <= 6
                      ? "Faixa 2: R$ 124,90 total"
                      : "Faixa 3: R$ 199,90 total"}
                </Text>
              </View>
            )}

          <SelectButton
            text={getButtonText()}
            onPress={handleSubscribe}
            disabled={
              subscribing ||
              !selectedPlanId ||
              getPlanType(plans.find((p) => p.id === selectedPlanId)) === "free"
            }
            style={[
              styles.subscribeButton,
              selectedPlanId &&
              getPlanType(plans.find((p) => p.id === selectedPlanId)) === "free" &&
              styles.disabledButton,
            ]}
            textStyle={styles.subscribeButtonText}
            icon={subscribing ? <ActivityIndicator color="#FFF" /> : null}
          />

          <Text style={styles.legalText}>
            Pagamento único de R$29,99 anual. O plano será renovado automaticamente, podendo ser
            cancelado a qualquer momento.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    height: 300,
    width: "100%",
    position: "relative",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  backButtonWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 50,
    left: 20,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Rubik_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
    fontFamily: "Rubik_400Regular",
  },
  featuresContainer: {
    marginBottom: 40,
    alignSelf: "center",
    width: "100%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
    fontFamily: "Rubik_500Medium",
  },
  plansRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 10,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
    zIndex: 10,
  },
  planHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  planBody: {
    paddingVertical: 16,
    alignItems: "center",
    height: 100, // Fixed height for alignment
    justifyContent: "center",
  },
  bgBeige: {
    backgroundColor: "#EBECE0",
  },
  bgGrey: {
    backgroundColor: "#F0F2F5",
  },
  bgLime: {
    backgroundColor: "#D0F558",
  },
  bgLightLime: {
    backgroundColor: "#E4F8B7",
  },
  freePlanCard: {
    opacity: 0.7,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.8,
  },
  planTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Rubik_500Medium",
  },
  planPeriod: {
    fontSize: 12,
    color: "#444",
    marginBottom: 4,
    fontFamily: "Rubik_400Regular",
  },
  textBold: {
    fontWeight: "700",
    color: "#000",
    fontFamily: "Rubik_700Bold",
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    fontFamily: "Rubik_700Bold",
  },
  selectedIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  subscribeButton: {
    backgroundColor: "#1A2126",
    width: "100%",
    borderRadius: 12,
    height: 56,
    marginTop: 0,
  },
  subscribeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  legalText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginTop: 16,
    lineHeight: 14,
    paddingHorizontal: 20,
    fontFamily: "Rubik_400Regular",
  },
  loadingContainer: {
    flex: 1,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Rubik_400Regular",
    color: "#666",
  },
  quantityContainer: {
    backgroundColor: "#F0F2F5",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 14,
    fontFamily: "Rubik_500Medium",
    color: "#333",
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E1E3E6",
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 18,
    fontFamily: "Rubik_700Bold",
    marginHorizontal: 24,
    minWidth: 20,
    textAlign: "center",
  },
  quantityHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 12,
    fontFamily: "Rubik_400Regular",
  },
});

export default PlanScreen;
