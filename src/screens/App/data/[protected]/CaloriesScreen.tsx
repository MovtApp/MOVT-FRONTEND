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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import TimeSelector from "../../../../components/TimeSelector";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import {
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Line as SvgLine,
  Text as SvgText,
  G,
} from "react-native-svg";
import * as shape from "d3-shape";
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

const { width } = Dimensions.get("window");

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
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      const data = await getCaloriesData(timeframe);

      const processedData = data.data.map((item, index) => ({
        value: item.calories,
        label: "",
        index,
        rawDate: item.date,
      }));

      const dailyGoal = data.dailyGoal || 2000;
      const processedValues = processedData.map((d) => d.value);
      const maxValue = processedValues.length > 0 ? Math.max(...processedValues) : dailyGoal;
      // Ajuste o domínio para ter um pouco de respiro acima do maior valor
      const maxDomain = Math.max(dailyGoal, maxValue * 1.1);
      const newDomain: [number, number] = [0, maxDomain];

      setCaloriesStats(data);
      setGraphData(processedData);
      setChartDomain(newDomain);

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

  const onRefresh = async () => {
    if (isLoadingRef.current) {
      setIsRefreshing(false);
      return;
    }
    setIsRefreshing(true);
    await fetchCaloriesData(selectedTimeframe);
    setIsRefreshing(false);
  };

  const displayGraphData = useMemo(() => {
    if (graphData.length === 0) return [];
    return graphData.map((item, index, array) => {
      const totalPoints = array.length;
      // Lógica para decidir se mostra o label (primeiro, último, meio, picos)
      // Para simplificar e igualar a imagem: mostra picos ou espaçados
      const shouldShowLabel =
        index === 0 ||
        index === totalPoints - 1 ||
        (totalPoints > 4 && index % Math.ceil(totalPoints / 4) === 0);

      return {
        ...item,
        label: shouldShowLabel && item.value != null ? item.value.toString() : "",
        index: index,
      };
    });
  }, [graphData]);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const CHART_HEIGHT = useMemo(() => {
    // O objetivo é preencher o restante da tela (Full Height)
    // Subtraímos o espaço aproximado do topo: Header (~80) + Info (~120) + Filtros (~80) + Margens (~40)
    // Isso evita que o gráfico empurre os filtros para fora da visão e ocupa o máximo de espaço.
    const fixedSpace = 320;
    const available = windowHeight - fixedSpace;
    return Math.max(450, available); // Garante um mínimo de 450px para não quebrar o visual em telas muito pequenas
  }, [windowHeight]);

  const ChartComponent = useMemo(() => {
    if (!isChartReady || displayGraphData.length === 0) return null;

    const PADDING_HORIZONTAL = 0; // Largura total sem padding interno para a linha
    const PADDING_TOP = 40;
    const PADDING_BOTTOM = 30;
    const GRAPH_WIDTH = windowWidth;
    const GRAPH_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const maxVal = chartDomain[1];

    // Escalas
    const scaleX = (index: number) => {
      return (
        (index / (displayGraphData.length - 1)) * (GRAPH_WIDTH - PADDING_HORIZONTAL * 2) +
        PADDING_HORIZONTAL
      );
    };

    const scaleY = (value: number) => {
      return GRAPH_HEIGHT - (value / maxVal) * GRAPH_HEIGHT + PADDING_TOP;
    };

    // Gerador de linhas d3-shape
    const lineGenerator = shape
      .line<GraphDataItem>()
      .x((d: GraphDataItem) => scaleX(d.index))
      .y((d: GraphDataItem) => scaleY(d.value))
      .curve(shape.curveNatural); // Curva suave como na imagem

    const pathD = lineGenerator(displayGraphData) || "";

    // Área fechada para o gradiente
    const areaGenerator = shape
      .area<GraphDataItem>()
      .x((d: GraphDataItem) => scaleX(d.index))
      .y0(GRAPH_HEIGHT + PADDING_TOP)
      .y1((d: GraphDataItem) => scaleY(d.value))
      .curve(shape.curveNatural);

    const areaD = areaGenerator(displayGraphData) || "";

    // Linhas de Grade (Grid Lines)
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((percent) => {
      const val = maxVal * percent;
      const y = scaleY(val);
      return { val, y };
    });

    return (
      <Svg width={GRAPH_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF7D00" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#FF7D00" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Linhas de Grade Horizontais */}
        {gridLines.map((grid, i) => (
          <G key={`grid-${i}`}>
            <SvgLine
              x1={PADDING_HORIZONTAL}
              y1={grid.y}
              x2={GRAPH_WIDTH - PADDING_HORIZONTAL}
              y2={grid.y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="5, 5" // Tracejado
            />
            {/* Valor da grade na direita */}
            <SvgText
              x={GRAPH_WIDTH - 10}
              y={grid.y + 4} // Ajuste fino vertical
              fill="#9CA3AF"
              fontSize="10"
              textAnchor="end"
            >
              {Math.round(grid.val)}
            </SvgText>
          </G>
        ))}

        {/* Área Preenchida */}
        <Path d={areaD} fill="url(#gradient)" />

        {/* Linha do Gráfico */}
        <Path d={pathD} stroke="#FF7D00" strokeWidth="6" fill="none" />

        {/* Marcadores e Labels */}
        {displayGraphData.map((d, i) => {
          if (!d.label) return null;
          const x = scaleX(d.index);
          const y = scaleY(d.value);
          const boxSize = 14;

          return (
            <G key={`point-${i}`}>
              {/* Label acima do ponto */}
              <SvgText
                x={x}
                y={y - 12}
                fill="#111827"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {d.value}
              </SvgText>

              {/* Marcador Quadrado */}
              <Rect
                x={x - boxSize / 2}
                y={y - boxSize / 2}
                width={boxSize}
                height={boxSize}
                rx={4}
                ry={4}
                fill="#FFFFFF"
                stroke="#FF7D00"
                strokeWidth={3}
              />
            </G>
          );
        })}
      </Svg>
    );
  }, [isChartReady, displayGraphData, chartDomain, CHART_HEIGHT, windowWidth]);

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
          <View style={styles.header}>
            <BackButton to={{ name: "DataScreen" }} />
            <Text style={styles.headerTitle}>Calorias (Kcal)</Text>
            <View style={{ width: 46 }} />
          </View>

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

          <View style={styles.timeSelectorWrapper}>
            <TimeSelector
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
              isLoading={isLoading}
            />
          </View>

          <View style={styles.graphSection}>
            {isLoading ? (
              <View style={styles.graphLoadingContainer}>
                <ActivityIndicator size="small" color="#FF7D00" />
              </View>
            ) : (
              <View style={[styles.graphContainer, { height: CHART_HEIGHT }]}>
                {ChartComponent ? (
                  ChartComponent
                ) : (
                  <View style={[styles.noDataContainer, { height: CHART_HEIGHT }]}>
                    <Text style={styles.noDataText}>Nenhum dado disponível</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <DataPillNavigator currentScreen="CaloriesScreen" />
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
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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
  timeSelectorWrapper: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  graphSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  graphContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  graphLoadingContainer: {
    height: 400, // Fallback fixo para loading inicial
    justifyContent: "center",
    alignItems: "center",
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
  noDataContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
  },
});

export default CaloriesScreen;
