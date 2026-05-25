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
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

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
import {
  getMissao,
  calcularMissao,
  getMetaParaFiltro,
  getSubtituloFiltro,
  type UserMission,
  type MissionBreakdown,
  salvarMissaoBackend,
  salvarMissaoLocal,
} from "../../../../services/missionService";
import { useAuth } from "../../../../contexts/AuthContext";

// ─── Error Boundary ────────────────────────────────────────────────────────────

interface EBState {
  hasError: boolean;
  error: Error | null;
}
class DataErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[CaloriesScreen] Crash interceptado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#FEF2F2",
            margin: 12,
            borderRadius: 16,
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#DC2626", marginBottom: 10 }}>
            ⚠️ Erro no Módulo de Calorias
          </Text>
          <Text style={{ fontSize: 12, color: "#7F1D1D", textAlign: "center", marginBottom: 10 }}>
            {this.state.error?.message}
          </Text>
          <Text style={{ fontSize: 10, color: "#991B1B", textAlign: "center" }}>
            {this.state.error?.stack?.slice(0, 300)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

type GraphDataItem = {
  value: number;
  label: string;
  index: number;
  rawDate: string;
  xValue?: number;
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
  const route = useRoute<any>();
  const routeDate = (() => {
    try {
      const d = route.params?.date ? new Date(route.params.date) : new Date();
      return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) {
      return new Date();
    }
  })();
  const dateStr = `${routeDate.getFullYear()}-${String(routeDate.getMonth() + 1).padStart(2, "0")}-${String(routeDate.getDate()).padStart(2, "0")}`;

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      routeDate.getDate() === today.getDate() &&
      routeDate.getMonth() === today.getMonth() &&
      routeDate.getFullYear() === today.getFullYear()
    );
  }, [routeDate]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>("1d");
  const [caloriesStats, setCaloriesStats] = useState<CalorieStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [graphData, setGraphData] = useState<GraphDataItem[]>([]);
  const [chartDomain, setChartDomain] = useState<[number, number]>([0, 2000]);
  const isLoadingRef = useRef(false);
  const [isChartReady, setIsChartReady] = useState(false);

  // Estado da Missão
  const [missao, setMissao] = useState<UserMission | null>(null);
  const [breakdown, setBreakdown] = useState<MissionBreakdown | null>(null);
  const [showMissionSetup, setShowMissionSetup] = useState(false);
  const [newMission, setNewMission] = useState<UserMission>({
    pesoAtual: 150,
    pesoMeta: 80,
    altura: 175,
    idade: 30,
    sexo: "M",
    nivelAtividade: "moderado",
  });

  const handleSaveMission = async () => {
    try {
      setIsLoading(true);
      await salvarMissaoBackend(newMission);
      await salvarMissaoLocal(newMission);
      setShowMissionSetup(false);
      await fetchCaloriesData(selectedTimeframe);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar sua missão.");
    } finally {
      setIsLoading(false);
    }
  };

  // Busca dados do backend
  const fetchCaloriesData = async (timeframe: TimeframeType) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      // Busca prioritária da Missão
      let currentMission = await getMissao();
      if (!currentMission) {
        const { carregarMissaoBackend } = require("../../../../services/missionService");
        currentMission = await carregarMissaoBackend();
      }

      if (currentMission) {
        setMissao(currentMission);
      } else {
        if (isToday) {
          setShowMissionSetup(true);
        }
      }

      const data = await getCaloriesData(timeframe, timeframe === "1d" ? dateStr : undefined);

      // Busca o total geral acumulado para o percentual de conclusão
      const tudoData = await getCaloriesData("Tudo");
      const totalGeralKcal = tudoData.totalCalories || 0;

      let currentGoal = data.dailyGoal || 2000;

      if (currentMission) {
        const missionResult = calcularMissao(currentMission, totalGeralKcal);
        setBreakdown(missionResult);

        // Garantia absoluta para o filtro Tudo: Peso Atual - Peso Meta * 7700
        if (timeframe.toLowerCase() === "tudo") {
          // Aceita tanto pesoAtual (frontend) quanto peso_atual (backend)
          const pAtual = currentMission.pesoAtual ?? (currentMission as any).peso_atual;
          const pMeta = currentMission.pesoMeta ?? (currentMission as any).peso_meta;

          if (pAtual !== undefined && pMeta !== undefined) {
            const pesoAtual = parseFloat(pAtual.toString());
            const pesoMeta = parseFloat(pMeta.toString());
            currentGoal = Math.max(0, pesoAtual - pesoMeta) * 7700;
            console.log(`[CHART] Meta TUDO calculada: ${currentGoal} kcal`);
          }
        } else {
          const filterMap: Record<string, any> = { "1d": "1d", "1s": "1s", "1m": "1m", "1a": "1a" };
          currentGoal = getMetaParaFiltro(missionResult, filterMap[timeframe] || "1d");
        }
      }

      let processedData: GraphDataItem[] = [];

      // Lógica Unificada de Curva Suave para todos os filtros
      const totalPeriod = data.totalCalories || 0;
      const points = 50;

      for (let i = 0; i <= points; i++) {
        const t = i / points;
        processedData.push({
          value: Math.pow(t, 2) * totalPeriod,
          label: i === points ? Math.round(totalPeriod).toString() : "",
          index: i,
          xValue: t * totalPeriod,
          rawDate: new Date().toISOString(),
        });
      }

      const maxValueInGraph =
        processedData.length > 0 ? Math.max(...processedData.map((d) => d.value)) : 0;

      // A meta do filtro é SEMPRE o teto do gráfico para o usuário ter a real noção de distância.
      const safeGoal =
        isFinite(currentGoal) && !isNaN(currentGoal) ? Math.max(1, currentGoal) : 2000;
      const safeMaxGraph =
        isFinite(maxValueInGraph) && !isNaN(maxValueInGraph) ? maxValueInGraph : 0;

      // O domínio Y agora é fixo na meta, mas com respiro se o usuário ultrapassar.
      const maxDomain = Math.max(safeGoal, safeMaxGraph * 1.1);
      const newDomain: [number, number] = [0, maxDomain];

      const updatedStats = { ...data, dailyGoal: currentGoal };

      setCaloriesStats(updatedStats);
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

    const syncAndFetch = async () => {
      if (!isMounted || isLoadingRef.current) return;

      try {
        // Tenta sincronizar com o Health Connect antes de buscar do backend apenas se for hoje
        if (selectedTimeframe === "1d" && isToday) {
          console.log("[CaloriesScreen] Sincronizando com Health Connect...");
          const { NativeHealthManager } = require("../../../../services/nativeHealthManager");
          await NativeHealthManager.fetchCalories();
        }

        if (isMounted) {
          await fetchCaloriesData(selectedTimeframe);
        }
      } catch (err) {
        console.warn("Erro na sincronização inicial de calorias:", err);
        if (isMounted) await fetchCaloriesData(selectedTimeframe);
      }
    };

    syncAndFetch();

    return () => {
      isMounted = false;
      setIsChartReady(false);
    };
  }, [selectedTimeframe, dateStr, isToday]);

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

    const dailyGoal = caloriesStats?.dailyGoal || 2000;
    const PADDING_HORIZONTAL = 0; // Padding na esquerda

    // ESCALA X ELÁSTICA: O gráfico "cresce" para a direita conforme o progresso
    const currentTotal =
      selectedTimeframe === "1d"
        ? caloriesStats?.totalCalories || 0
        : graphData.reduce((acc, curr) => acc + (curr.value || 0), 0) / 50; // Ajuste para o nosso mock unificado

    const progressRatio = Math.min(1, currentTotal / (dailyGoal || 1));

    // Define onde a linha deve terminar no eixo X (de 80px até a largura total - margem)
    const MIN_WIDTH = 80;
    const MAX_WIDTH = windowWidth - 40;
    const targetX = MIN_WIDTH + progressRatio * (MAX_WIDTH - MIN_WIDTH);

    const PADDING_TOP = 40;
    const PADDING_BOTTOM = 60;
    const GRAPH_WIDTH = windowWidth;
    const GRAPH_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const maxVal = chartDomain[1];

    // Escalas
    const scaleX = (value: number, index: number, d?: any) => {
      // Mapeia o índice (0 a 50) para o intervalo [0, targetX]
      const denom = Math.max(1, displayGraphData.length - 1);
      const x = (index / denom) * targetX;
      return isFinite(x) ? Number(x.toFixed(2)) : 0;
    };

    const scaleY = (value: number) => {
      const safeVal = isFinite(value) && !isNaN(value) ? value : 0;
      const safeMax = maxVal > 0 ? maxVal : 1;

      // ESCALA NÃO-LINEAR (POWER SCALE):
      // Se a meta for muito alta (ex: > 10k), usamos uma escala de potência para dar zoom
      // nos valores baixos sem perder o topo (a meta).
      let normalizedProgress = safeVal / safeMax;
      if (safeMax > 10000) {
        normalizedProgress = Math.pow(normalizedProgress, 0.4);
      }

      const y = GRAPH_HEIGHT - normalizedProgress * GRAPH_HEIGHT + PADDING_TOP;
      return isFinite(y) ? Number(y.toFixed(2)) : PADDING_TOP;
    };

    // Gerador de linhas d3-shape
    const lineGenerator = shape
      .line<GraphDataItem>()
      .x((d: GraphDataItem) => scaleX(d.value, d.index, d))
      .y((d: GraphDataItem) => scaleY(d.value))
      .curve(shape.curveBasis);

    const pathD = lineGenerator(displayGraphData) || "";

    // Área fechada para o gradiente
    const areaGenerator = shape
      .area<GraphDataItem>()
      .x((d: GraphDataItem) => scaleX(d.value, d.index, d))
      .y0(GRAPH_HEIGHT + PADDING_TOP)
      .y1((d: GraphDataItem) => scaleY(d.value))
      .curve(shape.curveBasis);

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

        {/* Grades e Labels Eixo Y - Divisões Percentuais para Escala Não-Linear */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          // Valor real correspondente à posição percentual p
          const val = maxVal > 10000 ? Math.pow(p, 1 / 0.4) * maxVal : p * maxVal;
          const y = scaleY(val);

          return (
            <G key={`grid-${i}`}>
              <SvgLine
                x1="0"
                y1={y}
                x2={GRAPH_WIDTH}
                y2={y}
                stroke="#E1E1E1"
                strokeDasharray="5, 5"
              />
              <SvgText x={GRAPH_WIDTH - 10} y={y - 5} fill="#A0A0A0" fontSize="10" textAnchor="end">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
              </SvgText>
            </G>
          );
        })}

        {/* Área Preenchida */}
        <Path d={areaD} fill="url(#gradient)" />

        {/* Linha do Gráfico */}
        <Path d={pathD} stroke="#FF7D00" strokeWidth="6" fill="none" />

        {/* Marcador e Label Apenas no Final */}
        {displayGraphData.map((d, i) => {
          if (i !== displayGraphData.length - 1 || d.value === 0) return null;

          const x = scaleX(d.value, d.index, d);
          const y = scaleY(d.value);
          const boxSize = 14;

          return (
            <G key={`point-${i}`}>
              <SvgText
                x={x}
                y={y - 12}
                fill="#111827"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {Math.round(d.value)}
              </SvgText>

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
      <DataErrorBoundary>
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
      </DataErrorBoundary>
    );
  }

  return (
    <DataErrorBoundary>
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
                  {(() => {
                    const val = caloriesStats?.totalCalories || 0;
                    return val >= 10000 ? `${(val / 1000).toFixed(1)}k` : val;
                  })()}
                  <Text style={styles.caloriesUnit}>kcal</Text>
                </Text>
              </View>
              <Text style={styles.caloriesRemainingText}>
                {breakdown
                  ? getSubtituloFiltro(selectedTimeframe as any, breakdown)
                  : `Queimar ${caloriesStats?.remainingCalories || 0} calorias restantes`}
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

        {/* Modal de Configuração da Missão */}
        <Modal visible={showMissionSetup} animationType="slide" transparent={false}>
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Inicie sua Missão 🚀</Text>
              <Text style={styles.modalSubtitle}>
                Para calcular suas metas inteligentes, precisamos de alguns dados.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Peso Atual (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ex: 150"
                  value={newMission.pesoAtual.toString()}
                  onChangeText={(v) => setNewMission({ ...newMission, pesoAtual: Number(v) })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meta de Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ex: 80"
                  value={newMission.pesoMeta.toString()}
                  onChangeText={(v) => setNewMission({ ...newMission, pesoMeta: Number(v) })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ex: 175"
                  value={newMission.altura.toString()}
                  onChangeText={(v) => setNewMission({ ...newMission, altura: Number(v) })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Idade</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ex: 30"
                  value={newMission.idade.toString()}
                  onChangeText={(v) => setNewMission({ ...newMission, idade: Number(v) })}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveMission}>
                <Text style={styles.saveButtonText}>Iniciar Missão</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </DataErrorBoundary>
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalContent: {
    padding: 30,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#192126",
  },
  saveButton: {
    backgroundColor: "#FF7D00",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CaloriesScreen;
