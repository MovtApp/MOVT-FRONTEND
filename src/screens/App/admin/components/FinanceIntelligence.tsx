import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CartesianChart, Area, Line, PolarChart, Pie } from "victory-native";
import { LinearGradient as SkiaGradient, vec, Circle } from "@shopify/react-native-skia";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Target,
  TrendingUp,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FinanceIntelligenceProps {
  data: any;
  chartState: any;
  isActive: boolean;
  formatCurrency: (val: number) => string;
}

const FinanceIntelligence: React.FC<FinanceIntelligenceProps> = ({
  data,
  chartState,
  isActive,
  formatCurrency,
}) => {
  const chartData = (
    (data?.chartData?.length ?? 0) > 0 ? data!.chartData : [{ label: "N/A", total: 0 }]
  ).map((item: any) => ({ ...item, label: String(item.label || "") }));

  return (
    <View style={styles.container}>
      {/* ── SEÇÃO: INTELIGÊNCIA FINANCEIRA ── */}
      <View style={styles.biCard}>
        <View style={styles.biHeader}>
          <View>
            <Text style={styles.biTitle}>Receita Stripe</Text>
            <Text style={styles.biSubtitle}>Resumo de transações via plataforma</Text>
          </View>
          <View style={styles.revenueBadge}>
            <DollarSign size={14} color="#10B981" />
            <Text style={styles.revenueValue}>{formatCurrency(data?.revenue?.current || 0)}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <CartesianChart
            data={chartData}
            xKey="label"
            yKeys={["total"]}
            chartPressState={chartState}
            axisOptions={{
              font: null as any,
              tickCount: 5,
              labelOffset: 10,
              labelColor: "#94A3B8",
              lineColor: "#F1F5F9",
            }}
          >
            {({ points, chartBounds }) => (
              <>
                <Area
                  points={points.total}
                  y0={chartBounds.bottom}
                  animate={{ type: "timing", duration: 500 }}
                  curve="monotoneX"
                >
                  <SkiaGradient
                    start={vec(chartBounds.left, chartBounds.top)}
                    end={vec(chartBounds.left, chartBounds.bottom)}
                    colors={["#BBF24660", "#BBF24605"]}
                  />
                </Area>
                <Line
                  points={points.total}
                  color="#BBF246"
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 500 }}
                  curve="monotoneX"
                />
                {isActive && (
                  <Circle
                    cx={chartState.x.position}
                    cy={chartState.y?.total?.position ?? 0}
                    r={6}
                    color="#BBF246"
                  />
                )}
              </>
            )}
          </CartesianChart>
        </View>
      </View>

      <View style={styles.biGrid}>
        {/* Churn Rate */}
        <View style={styles.smallCard}>
          <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
            <Activity size={18} color="#EF4444" />
          </View>
          <Text style={styles.cardLabel}>Churn Rate</Text>
          <View style={styles.cardValueRow}>
            <Text style={styles.cardValue}>{data?.churn?.rate || "0%"}</Text>
            <ArrowUpRight size={14} color="#EF4444" />
          </View>
          <Text style={styles.cardDetail}>{data?.churn?.count || 0} cancelamentos</Text>
        </View>

        {/* LTV */}
        <View style={styles.smallCard}>
          <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
            <Target size={18} color="#16A34A" />
          </View>
          <Text style={styles.cardLabel}>LTV Médio</Text>
          <View style={styles.cardValueRow}>
            <Text style={styles.cardValue}>{formatCurrency(data?.ltv?.value || 0)}</Text>
          </View>
          <Text style={styles.cardDetail}>Vida útil do cliente</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  biCard: {
    backgroundColor: "#192126",
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  biHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  biTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  biSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  revenueBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  revenueValue: {
    color: "#BBF246",
    fontWeight: "900",
    fontSize: 14,
  },
  chartContainer: {
    height: 180,
    width: "100%",
  },
  biGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  cardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#192126",
  },
  cardDetail: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 4,
  },
});

export default FinanceIntelligence;
