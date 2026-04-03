import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  X,
  Flame,
  Heart,
  Droplets,
  Moon,
  Zap,
  Footprints,
  Scale,
  Activity,
  ChevronLeft,
  Lock,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../contexts/AuthContext";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const ExpectationRealityScreen: React.FC = () => {
  const { isPremiumPlan, user } = useAuth();
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<"expectation" | "reality">("expectation");

  const stats = {
    expectation: {
      kcal: 318,
      bpm: 112,
      water: 500,
      sleep: "7h30",
      activityPoints: 29.8,
      steps: "2,574",
      weight: 80,
      fat: "8%",
      muscle: "60%",
      bmi: "18,5",
    },
    reality: {
      kcal: 245,
      bpm: 78,
      water: 350,
      sleep: "6h15",
      activityPoints: 22.4,
      steps: "1,890",
      weight: 82.5,
      fat: "10%",
      muscle: "55%",
      bmi: "21.2",
    },
  };

  const currentStats = stats[viewMode];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "expectation" && styles.toggleBtnActive]}
            onPress={() => setViewMode("expectation")}
          >
            <Text
              style={[styles.toggleText, viewMode === "expectation" && styles.toggleTextActive]}
            >
              Expectativa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "reality" && styles.toggleBtnActive]}
            onPress={() => setViewMode("reality")}
          >
            <Text style={[styles.toggleText, viewMode === "reality" && styles.toggleTextActive]}>
              Realidade
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Central Anatomy Section */}
        <View style={styles.anatomySection}>
          <View style={styles.leftStats}>
            <StatItem
              icon={<Flame size={18} color="#FF8C00" />}
              value={currentStats.kcal}
              unit="kcal"
              color="#FF8C00"
            />
            <StatItem
              icon={<Droplets size={18} color="#0EA5E9" />}
              value={currentStats.water}
              unit="ml"
              color="#0EA5E9"
              marginTop={40}
            />
            <StatItem
              icon={<Zap size={18} color="#1E293B" />}
              value={currentStats.activityPoints}
              unit="pt"
              color="#1E293B"
              marginTop={40}
            />
          </View>

          <Animated.View entering={FadeIn.duration(800)} style={styles.imageContainer}>
            <Image
              source={require("../../../assets/muscle_anatomy_body_v2.png")} // Usando a imagem gerada
              style={styles.anatomyImage}
              resizeMode="contain"
            />
          </Animated.View>

          <View style={styles.rightStats}>
            <StatItem
              icon={<Heart size={18} color="#EF4444" />}
              value={currentStats.bpm}
              unit="bpm"
              color="#EF4444"
              align="right"
            />
            <StatItem
              icon={<Moon size={18} color="#6366F1" />}
              value={currentStats.sleep}
              unit=""
              color="#6366F1"
              marginTop={40}
              align="right"
            />
            <StatItem
              icon={<Footprints size={18} color="#1E293B" />}
              value={currentStats.steps}
              unit=""
              color="#1E293B"
              marginTop={40}
              align="right"
            />
          </View>
        </View>

        {/* Weight Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.weightContainer}>
          <View style={styles.weightLabelRow}>
            <Scale size={24} color="#1E293B" />
            <Text style={styles.weightValue}>{currentStats.weight}</Text>
            <Text style={styles.weightUnit}>kg</Text>
          </View>
          <Text style={styles.weightSubText}>Peso total</Text>
        </Animated.View>

        {/* Bottom Metrics Cards */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon={<Flame size={20} color="#fff" />}
            value={currentStats.fat}
            label="Gordura"
            bgColor="#FF8C00"
            delay={300}
          />
          <MetricCard
            icon={<Activity size={20} color="#fff" />}
            value={currentStats.muscle}
            label="Massa M."
            bgColor="#1E293B"
            delay={400}
          />
          <MetricCard
            icon={<Moon size={20} color="#fff" />}
            value={currentStats.bmi}
            label="IMC"
            bgColor="#3B82F6"
            delay={500}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({ icon, value, unit, color, marginTop = 0, align = "left" }: any) => (
  <View
    style={[
      styles.statItem,
      { marginTop, alignItems: align === "left" ? "flex-start" : "flex-end" },
    ]}
  >
    <View style={styles.statHeader}>
      {align === "left" ? icon : null}
      <Text style={[styles.statValue, { color: "#1E293B" }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      {align === "right" ? icon : null}
    </View>
  </View>
);

const MetricCard = ({ icon, value, label, bgColor, delay }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.metricCardWrap}>
    <View style={[styles.metricIconBox, { backgroundColor: bgColor }]}>{icon}</View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 2,
    flex: 1,
    marginHorizontal: 40,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#1E293B",
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: "center",
  },
  anatomySection: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 400,
  },
  imageContainer: {
    width: width * 0.45,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  anatomyImage: {
    width: "100%",
    height: "100%",
  },
  leftStats: {
    paddingLeft: 20,
    flex: 1,
  },
  rightStats: {
    paddingRight: 20,
    flex: 1,
  },
  statItem: {
    width: "100%",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  statUnit: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 6,
  },
  weightContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  weightLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  weightValue: {
    fontSize: 56,
    fontWeight: "900",
    color: "#1E293B",
  },
  weightUnit: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 20,
  },
  weightSubText: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "800",
    marginTop: -8,
  },
  metricsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: 40,
  },
  metricCardWrap: {
    alignItems: "center",
    flex: 1,
  },
  metricIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E293B",
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "700",
    marginTop: -2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  lockContent: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  lockCard: {
    width: "100%",
    borderRadius: 32,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  lockIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(187, 242, 70, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  lockDescription: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  upgradeBtn: {
    backgroundColor: "#BBF246",
    width: "100%",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  upgradeBtnText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "900",
  },
  lockBenefits: {
    alignSelf: "flex-start",
    gap: 8,
  },
  benefitText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default ExpectationRealityScreen;
