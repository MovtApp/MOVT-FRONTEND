import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CartesianChart, Line, Bar, PolarChart, Pie } from "victory-native";
import {
  Activity,
  Target,
  TrendingUp,
  Users,
  ArrowUpRight,
  Shield,
  Zap,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DecisionBIProps {
  data: any;
  formatCurrency: (val: number) => string;
  onOpenChurn?: () => void;
  onOpenLTV?: () => void;
  onOpenRevenue?: () => void;
  onOpenUnits?: () => void;
}

const DecisionBI: React.FC<DecisionBIProps> = ({
  data,
  formatCurrency,
  onOpenChurn,
  onOpenLTV,
  onOpenRevenue,
  onOpenUnits,
}) => {
  const planRevenue = data?.planDistribution || [
    { label: "Premium", count: 45, color: "#6366F1" },
    { label: "Ouro", count: 30, color: "#F59E0B" },
    { label: "Basic", count: 25, color: "#94A3B8" },
  ];

  const churnRate = data?.churn?.rate || "0.0";
  const churnCount = data?.churn?.count || 0;
  const ltvValue = data?.ltv?.value || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeaderTitle}>Inteligência Estratégica</Text>

      <View style={styles.row}>
        {/* Card: Saúde do MRR */}
        <TouchableOpacity style={styles.biCard} onPress={onOpenChurn}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
              <TrendingUp size={16} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Churn Rate</Text>
          </View>
          <Text style={styles.cardValue}>{churnRate}%</Text>
          <View style={styles.growthBadge}>
            <ArrowUpRight size={10} color={Number(churnRate) > 5 ? "#EF4444" : "#10B981"} />
            <Text
              style={[styles.growthText, { color: Number(churnRate) > 5 ? "#EF4444" : "#10B981" }]}
            >
              {churnCount} cancelamentos
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card: LTV Projetado */}
        <TouchableOpacity style={styles.biCard} onPress={onOpenLTV}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
              <Target size={16} color="#16A34A" />
            </View>
            <Text style={styles.cardTitle}>LTV Médio</Text>
          </View>
          <Text style={styles.cardValue}>{formatCurrency(ltvValue)}</Text>
          <Text style={styles.cardSub}>Baseado em tempo médio</Text>
        </TouchableOpacity>
      </View>

      {/* Gráfico: Distribuição de Receita por Plano */}
      <TouchableOpacity style={styles.chartCard} onPress={onOpenRevenue}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Mix de Receita</Text>
            <Text style={styles.chartSubtitle}>Impacto financeiro por tipo de plano</Text>
          </View>
          <Zap size={20} color="#F59E0B" />
        </View>

        <View style={styles.pieContainer}>
          <PolarChart data={planRevenue} labelKey={"label"} valueKey={"count"} colorKey={"color"}>
            <Pie.Chart>{({ slice }) => <Pie.Slice {...(slice as any)} />}</Pie.Chart>
          </PolarChart>

          <View style={styles.legendContainer}>
            {planRevenue.map((item: any, i: number) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.label}: {item.count}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {/* Audit de Performance Unidades */}
      <View style={styles.auditCard}>
        <View style={styles.auditHeader}>
          <Text style={styles.auditTitle}>Top Performance (Gyms)</Text>
          <TouchableOpacity onPress={onOpenUnits}>
            <Text style={styles.seeAll}>Ver Auditoria</Text>
          </TouchableOpacity>
        </View>

        {(data?.topUnits || []).slice(0, 2).map((gym: any, i: number) => (
          <View key={i} style={styles.auditRow}>
            <View style={styles.gymInfo}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.gymGrowth}>{gym.grow} crescimento</Text>
            </View>
            <Text style={styles.gymRevenue}>{formatCurrency(gym.rev)}</Text>
          </View>
        ))}
        {!data?.topUnits?.length && (
          <Text style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", padding: 10 }}>
            Nenhuma unidade com dados para este período
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 15,
  },
  biCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  growthText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  cardSub: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 15,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  chartSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
  },
  pieContainer: {
    height: 180,
    flexDirection: "row",
    alignItems: "center",
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  auditCard: {
    backgroundColor: "#192126",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  auditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  seeAll: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "700",
  },
  auditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  gymGrowth: {
    fontSize: 11,
    color: "#10B981",
    marginTop: 2,
  },
  gymRevenue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
});

export default DecisionBI;
