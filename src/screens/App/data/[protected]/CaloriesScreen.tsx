import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import TimeSelector from "../../../../components/TimeSelector";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { CartesianChart, Area, Line } from "victory-native";
import { G, Text as SvgText, Circle } from "react-native-svg";
import {
  getCaloriesData,
  type TimeframeType,
  type CalorieStats,
} from "../../../../services/caloriesService";

type GraphDataItem = {
  value: number;
  label: string;
  index: number;
  rawDate: string;
};

interface CustomLabelProps {
  x: number;
  y: number;
  datum: GraphDataItem;
}

const { width } = Dimensions.get("window");

const CustomLabel: React.FC<CustomLabelProps> = ({ x, y, datum }) => {
  if (!datum.label) return null;
  if (x == null || y == null) return null;

  return (
    <SvgText x={x} y={y - 15} fontSize={10} fill="#FF7D00" textAnchor="middle" fontWeight="bold">
      {String(datum.label)}
    </SvgText>
  );
};

// Lista ordenada das telas de dados para navegação
const DATA_SCREENS: (keyof AppStackParamList)[] = [
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "WaterScreen",
];

const CaloriesScreen: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>("1d");
  const [caloriesStats, setCaloriesStats] = useState<CalorieStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [graphData, setGraphData] = useState<GraphDataItem[]>([]);
  const [chartDomain, setChartDomain] = useState<[number, number]>([0, 2000]);
  const isLoadingRef = useRef(false);
  const [isChartReady, setIsChartReady] = useState(false);

  // Busca dados do backend
  const fetchCaloriesData = async (timeframe: TimeframeType) => {
    // Previne múltiplas chamadas simultâneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      const data = await getCaloriesData(timeframe);

      // Para o gráfico, mostra os valores de calorias conforme coletados
      // No timeframe "1d", cada ponto representa as calorias gastas até aquele momento do dia
      // Os valores já vêm do backend como progressão acumulada ao longo do tempo
      const processedData = data.data.map((item, index) => ({
        value: item.calories,
        label: "", // Será definido depois na preparação dos dados
        index,
        rawDate: item.date,
      }));

      // Domínio com base nos valores reais do eixo Y
      const dailyGoal = data.dailyGoal || 2000;
      const maxValue =
        processedData.length > 0 ? Math.max(...processedData.map((d) => d.value)) : dailyGoal;
      // Define o domínio com base nos valores reais dos dados
      const maxDomain = Math.max(dailyGoal, maxValue + 100);
      const newDomain: [number, number] = [0, maxDomain];

      // Atualiza estados de forma agrupada para evitar renderizações múltiplas
      setCaloriesStats(data);
      setGraphData(processedData);
      setChartDomain(newDomain);

      // Agenda renderização do gráfico após todas as interações/atualizações
      InteractionManager.runAfterInteractions(() => {
        setIsChartReady(true);
      });
    } catch (error) {
      console.error("Erro ao buscar dados de calorias:", error);
      setIsChartReady(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  // Busca inicial
  useEffect(() => {
    setIsChartReady(false);
    let isMounted = true;

    if (isMounted && !isLoadingRef.current) {
      fetchCaloriesData(selectedTimeframe);
    }

    return () => {
      isMounted = false;
      setIsChartReady(false);
    };
  }, [selectedTimeframe]);

  // Pull to refresh
  const onRefresh = async () => {
    if (isLoadingRef.current) {
      setIsRefreshing(false);
      return;
    }
    setIsRefreshing(true);
    await fetchCaloriesData(selectedTimeframe);
    setIsRefreshing(false);
  };

  // Preparação dos dados do gráfico - mostra todos os pontos com labels nos principais
  const displayGraphData = useMemo(() => {
    if (graphData.length === 0) {
      return [];
    }

    return graphData.map((item, index, array) => {
      // Mostra labels nos pontos principais: primeiro, último, e alguns pontos estratégicos
      const totalPoints = array.length;

      // Determina quais pontos devem mostrar labels
      const shouldShowLabel =
        index === 0 ||
        index === totalPoints - 1 ||
        (totalPoints > 3 && index === Math.floor(totalPoints / 2)) ||
        (totalPoints > 6 && index === Math.floor(totalPoints / 3)) ||
        (totalPoints > 6 && index === Math.floor((totalPoints * 2) / 3));

      return {
        ...item,
        label: shouldShowLabel && item.value != null ? item.value.toString() : "",
        index: index,
      };
    });
  }, [graphData]);

  // Componente memoizado do gráfico para evitar re-renderizações desnecessárias
  const ChartComponent = useMemo(() => {
    if (!isChartReady || displayGraphData.length === 0 || chartDomain[1] <= 0) {
      return null;
    }

    return (
      <CartesianChart
        data={displayGraphData}
        xKey="index"
        yKeys={["value"]}
        padding={{ top: 40, right: 20, bottom: 20, left: 50 }}
        domainPadding={{
          left: 20,
          right: 20,
        }}
        axisOptions={{
          tickCount: 5, // Define fixed number of Y-axis ticks
          formatXLabel: (value) => {
            // Formata os labels do eixo X conforme necessário
            const index = Number(value);
            if (index >= 0 && index < displayGraphData.length) {
              return displayGraphData[index]?.rawDate || "";
            }
            return value.toString();
          },
          formatYLabel: (value) => {
            // Formata os labels do eixo Y para exibir os valores reais
            return Math.round(Number(value)).toString();
          },
        }}
        domain={{
          y: chartDomain,
        }}
      >
        {({ points, yScale }) => {
          if (!points || !points.value || points.value.length === 0 || !yScale) {
            return null;
          }
          try {
            const bottomY = yScale(chartDomain[0]);
            if (typeof bottomY !== "number" || isNaN(bottomY)) {
              return null;
            }
            return (
              <G>
                <Area
                  points={points.value}
                  color="rgba(255, 125, 0, 0.2)"
                  curveType="catmullRom"
                  y0={bottomY}
                />
                <Line
                  points={points.value}
                  color="#FF7D00"
                  strokeWidth={4}
                  curveType="catmullRom"
                />
                {/* Renderiza pontos com labels */}
                {displayGraphData.map((datum, index) => {
                  const point = points.value[index];
                  if (
                    !point ||
                    !datum.label ||
                    datum.label === "" ||
                    typeof point.x !== "number" ||
                    typeof point.y !== "number"
                  ) {
                    return null;
                  }
                  return (
                    <G key={`label-${index}`}>
                      <CustomLabel x={point.x} y={point.y} datum={datum} />
                      {/* Círculo no ponto */}
                      <Circle
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill="#FF7D00"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </G>
                  );
                })}
              </G>
            );
          } catch (error) {
            console.error("Erro ao renderizar gráfico:", error);
            return null;
          }
        }}
      </CartesianChart>
    );
  }, [isChartReady, displayGraphData, chartDomain]);

  if (isLoading && !caloriesStats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton to={{ name: "DataScreen" }} />
            <Text style={styles.headerTitle}>Calorias (Kcal)</Text>
            <View style={{ width: 46 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7D00" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton to={{ name: "DataScreen" }} />
            <Text style={styles.headerTitle}>Calorias (Kcal)</Text>
            <View style={{ width: 46 }} />
          </View>

          {/* Calorie Info */}
          <View style={styles.calorieInfoContainer}>
            <View style={styles.caloriesPrimaryInfo}>
              <Image
                source={require("../../../../assets/fire.png")}
                style={{ width: 40, height: 40, marginTop: 6 }}
                resizeMode="contain"
              />
              <Text style={styles.caloriesValue}>
                {`${caloriesStats?.totalCalories || 0}`}
                <Text style={styles.caloriesUnit}>kcal</Text>
              </Text>
            </View>
            <Text style={styles.caloriesRemainingText}>
              {`Queimar ${caloriesStats?.remainingCalories || 0} calorias restantes`}
            </Text>
          </View>

          {/* Time Selector */}
          <TimeSelector
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            isLoading={isLoading}
          />

          {/* Graph Section - Posicionado na parte inferior */}
          <View style={styles.graphSection}>
            {isLoading ? (
              <View style={styles.graphLoadingContainer}>
                <ActivityIndicator size="small" color="#FF7D00" />
              </View>
            ) : (
              <View style={styles.graphContainer}>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <View style={styles.graphPlaceholder}>
                    {ChartComponent || (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>Nenhum dado disponível</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Setas de navegação fixas nas laterais (pílulas) */}
      <NavigationArrows currentScreen="CaloriesScreen" screens={DATA_SCREENS} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },
  calorieInfoContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 30,
  },
  caloriesPrimaryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#192126",
  },
  caloriesUnit: {
    fontSize: 24,
    fontWeight: "normal",
  },
  caloriesRemainingText: {
    fontSize: 16,
    color: "#666",
    marginTop: -10,
  },
  timeSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  selectedTimeButton: {
    backgroundColor: "#192126",
  },
  timeButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  selectedTimeButtonText: {
    color: "#fff",
  },
  graphSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  graphContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  graphPlaceholder: {
    width: width * 0.95, // 90% da largura do dispositivo
    height: width * 1.4, // altura proporcional
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    alignContent: "center",
    marginRight: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  graphLoadingContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
  },
});

export default CaloriesScreen;
