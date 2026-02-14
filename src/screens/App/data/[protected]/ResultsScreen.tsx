import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import TimeSelector, { type TimeframeType } from "../../../../components/TimeSelector";
import BackButton from "../../../../components/BackButton";
import { Canvas, Path, vec, Circle } from "@shopify/react-native-skia";
import { Info, ShieldCheck, Trophy, Target, Activity, TrendingUp, Zap, HelpCircle, Brain, Droplets, Flame, User, Footprints } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";

const { width } = Dimensions.get("window");

const RADAR_LABELS = ["Água", "Sono", "Passos", "BPM", "IMC", "Calorias"];
const MAX_VALUE = 100;

interface RadarData {
  water: number;
  sleep: number;
  steps: number;
  bpm: number;
  imc: number;
  calories: number;
}

const ResultsScreen: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>("1m");
  const [forcaData, setForcaData] = useState<RadarData>({
    water: 95, sleep: 90, steps: 95, bpm: 90, imc: 92, calories: 95,
  });
  const [agilidadeData, setAgilidadeData] = useState<RadarData>({
    water: 70, sleep: 75, steps: 80, bpm: 75, imc: 85, calories: 75,
  });
  const [resistenciaData, setResistenciaData] = useState<RadarData>({
    water: 60, sleep: 55, steps: 65, bpm: 65, imc: 70, calories: 60,
  });
  const [centralScore, setCentralScore] = useState(88);
  const [lineData, setLineData] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);

  const handleOpenInfo = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const generateLineData = (points: number): number[] => {
    const data: number[] = [];
    let base = 750;
    for (let i = 0; i < points; i++) {
      const variation = (Math.random() - 0.5) * 50;
      base = Math.max(600, Math.min(900, base + variation));
      data.push(Math.round(base));
    }
    return data;
  };

  useEffect(() => {
    const points = selectedTimeframe === "1m" ? 30 : selectedTimeframe === "1s" ? 7 : 12;
    setLineData(generateLineData(points));
    setForcaData({
      water: Math.round(90 + Math.random() * 10),
      sleep: Math.round(85 + Math.random() * 10),
      steps: Math.round(90 + Math.random() * 10),
      bpm: Math.round(85 + Math.random() * 10),
      imc: Math.round(88 + Math.random() * 10),
      calories: Math.round(90 + Math.random() * 10),
    });
    setAgilidadeData({
      water: Math.round(65 + Math.random() * 15),
      sleep: Math.round(70 + Math.random() * 15),
      steps: Math.round(75 + Math.random() * 15),
      bpm: Math.round(70 + Math.random() * 15),
      imc: Math.round(75 + Math.random() * 10),
      calories: Math.round(70 + Math.random() * 15),
    });
    setResistenciaData({
      water: Math.round(55 + Math.random() * 15),
      sleep: Math.round(50 + Math.random() * 15),
      steps: Math.round(60 + Math.random() * 10),
      bpm: Math.round(60 + Math.random() * 10),
      imc: Math.round(65 + Math.random() * 10),
      calories: Math.round(55 + Math.random() * 15),
    });
  }, [selectedTimeframe]);

  useEffect(() => {
    const allValues = [
      ...Object.values(forcaData),
      ...Object.values(agilidadeData),
      ...Object.values(resistenciaData),
    ];
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    setCentralScore(Math.round(avg));
  }, [forcaData, agilidadeData, resistenciaData]);

  const DATA_SCREENS: (keyof AppStackParamList)[] = [
    "CaloriesScreen", "CyclingScreen", "HeartbeatsScreen", "SleepScreen", "StepsScreen", "WaterScreen", "ResultsScreen",
  ];

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const points = selectedTimeframe === "1m" ? 30 : selectedTimeframe === "1s" ? 7 : 12;
      setLineData(generateLineData(points));
      setIsRefreshing(false);
    }, 1000);
  };

  // === RADAR CHART ===
  const RadarChart = () => {
    const size = width * 0.8;
    const center = size / 2;
    const radius = size * 0.35;
    const axisRadius = size * 0.42; // Raio maior para os eixos e grid
    const gridRadius = size * 0.42; // Raio maior para o grid concêntrico
    const levels = 5;

    // Função para obter valores de um conjunto de dados
    const getValues = (data: RadarData) => {
      return RADAR_LABELS.map((_, i) => {
        const key = Object.keys(data)[i] as keyof RadarData;
        return (data[key] / MAX_VALUE) * radius;
      });
    };

    // Função para gerar pontos do polígono
    const getPolygonPoints = (values: number[]) => {
      return RADAR_LABELS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
        const r = values[i];
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return vec(x, y);
      });
    };

    // Função para criar path do polígono com cantos arredondados
    const createRoundedPolygonPath = (
      points: ReturnType<typeof vec>[],
      cornerRadius: number = 15
    ) => {
      if (points.length < 3) return "";

      const numPoints = points.length;
      const pathSegments: string[] = [];

      // Primeiro, calcular todos os pontos de controle
      const controlPoints: {
        before: { x: number; y: number };
        after: { x: number; y: number };
      }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const prevIndex = (i - 1 + numPoints) % numPoints;
        const currentIndex = i;
        const nextIndex = (i + 1) % numPoints;

        const p0 = points[prevIndex];
        const p1 = points[currentIndex];
        const p2 = points[nextIndex];

        // Calcular vetores dos segmentos
        const v1x = p1.x - p0.x;
        const v1y = p1.y - p0.y;
        const v2x = p2.x - p1.x;
        const v2y = p2.y - p1.y;

        // Calcular comprimentos dos segmentos
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

        // Normalizar vetores
        const nv1x = len1 > 0 ? v1x / len1 : 0;
        const nv1y = len1 > 0 ? v1y / len1 : 0;
        const nv2x = len2 > 0 ? v2x / len2 : 0;
        const nv2y = len2 > 0 ? v2y / len2 : 0;

        // Limitar o raio de arredondamento para não exceder metade dos segmentos
        const maxRadius = Math.min(len1, len2) / 2;
        const effectiveRadius = Math.min(cornerRadius, maxRadius * 0.8);

        // Calcular pontos de controle (antes e depois do vértice)
        controlPoints.push({
          before: {
            x: p1.x - nv1x * effectiveRadius,
            y: p1.y - nv1y * effectiveRadius,
          },
          after: {
            x: p1.x + nv2x * effectiveRadius,
            y: p1.y + nv2y * effectiveRadius,
          },
        });
      }

      // Construir o path com curvas arredondadas
      // Começar no primeiro ponto "after" (que vem depois do último vértice na ordem anterior)
      const firstControl = controlPoints[0];
      pathSegments.push(`M ${firstControl.before.x} ${firstControl.before.y}`);

      for (let i = 0; i < numPoints; i++) {
        const control = controlPoints[i];
        const p1 = points[i];

        // Curva quadrática usando o vértice como ponto de controle e o ponto "after" como destino
        pathSegments.push(`Q ${p1.x} ${p1.y} ${control.after.x} ${control.after.y}`);
      }

      // Fechar o caminho
      return pathSegments.join(" ") + " Z";
    };

    // Dados para cada polígono
    const forcaValues = getValues(forcaData);
    const agilidadeValues = getValues(agilidadeData);
    const resistenciaValues = getValues(resistenciaData);

    // Pontos para cada polígono
    const forcaPoints = getPolygonPoints(forcaValues);
    const agilidadePoints = getPolygonPoints(agilidadeValues);
    const resistenciaPoints = getPolygonPoints(resistenciaValues);

    // Paths para cada polígono com cantos arredondados
    const forcaPath = createRoundedPolygonPath(forcaPoints, 20);
    const agilidadePath = createRoundedPolygonPath(agilidadePoints, 20);
    const resistenciaPath = createRoundedPolygonPath(resistenciaPoints, 20);

    return (
      <View style={styles.radarContainer}>
        <View style={{ width: size, height: size, position: "relative" }}>
          <Canvas style={{ width: size, height: size }}>
            {/* Grid concêntrico */}
            {[...Array(levels)].map((_, i) => {
              const r = (gridRadius / levels) * (i + 1);
              const levelPoints = RADAR_LABELS.map((_, j) => {
                const angle = (Math.PI * 2 * j) / RADAR_LABELS.length - Math.PI / 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return vec(x, y);
              });
              const path =
                levelPoints.reduce(
                  (p, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`),
                  ""
                ) + " Z";
              return <Path key={i} path={path} color="#E2E8F0" style="stroke" strokeWidth={1} />;
            })}

            {/* Linhas do eixo */}
            {RADAR_LABELS.map((_, i) => {
              const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
              const x = center + axisRadius * Math.cos(angle);
              const y = center + axisRadius * Math.sin(angle);
              return (
                <Path
                  key={i}
                  path={`M ${center} ${center} L ${x} ${y}`}
                  color="#F1F1F1"
                  style="stroke"
                  strokeWidth={3}
                />
              );
            })}

            {/* Polígono 1: Força (laranja) - MAIOR (renderizado primeiro como fundo) */}
            <Path path={forcaPath} style="fill" color="rgba(209, 161, 122, 0.5)" />
            <Path
              path={forcaPath}
              color="#F97316"
              style="stroke"
              strokeWidth={4}
              strokeJoin="round"
              strokeCap="round"
            />

            {/* Polígono 2: Agilidade (azul/preto) - MÉDIO (renderizado no meio) */}
            <Path path={agilidadePath} style="fill" color="rgba(69, 69, 77, 0.4)" />
            <Path
              path={agilidadePath}
              color="#192126"
              style="stroke"
              strokeWidth={4}
              strokeJoin="round"
              strokeCap="round"
            />

            {/* Polígono 3: Resistência (roxo) - MENOR (renderizado por último em cima) */}
            <Path path={resistenciaPath} style="fill" color="rgba(118, 118, 150, 0.4)" />
            <Path
              path={resistenciaPath}
              color="#3F5EBC"
              style="stroke"
              strokeWidth={4}
              strokeJoin="round"
              strokeCap="round"
            />
          </Canvas>

          {/* Labels dos eixos */}
          {RADAR_LABELS.map((label, i) => {
            const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
            const labelRadius = axisRadius + 20; // Offset para posicionar os labels além das pontas
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);

            // Determinar alinhamento baseado no quadrante
            let textAlign: "left" | "center" | "right" = "center";

            if (Math.abs(Math.cos(angle)) > 0.7) {
              // Lado esquerdo ou direito
              textAlign = Math.cos(angle) > 0 ? "left" : "right";
            } else {
              // Topo ou baixo
              textAlign = "center";
            }

            // Espaçamento lateral adicional para afastar o texto do eixo
            const lateralSpacing = 20; // ajuste fino do espaçamento lateral
            const horizontalNudge =
              Math.cos(angle) > 0.1
                ? lateralSpacing // lado direito empurra para a direita
                : Math.cos(angle) < -0.1
                  ? -lateralSpacing // lado esquerdo empurra para a esquerda
                  : 0; // topo/baixo não altera lateralmente

            return (
              <Text
                key={i}
                style={[
                  styles.axisLabel,
                  {
                    position: "absolute",
                    left: x - 30 + horizontalNudge,
                    top: y - 10,
                    textAlign,
                  },
                ]}
              >
                {label}
              </Text>
            );
          })}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#FB923C" }]} />
            <Text style={styles.legendText}>Força</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#192126" }]} />
            <Text style={styles.legendText}>Agilidade</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#3F5EBC" }]} />
            <Text style={styles.legendText}>Resistência</Text>
          </View>
        </View>
      </View>
    );
  };

  const LineChart = () => {
    const chartWidth = width * 0.8;
    const chartHeight = 60;
    const padding = 10;
    if (lineData.length === 0) return null;
    const min = Math.min(...lineData); const max = Math.max(...lineData);
    const range = max - min || 1;
    const points = lineData.map((val, i) => ({
      x: padding + (i / (lineData.length - 1)) * (chartWidth - padding * 2),
      y: chartHeight - padding - ((val - min) / range) * (chartHeight - padding * 2),
    }));
    const path = points.reduce((p, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`), "");

    return (
      <View style={styles.lineChartHolder}>
        <Canvas style={{ width: chartWidth, height: chartHeight }}>
          <Path path={path} color="#F97316" style="stroke" strokeWidth={2} />
          {points.map((pt, i) => i % 5 === 0 && <Circle key={i} cx={pt.x} cy={pt.y} r={2.5} color="#F97316" />)}
        </Canvas>
        <View style={styles.lineChartInfo}>
          <Activity size={12} color="#94A3B8" />
          <Text style={styles.lineChartValue}>{lineData[lineData.length - 1]} <Text style={{ fontSize: 10, color: "#94A3B8" }}>pts</Text></Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <BackButton to={{ name: "DataScreen" }} />
        <Text style={styles.headerTitle}>Resultados</Text>
        <TouchableOpacity style={styles.infoIcon} onPress={handleOpenInfo}>
          <Info size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        <View style={styles.timeSelectorBox}>
          <TimeSelector selectedTimeframe={selectedTimeframe} onTimeframeChange={setSelectedTimeframe} />
        </View>

        <View style={styles.chartSection}>
          <RadarChart />
        </View>

        <View style={styles.premiumScoreCard}>
          <View style={styles.scoreHeaderRow}>
            <View>
              <Text style={styles.premiumScoreLabel}>Health Score</Text>
              <Text style={styles.premiumScoreDate}>Atualizado em tempo real</Text>
            </View>
            <View style={styles.statusPill}>
              <Activity size={12} color="#10B981" />
              <Text style={styles.statusPillText}>Excelente</Text>
            </View>
          </View>

          <View style={styles.scoreMainSection}>
            <View style={styles.scoreDisplay}>
              <Text style={styles.premiumScoreNumber}>{centralScore}</Text>
              <View style={styles.scoreMetricInfo}>
                <Text style={styles.scoreMax}>/100</Text>
                <View style={styles.trendContainer}>
                  <TrendingUp size={14} color="#10B981" />
                  <Text style={styles.trendText}>12%</Text>
                </View>
              </View>
            </View>

            <View style={styles.scoreProgressWrapper}>
              <View style={styles.progressBarBase}>
                <LinearGradient
                  colors={["#F97316", "#FB923C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${centralScore}%` }]}
                />
              </View>
              <View style={styles.progressMarkers}>
                <Text style={styles.markerText}>0</Text>
                <Text style={styles.markerText}>50</Text>
                <Text style={styles.markerText}>100</Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreFooterCard}>
            <Trophy size={16} color="#F59E0B" />
            <Text style={styles.scoreFooterMsg}>
              Você superou <Text style={{ fontWeight: '700', color: '#0F172A' }}>92%</Text> dos usuários no seu perfil.
            </Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Activity size={18} color="#F97316" />
            <Text style={styles.sectionTitle}>Histórico de Progresso</Text>
          </View>

          <View style={styles.lineChartCard}>
            <LineChart />
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <ShieldCheck size={20} color="#10B981" />
            <Text style={styles.insightTitle}>Insight de Saúde</Text>
          </View>
          <Text style={styles.insightText}>
            Seus níveis de <Text style={{ fontWeight: '700', color: '#0F172A' }}>Hidratação</Text> e <Text style={{ fontWeight: '700', color: '#0F172A' }}>Sono</Text> estão otimizados.
            Mantenha a consistência nos próximos {selectedTimeframe === '1m' ? '30 dias' : 'período'} para consolidar seus ganhos em <Text style={{ fontWeight: '700', color: '#0F172A' }}>Força</Text>.
          </Text>
        </View>
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 32 }}
      >
        <BottomSheetView style={styles.bsView}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.bsHeader}>
              <View style={styles.bsIconContainer}>
                <Zap size={24} color="#F97316" />
              </View>
              <View>
                <Text style={styles.bsTitle}>O que é o Health Score?</Text>
                <Text style={styles.bsSubtitle}>Entenda como calculamos seus resultados</Text>
              </View>
            </View>

            <View style={styles.bsSection}>
              <Text style={styles.bsSectionTitle}>O Algoritmo</Text>
              <Text style={styles.bsText}>
                Seu score é uma métrica ponderada que analisa a consistência dos seus hábitos.
                Nós cruzamos dados de <Text style={{ fontWeight: '700' }}>biometria e performance</Text> para gerar uma nota de 0 a 100.
              </Text>
            </View>

            <View style={styles.bsSection}>
              <Text style={styles.bsSectionTitle}>Dimensões do Radar</Text>

              <View style={styles.metricGuideHorizontal}>
                <View style={styles.metricCard}>
                  <View style={styles.metricIconBox}><Flame size={16} color="#F97316" /></View>
                  <Text style={styles.metricLabelCard}>Força</Text>
                  <Text style={styles.metricDescCard}>Calorias e esforço.</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricIconBox}><Zap size={16} color="#0F172A" /></View>
                  <Text style={styles.metricLabelCard}>Agilidade</Text>
                  <Text style={styles.metricDescCard}>Velocidade e BPM.</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricIconBox}><ShieldCheck size={16} color="#3B82F6" /></View>
                  <Text style={styles.metricLabelCard}>Resistência</Text>
                  <Text style={styles.metricDescCard}>Tempo e foco.</Text>
                </View>
              </View>
            </View>

            <View style={styles.bsSection}>
              <Text style={styles.bsSectionTitle}>Métricas Analisadas</Text>
              <View style={styles.tagsContainerRow}>
                <View style={styles.tagCompact}><Droplets size={10} color="#3B82F6" /><Text style={styles.tagTextCompact}>Água</Text></View>
                <View style={styles.tagCompact}><Brain size={10} color="#8B5CF6" /><Text style={styles.tagTextCompact}>Sono</Text></View>
                <View style={styles.tagCompact}><Footprints size={10} color="#10B981" /><Text style={styles.tagTextCompact}>Passos</Text></View>
                <View style={styles.tagCompact}><Activity size={10} color="#EF4444" /><Text style={styles.tagTextCompact}>BPM</Text></View>
                <View style={styles.tagCompact}><User size={10} color="#6366F1" /><Text style={styles.tagTextCompact}>IMC</Text></View>
              </View>
            </View>

            <View style={styles.bsFooter}>
              <HelpCircle size={16} color="#94A3B8" />
              <Text style={styles.bsFooterText}>Dados sincronizados com o seu dispositivo vestível.</Text>
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  infoIcon: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

  premiumScoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  premiumScoreLabel: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  premiumScoreDate: { fontSize: 12, color: "#64748B", marginTop: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: { color: "#10B981", fontSize: 12, fontWeight: "700" },
  scoreMainSection: { marginBottom: 20 },
  scoreDisplay: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 15 },
  premiumScoreNumber: { fontSize: 48, fontWeight: "800", color: "#0F172A", lineHeight: 48 },
  scoreMetricInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 6 },
  scoreMax: { fontSize: 16, fontWeight: "600", color: "#94A3B8" },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: { color: "#10B981", fontSize: 12, fontWeight: "700" },
  scoreProgressWrapper: { width: '100%' },
  progressBarBase: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressMarkers: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  markerText: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  scoreFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
  },
  scoreFooterMsg: { fontSize: 13, color: "#64748B", flex: 1, lineHeight: 18 },

  chartSection: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  radarContainer: { alignItems: 'center' },
  axisLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
    width: 60,
    textAlign: "center",
  },
  legendContainer: { flexDirection: 'row', gap: 20, marginTop: 30 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 12, height: 12, borderRadius: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, fontWeight: "600", color: "#475569" },

  historySection: { marginBottom: 25 },
  timeSelectorBox: { marginBottom: 15 },
  lineChartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  lineChartHolder: { width: '100%', alignItems: 'center' },
  lineChartInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, width: '100%', justifyContent: 'flex-end' },
  lineChartValue: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  insightCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  insightTitle: { fontSize: 15, fontWeight: "700", color: "#065F46" },
  insightText: { fontSize: 14, color: "#065F46", lineHeight: 22, opacity: 0.8 },

  // Bottom Sheet Styles
  bsView: { flex: 1, padding: 24 },
  bsHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 25 },
  bsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bsTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  bsSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  bsSection: { marginBottom: 25 },
  bsSectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  bsText: { fontSize: 15, color: '#475569', lineHeight: 22 },
  metricGuideHorizontal: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center'
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  metricLabelCard: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  metricDescCard: { fontSize: 10, color: '#64748B', lineHeight: 14, textAlign: 'center' },
  tagsContainerRow: { flexDirection: 'row', gap: 6 },
  tagCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10
  },
  tagTextCompact: { fontSize: 9, fontWeight: '700', color: '#475569' },
  bsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  bsFooterText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
});

export default ResultsScreen;
