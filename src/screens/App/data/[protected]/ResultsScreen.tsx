import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import TimeSelector, { type TimeframeType } from "../../../../components/TimeSelector";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { Canvas, Path, vec, Circle } from "@shopify/react-native-skia";

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
  // Dados para Força (laranja) - MAIOR (primeiro, renderizado como fundo)
  const [forcaData, setForcaData] = useState<RadarData>({
    water: 95,
    sleep: 90,
    steps: 95,
    bpm: 90,
    imc: 92,
    calories: 95,
  });
  // Dados para Agilidade (azul/preto) - MÉDIO (segundo)
  const [agilidadeData, setAgilidadeData] = useState<RadarData>({
    water: 70,
    sleep: 75,
    steps: 80,
    bpm: 75,
    imc: 85,
    calories: 75,
  });
  // Dados para Resistência (roxo) - MENOR (terceiro, renderizado em cima)
  const [resistenciaData, setResistenciaData] = useState<RadarData>({
    water: 60,
    sleep: 55,
    steps: 65,
    bpm: 65,
    imc: 70,
    calories: 60,
  });
  const [centralScore, setCentralScore] = useState(88);
  const [lineData, setLineData] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // === GERAÇÃO DE DADOS ===
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
    // Atualiza dados para Força (laranja) - MAIOR (85-100)
    setForcaData({
      water: Math.round(90 + Math.random() * 10),
      sleep: Math.round(85 + Math.random() * 10),
      steps: Math.round(90 + Math.random() * 10),
      bpm: Math.round(85 + Math.random() * 10),
      imc: Math.round(88 + Math.random() * 10),
      calories: Math.round(90 + Math.random() * 10),
    });
    // Atualiza dados para Agilidade (azul/preto) - MÉDIO (65-80)
    setAgilidadeData({
      water: Math.round(65 + Math.random() * 15),
      sleep: Math.round(70 + Math.random() * 15),
      steps: Math.round(75 + Math.random() * 15),
      bpm: Math.round(70 + Math.random() * 15),
      imc: Math.round(75 + Math.random() * 10),
      calories: Math.round(70 + Math.random() * 15),
    });
    // Atualiza dados para Resistência (roxo) - MENOR (55-70)
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
    // Calcula a média dos três conjuntos de dados
    const allValues = [
      ...Object.values(forcaData),
      ...Object.values(agilidadeData),
      ...Object.values(resistenciaData),
    ];
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    setCentralScore(Math.round(avg));
  }, [forcaData, agilidadeData, resistenciaData]);

  // === NAVEGAÇÃO ===
  const DATA_SCREENS: (keyof AppStackParamList)[] = [
    "CaloriesScreen",
    "CyclingScreen",
    "HeartbeatsScreen",
    "SleepScreen",
    "StepsScreen",
    "TrainingScreen",
    "WaterScreen",
    "ResultsScreen",
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

        {/* Score e mensagem abaixo do gráfico e acima da legenda */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{centralScore}</Text>
          <Text style={styles.scoreMessage}>Você é um indivíduo saudável.</Text>
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

  // === LINE CHART ===
  const LineChart = () => {
    const chartWidth = width * 0.9;
    const chartHeight = 80;
    const padding = 20;
    const values = lineData;
    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - ((val - min) / range) * (chartHeight - padding * 2);
      return { x, y };
    });

    const path = points.reduce(
      (p, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`),
      ""
    );

    return (
      <View style={styles.lineChartContainer}>
        <Canvas style={{ width: chartWidth, height: chartHeight }}>
          <Path path={path} color="#FB923C" style="stroke" strokeWidth={2} />
          {points.map((pt, i) => (
            <Circle key={i} cx={pt.x} cy={pt.y} r={3} color="#FB923C" />
          ))}
        </Canvas>
        <Text style={styles.lineChartValue}>{values[values.length - 1]}</Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff" },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 20 },
    container: { flex: 1, paddingHorizontal: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#192126" },
    radarContainer: { alignItems: "center", marginVertical: 20 },
    scoreContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 8,
    },
    scoreText: {
      fontSize: 48,
      fontWeight: "bold",
      color: "#1A202C",
      textAlign: "center",
    },
    scoreMessage: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#192126",
      textAlign: "center",
      marginTop: 4,
    },
    legendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
      gap: 16,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendColor: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 14, color: "#192126", fontWeight: "bold" },
    axisLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#192126",
      width: 60,
      textAlign: "center",
    },
    timeSelectorContainer: { marginBottom: 20 },
    lineChartContainer: { alignItems: "center", marginVertical: 20 },
    lineChartValue: {
      position: "absolute",
      right: 10,
      top: 10,
      fontSize: 14,
      fontWeight: "bold",
      color: "#FB923C",
    },
    infoContainer: {
      marginTop: 10,
      padding: 15,
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      marginBottom: 50,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#192126",
      marginBottom: 8,
    },
    infoText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.headerTitle}>Resultados</Text>
            <View style={{ width: 46 }} />
          </View>

          <RadarChart />

          <View style={styles.timeSelectorContainer}>
            <TimeSelector
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
          </View>

          <LineChart />

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Sobre seus resultados</Text>
            <Text style={styles.infoText}>
              Este gráfico mostra sua evolução nos últimos{" "}
              {selectedTimeframe === "1d"
                ? "dias"
                : selectedTimeframe === "1s"
                  ? "semanas"
                  : selectedTimeframe === "1m"
                    ? "meses"
                    : selectedTimeframe === "1a"
                      ? "anos"
                      : "período"}
              . Continue com seu plano de treino e nutrição para alcançar sua meta.
            </Text>
          </View>
        </View>
      </ScrollView>

      <NavigationArrows currentScreen="ResultsScreen" screens={DATA_SCREENS} />
    </SafeAreaView>
  );
};

export default ResultsScreen;
