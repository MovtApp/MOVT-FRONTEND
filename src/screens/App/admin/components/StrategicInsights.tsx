import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CartesianChart, Bar } from "victory-native";
import {
  TrendingUp,
  BarChart3,
  Target,
  Award,
  ArrowUpRight,
  Globe,
  Zap,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StrategicInsightsProps {
  strategicData: any;
  formatCurrency: (val: number) => string;
}

const StrategicInsights: React.FC<StrategicInsightsProps> = ({ strategicData, formatCurrency }) => {
  const {
    mrr = 0,
    arr = 0,
    growthRate = "+0%",
    projectedRevenue = [],
    topUnits = [],
    engagementScore = 0,
  } = strategicData || {};

  // Mock data for projections if empty
  const projectionData: { label: string; total: number }[] =
    projectedRevenue.length > 0
      ? projectedRevenue.map((d: any) => ({ label: String(d.label), total: Number(d.total) }))
      : [
          { label: "M1", total: mrr * 1.1 },
          { label: "M2", total: mrr * 1.25 },
          { label: "M3", total: mrr * 1.4 },
          { label: "M4", total: mrr * 1.6 },
        ];

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Visão do Proprietário</Text>
      <Text style={styles.mainSubtitle}>Resultados estratégicos e projeções de escala</Text>

      {/* ── RECORRÊNCIA E SAÚDE FINANCEIRA ── */}
      <View style={styles.recurringRow}>
        <View style={styles.mrrCard}>
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>MRR (Mensal)</Text>
            <TrendingUp size={16} color="#BBF246" />
          </View>
          <Text style={styles.cardValue}>{formatCurrency(mrr)}</Text>
          <Text style={styles.cardMeta}>{growthRate} vs mês ant.</Text>
        </View>

        <View style={styles.arrCard}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: "#64748B" }]}>ARR (Anual)</Text>
            <Target size={16} color="#6366F1" />
          </View>
          <Text style={[styles.cardValue, { color: "#1E293B" }]}>{formatCurrency(arr)}</Text>
          <Text style={[styles.cardMeta, { color: "#94A3B8" }]}>Receita projetada 12m</Text>
        </View>
      </View>

      {/* ── PROJEÇÃO DE CRESCIMENTO ── */}
      <View style={styles.projectionCard}>
        <View style={styles.biHeader}>
          <View>
            <Text style={styles.biTitle}>Projeção de Escala</Text>
            <Text style={styles.biSubtitle}>Crescimento estimado para próximos meses</Text>
          </View>
          <BarChart3 size={20} color="#6366F1" />
        </View>

        <View style={{ height: 160, width: "100%", marginTop: 15 }}>
          <CartesianChart
            data={projectionData}
            xKey="label"
            yKeys={["total"]}
            padding={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {({ points, chartBounds }) => (
              <Bar
                points={points.total}
                chartBounds={chartBounds}
                color="#6366F1"
                roundedCorners={{ topLeft: 8, topRight: 8 }}
                animate={{ type: "timing", duration: 1000 }}
              />
            )}
          </CartesianChart>
        </View>
      </View>

      {/* ── TOP PERFORMERS E ENGAJAMENTO ── */}
      <View style={styles.detailsRow}>
        {/* Unidades de Performance */}
        <View style={styles.topUnitsBox}>
          <View style={styles.boxHeader}>
            <Award size={18} color="#F59E0B" />
            <Text style={styles.boxTitle}>Top Unidades</Text>
          </View>

          <View style={styles.unitsList}>
            {(topUnits.length > 0
              ? topUnits
              : [
                  { name: "Matriz Centro", growth: "+12%" },
                  { name: "Unidade Park", growth: "+8%" },
                ]
            ).map((unit: any, i: number) => (
              <View key={i} style={styles.unitItem}>
                <Text style={styles.unitName} numberOfLines={1}>
                  {unit.name}
                </Text>
                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>{unit.growth}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Global Engagement */}
        <View style={styles.engagementBox}>
          <View style={styles.boxHeader}>
            <Zap size={18} color="#BBF246" />
            <Text style={styles.boxTitle}>Engajamento</Text>
          </View>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{engagementScore}%</Text>
            <Text style={styles.scoreLabel}>Health Score</Text>
          </View>
        </View>
      </View>

      {/* ── BOTÃO DE AÇÃO ESTRATÉGICA ── */}
      <TouchableOpacity style={styles.strategicBtn} activeOpacity={0.8}>
        <LinearGradient
          colors={["#1E293B", "#0F172A"]}
          style={styles.btnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Globe size={18} color="#fff" />
        <Text style={styles.btnText}>Exportar Relatório p/ Investidores</Text>
        <ArrowUpRight size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 30,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E293B",
  },
  mainSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 20,
  },
  recurringRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 15,
  },
  mrrCard: {
    flex: 1.2,
    height: 120,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    justifyContent: "center",
  },
  arrCard: {
    flex: 1,
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  cardMeta: {
    fontSize: 10,
    color: "#BBF246",
    fontWeight: "700",
    marginTop: 4,
  },
  projectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 15,
  },
  biHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  biTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  biSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  topUnitsBox: {
    flex: 1.3,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  engagementBox: {
    flex: 1,
    backgroundColor: "#192126",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
  },
  boxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    width: "100%",
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  unitsList: {
    gap: 10,
  },
  unitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 12,
  },
  unitName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    flex: 1,
  },
  unitBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  unitBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#16A34A",
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  scoreLabel: {
    fontSize: 8,
    color: "#94A3B8",
    fontWeight: "700",
    marginTop: -2,
  },
  strategicBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
  },
  btnGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default StrategicInsights;
