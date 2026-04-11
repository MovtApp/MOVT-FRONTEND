import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp, TrendingDown } from "lucide-react-native";

interface KPIItem {
  id: string;
  label: string;
  value: string | number;
  grow: string;
  color: string;
}

interface KPISectionProps {
  financeKpis: KPIItem[];
  formatCurrency: (val: number) => string;
}

const KPISection: React.FC<KPISectionProps> = ({ financeKpis, formatCurrency }) => {
  const renderKPI = (item: KPIItem) => {
    if (!item) return null;

    const isPositive = !item.grow || String(item.grow).startsWith("+");
    const growValue = String(item.grow || "+0%");

    return (
      <View key={String(item.id || Math.random())} style={styles.kpiCard}>
        <LinearGradient
          colors={[(item.color || "#64748B") + "12", "transparent"]}
          style={styles.kpiGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiValue} numberOfLines={1}>
            {typeof item.value === "number"
              ? formatCurrency(item.value)
              : String(item.value || "0")}
          </Text>
          <View style={[styles.growBadge, { backgroundColor: isPositive ? "#DCFCE7" : "#FEE2E2" }]}>
            {isPositive ? (
              <TrendingUp size={10} color="#10B981" />
            ) : (
              <TrendingDown size={10} color="#EF4444" />
            )}
            <Text style={[styles.growText, { color: isPositive ? "#10B981" : "#EF4444" }]}>
              {growValue}
            </Text>
          </View>
        </View>
        <Text style={styles.kpiLabel}>{item.label}</Text>
      </View>
    );
  };

  return <View style={styles.grid}>{financeKpis?.map(renderKPI)}</View>;
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  kpiGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  kpiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#192126",
    flex: 1,
  },
  growBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  growText: {
    fontSize: 9,
    fontWeight: "800",
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default KPISection;
