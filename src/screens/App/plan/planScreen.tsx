import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";

const PlanScreen: React.FC = () => {
  const features = [
    "Encontre treinadores próximos de você",
    "Participe de comunidades",
    "Agendamento e lembretes automáticos",
    "Histórico de treinos e progresso pessoal",
    "Suporte direto com o treinador via chat",
    "Suporte 24 horas online",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Minha assinatura</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Gerencie seu plano</Text>

          {/* Plan Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>Premium</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Atual</Text>
              </View>
            </View>

            <Text style={styles.planDescription}>
              Para personal trainers, academias de pequeno porte ou estúdios fitness
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.priceSymbol}>R$ </Text>
              <Text style={styles.priceAmount}>80</Text>
              <Text style={styles.pricePeriod}> / mês</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <CheckCircle2 size={20} color="#22C55E" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.manageButton} activeOpacity={0.7}>
              <Text style={styles.manageButtonText}>Gerenciar assinatura</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <FooterVersion style={styles.footer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#192126",
    marginTop: 25,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  badgeText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "600",
  },
  planDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 24,
  },
  priceSymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  pricePeriod: {
    fontSize: 14,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  manageButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  footer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
});

export default PlanScreen;
