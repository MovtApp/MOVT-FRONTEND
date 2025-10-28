import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import BackButton from "../../../../components/BackButton";
import { CartesianChart, Area, Line, Scatter } from "victory-native";
import { G, Text as SvgText } from "react-native-svg";
import {
  getCaloriesData,
  calculateChartDomain,
  formatDateLabel,
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

const CustomLabel: React.FC<CustomLabelProps> = ({ x, y, datum }) => {
  if (datum.label) {
    return (
      <G x={x} y={y}>
        <SvgText
          x={0}
          y={-15}
          fontSize={12}
          fill="#FF7D00"
          textAnchor="middle"
          fontWeight="bold"
        >
          {datum.label}
        </SvgText>
      </G>
    );
  }
  return null;
};

const CaloriesScreen: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TimeframeType>("1d");
  const [caloriesStats, setCaloriesStats] = useState<CalorieStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [graphData, setGraphData] = useState<GraphDataItem[]>([]);
  const [chartDomain, setChartDomain] = useState<[number, number]>([
    1400, 2000,
  ]);
  const [currentPage, setCurrentPage] = useState(0);

  // Número de pontos a exibir por página
  const POINTS_PER_PAGE = 7;

  // Busca dados do backend
  const fetchCaloriesData = async (timeframe: TimeframeType) => {
    try {
      setIsLoading(true);
      const data = await getCaloriesData(timeframe);
      setCaloriesStats(data);

      // Processa dados para o gráfico
      const processedData = data.data.map((item, index) => ({
        value: item.calories,
        label: "",
        index,
        rawDate: item.date,
      }));

      setGraphData(processedData);

      // Calcula domínio dinâmico
      const domain = calculateChartDomain(data.data);
      setChartDomain(domain);

      setCurrentPage(0);
    } catch (error) {
      console.error("Erro ao buscar dados de calorias:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca inicial
  useEffect(() => {
    fetchCaloriesData(selectedTimeframe);
  }, [selectedTimeframe]);

  // Pull to refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchCaloriesData(selectedTimeframe);
    setIsRefreshing(false);
  };

  // Paginação do gráfico
  const totalPages = Math.ceil(graphData.length / POINTS_PER_PAGE);
  const startIndex = currentPage * POINTS_PER_PAGE;
  const endIndex = Math.min(startIndex + POINTS_PER_PAGE, graphData.length);
  const currentGraphData = graphData.slice(startIndex, endIndex);

  // Adiciona labels aos pontos extremos da página atual
  const displayGraphData = currentGraphData.map((item, index, array) => {
    const shouldShowLabel =
      index === 0 ||
      index === array.length - 1 ||
      (array.length <= 3 && index === Math.floor(array.length / 2));

    return {
      ...item,
      label: shouldShowLabel ? item.value.toString() : "",
      index: index,
    };
  });

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (isLoading && !caloriesStats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton />
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton />
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
          <View style={styles.timeSelectorContainer}>
            {(["1d", "1s", "1m", "1a", "Tudo"] as TimeframeType[]).map(
              (timeframe) => (
                <TouchableOpacity
                  key={timeframe}
                  style={[
                    styles.timeButton,
                    selectedTimeframe === timeframe &&
                      styles.selectedTimeButton,
                  ]}
                  onPress={() => setSelectedTimeframe(timeframe)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      selectedTimeframe === timeframe &&
                        styles.selectedTimeButtonText,
                    ]}
                  >
                    {timeframe}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          {/* Graph Section */}
          <View style={styles.graphSection}>
            {isLoading ? (
              <View style={styles.graphLoadingContainer}>
                <ActivityIndicator size="small" color="#FF7D00" />
              </View>
            ) : (
              <View style={styles.graphContainer}>
                {/* Botão Anterior */}
                <TouchableOpacity
                  style={[
                    styles.graphArrowButton,
                    currentPage === 0 && styles.graphArrowButtonDisabled,
                  ]}
                  onPress={handlePreviousPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft
                    size={24}
                    color={currentPage === 0 ? "#ccc" : "#999"}
                  />
                </TouchableOpacity>

                {/* Gráfico */}
                <View style={styles.graphPlaceholder}>
                  {displayGraphData.length > 0 ? (
                    <CartesianChart
                      data={displayGraphData}
                      xKey="index"
                      yKeys={["value"]}
                      padding={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      domainPadding={{
                        left: 20,
                        right: 20,
                      }}
                      domain={{
                        y: chartDomain,
                      }}
                    >
                      {({ points, yScale }) => (
                        <G>
                          <Area
                            points={points.value}
                            color="rgba(255, 125, 0, 0.2)"
                            curveType="catmullRom"
                            y0={yScale(chartDomain[0])}
                          />
                          <Line
                            points={points.value}
                            color="#FF7D00"
                            strokeWidth={4}
                            curveType="catmullRom"
                          />
                        </G>
                      )}
                    </CartesianChart>
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>
                        Nenhum dado disponível
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botão Próximo */}
                <TouchableOpacity
                  style={[
                    styles.graphArrowButton,
                    currentPage === totalPages - 1 &&
                      styles.graphArrowButtonDisabled,
                  ]}
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight
                    size={24}
                    color={currentPage === totalPages - 1 ? "#ccc" : "#999"}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Indicador de página */}
            {totalPages > 1 ? (
              <View style={styles.pageIndicatorContainer}>
                <Text style={styles.pageIndicatorText}>
                  {currentPage + 1} / {totalPages}
                </Text>
              </View>
            ) : null}

            {/* Labels de data */}
            <View style={styles.dateLabelsContainer}>
              {displayGraphData.map((item, index) => (
                <Text key={index} style={styles.dateLabel}>
                  {formatDateLabel(item.rawDate, selectedTimeframe)}
                </Text>
              ))}
            </View>
          </View>

          {/* Estatísticas Adicionais */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Meta Diária</Text>
              <Text style={styles.statValue}>
                {`${caloriesStats?.dailyGoal || 0} kcal`}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Progresso</Text>
              <Text style={styles.statValue}>
                {`${
                  caloriesStats
                    ? Math.round(
                        (caloriesStats.totalCalories /
                          caloriesStats.dailyGoal) *
                          100,
                      )
                    : 0
                }%`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
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
    marginBottom: 30,
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
    minHeight: 300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 250,
    justifyContent: "space-between",
  },
  graphPlaceholder: {
    flex: 1,
    backgroundColor: "#FEECE2",
    borderRadius: 10,
    overflow: "hidden",
    height: "100%",
  },
  graphArrowButton: {
    padding: 10,
  },
  graphArrowButtonDisabled: {
    opacity: 0.3,
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
  pageIndicatorContainer: {
    marginTop: 10,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  dateLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
    paddingHorizontal: 40,
  },
  dateLabel: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#192126",
  },
});

export default CaloriesScreen;
