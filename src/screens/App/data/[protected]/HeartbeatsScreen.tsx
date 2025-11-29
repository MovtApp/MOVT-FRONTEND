import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { Activity, Wind, Watch, Wifi, AlertTriangle } from "lucide-react-native";
import { SvgXml } from "react-native-svg";
import { Asset } from "expo-asset";
import { useAuth } from "../../../../contexts/AuthContext";
import ECGDisplay from "../../../../components/ECGDisplay";
import {
  getLatestWearOsHealthData,
  pollWearOsHealthData,
  getLatestWearOsHealthDataFromAllDevices,
  checkWearOsDeviceRegistered,
} from "../../../../services/wearOsHealthService";

// Dimensões originais do SVG (do arquivo running.svg)
const SVG_ORIGINAL_WIDTH = 390;
const SVG_ORIGINAL_HEIGHT = 796;
const SVG_ASPECT_RATIO = SVG_ORIGINAL_HEIGHT / SVG_ORIGINAL_WIDTH;

// Função para calcular dimensões do SVG de forma dinâmica
const calculateSvgDimensions = (screenWidth: number, screenHeight: number) => {
  // Calcular dimensões para exibir 100% do SVG mantendo proporções
  let svgDisplayWidth = screenWidth;
  let svgDisplayHeight = screenWidth * SVG_ASPECT_RATIO;

  // Se a altura calculada for maior que 80% da tela, ajustar pela altura
  const maxHeight = screenHeight * 0.8;
  if (svgDisplayHeight > maxHeight) {
    svgDisplayHeight = maxHeight;
    svgDisplayWidth = svgDisplayHeight / SVG_ASPECT_RATIO;
  }

  return { width: svgDisplayWidth, height: svgDisplayHeight };
};

const DATA_SCREENS: (keyof AppStackParamList)[] = [
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "WaterScreen",
];

const HeartbeatsScreen: React.FC = () => {
  const { user } = useAuth();

  // Estados para dados de saúde do Wear OS em tempo real
  const [heartRate, setHeartRate] = React.useState<number | null>(null);
  const [pressure, setPressure] = React.useState<number | null>(null);
  const [oxygen, setOxygen] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Estados para status de conexão do Wear OS
  const [connectionStatus, setConnectionStatus] = React.useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [connectionMessage, setConnectionMessage] = React.useState<string>("Aguardando conexão...");
  const [lastUpdate, setLastUpdate] = React.useState<string | null>(null);
  const [hasWearOsDevice, setHasWearOsDevice] = React.useState<boolean | null>(null);

  const [svgContent, setSvgContent] = React.useState<string | null>(null);

  // Estado para dimensões dinâmicas do dispositivo
  const [dimensions, setDimensions] = React.useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  // Calcular dimensões do SVG dinamicamente
  const svgDimensions = React.useMemo(
    () => calculateSvgDimensions(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  React.useEffect(() => {
    // Carregar o SVG como string de forma otimizada
    const loadSvg = async () => {
      try {
        // Usar require para carregar o SVG
        const svgModule = require("../../../../assets/running.svg");

        // Se o Metro transformou o SVG em componente, precisamos usar outra abordagem
        // Tentar carregar via Asset
        const asset = Asset.fromModule(svgModule);
        await asset.downloadAsync();

        if (asset.localUri) {
          const response = await fetch(asset.localUri);
          const text = await response.text();
          setSvgContent(text);
        } else if (asset.uri) {
          // Se não tiver localUri, tentar usar uri diretamente
          const response = await fetch(asset.uri);
          const text = await response.text();
          setSvgContent(text);
        }
      } catch (error) {
        console.error("Erro ao carregar SVG:", error);
        // Fallback: tentar carregar diretamente do arquivo
        try {
          const response = await fetch(require("../../../../assets/running.svg"));
          const text = await response.text();
          setSvgContent(text);
        } catch (fallbackError) {
          console.error("Erro no fallback:", fallbackError);
        }
      }
    };
    loadSvg();
  }, []);

  // Buscar e atualizar dados de saúde do Wear OS em tempo real
  React.useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      setConnectionStatus("disconnected");
      setConnectionMessage("Nenhum usuário autenticado");
      return;
    }

    // Converter ID do usuário para número (se necessário)
    const userId = parseInt(user.id, 10);
    if (isNaN(userId)) {
      console.error("ID do usuário inválido:", user.id);
      setIsLoading(false);
      setConnectionStatus("error");
      setConnectionMessage("ID do usuário inválido");
      return;
    }

    if (hasWearOsDevice === null) {
      setConnectionStatus("connecting");
      setConnectionMessage("Verificando dispositivo Wear OS...");
      return;
    }

    if (hasWearOsDevice === false) {
      setIsLoading(false);
      setConnectionStatus("disconnected");
      setConnectionMessage("Nenhum dispositivo Wear OS conectado");
      setHeartRate(null);
      setPressure(null);
      setOxygen(null);
      return;
    }

    // Atualizar status de conexão
    setConnectionStatus("connecting");
    setConnectionMessage("Conectando ao dispositivo Wear OS...");

    // Função assíncrona para carregar dados iniciais
    const loadInitialData = async () => {
      try {
        setConnectionMessage("Buscando dados do dispositivo...");
        const data = await getLatestWearOsHealthData(userId);
        if (data) {
          setHeartRate(data.heartRate);
          setPressure(data.pressure);
          setOxygen(data.oxygen);

          // Verificar se há múltiplos dispositivos para atualizar a mensagem
          const multiDeviceData = await getLatestWearOsHealthDataFromAllDevices(userId);
          if (multiDeviceData && multiDeviceData.deviceData.length > 1) {
            setConnectionMessage(
              `Conectado a ${multiDeviceData.deviceData.length} dispositivos Wear OS`
            );
          } else {
            setConnectionMessage("Conectado ao dispositivo Wear OS");
          }

          setLastUpdate(new Date().toLocaleTimeString());
          setConnectionStatus("connected");
        } else {
          setConnectionStatus("disconnected");
          setConnectionMessage("Nenhum dado de saúde disponível do dispositivo Wear OS");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        setIsLoading(false);
        setConnectionStatus("error");
        setConnectionMessage(
          `Erro ao conectar: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
        Alert.alert(
          "Erro",
          `Falha ao conectar ao dispositivo Wear OS: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
      }
    };

    loadInitialData();

    // Configurar atualização em tempo real usando polling (a cada 5 segundos)
    const cancelPolling = pollWearOsHealthData(
      userId,
      5000, // 5 segundos
      async (data) => {
        setHeartRate(data.heartRate);
        setPressure(data.pressure);
        setOxygen(data.oxygen);

        // Verificar se há atualizações de múltiplos dispositivos
        const multiDeviceData = await getLatestWearOsHealthDataFromAllDevices(userId);
        if (multiDeviceData && multiDeviceData.deviceData.length > 1) {
          setConnectionMessage(
            `Conectado a ${multiDeviceData.deviceData.length} dispositivos Wear OS`
          );
        } else {
          setConnectionMessage("Conectado ao dispositivo Wear OS");
        }

        setLastUpdate(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    );

    // Alternativa: usar realtime do Supabase (descomente se preferir)
    // const cancelRealtime = subscribeToWearOsHealthRealtime(userId, (data) => {
    //   setHeartRate(data.heartRate);
    //   setPressure(data.pressure);
    //   setOxygen(data.oxygen);
    //   setConnectionStatus('connected');
    //   setConnectionMessage('Conectado ao dispositivo Wear OS (realtime)');
    //   setLastUpdate(new Date().toLocaleTimeString());
    //   setIsLoading(false);
    // });

    return () => {
      cancelPolling();
      // cancelRealtime();
    };
  }, [user?.id, hasWearOsDevice]);

  React.useEffect(() => {
    let isActive = true;

    const verifyDevice = async () => {
      if (!user?.id) {
        if (isActive) {
          setHasWearOsDevice(false);
        }
        return;
      }

      const userId = parseInt(user.id, 10);
      if (Number.isNaN(userId)) {
        if (isActive) {
          setHasWearOsDevice(false);
        }
        return;
      }

      try {
        const device = await checkWearOsDeviceRegistered(userId);
        if (isActive) {
          setHasWearOsDevice(Boolean(device));
        }
      } catch {
        if (isActive) {
          setHasWearOsDevice(false);
        }
      }
    };

    verifyDevice();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  // Função para lidar com dados recebidos do dispositivo Wear OS
  // Esta função pode ser chamada quando o dispositivo enviar dados
  // const handleWearOsDataReceived = async (healthData: {
  //   heartRate?: number | null;
  //   bloodPressure?: number | null;
  //   oxygenSaturation?: number | null;
  // }) => {
  //   if (!user?.id) return;
  //
  //   const userId = parseInt(user.id, 10);
  //   if (isNaN(userId)) return;
  //
  //   // Enviar os dados recebidos para o banco de dados
  //   const success = await sendWearOsHealthDataToDatabase(userId, healthData);
  //
  //   if (success) {
  //     console.log("Dados do Wear OS recebidos e armazenados com sucesso:", healthData);
  //     // Atualizar os dados locais
  //     if (healthData.heartRate !== undefined && healthData.heartRate !== null) {
  //       setHeartRate(healthData.heartRate);
  //     }
  //     if (healthData.bloodPressure !== undefined && healthData.bloodPressure !== null) {
  //       setPressure(healthData.bloodPressure);
  //     }
  //     if (healthData.oxygenSaturation !== undefined && healthData.oxygenSaturation !== null) {
  //       setOxygen(healthData.oxygenSaturation);
  //     }
  //     setLastUpdate(new Date().toLocaleTimeString());
  //   } else {
  //     console.error("Falha ao armazenar dados do Wear OS");
  //   }
  // };

  // Listener para detectar mudanças nas dimensões do dispositivo
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Listener para detectar mudanças nas dimensões do dispositivo
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* === BACKGROUND SVG === */}
        <View pointerEvents="none" style={styles.background}>
          <View
            style={[
              styles.svgContainer,
              {
                top: (dimensions.height - svgDimensions.height) / 2,
                left: (dimensions.width - svgDimensions.width) / 2,
                width: svgDimensions.width,
                height: svgDimensions.height,
              },
            ]}
          >
            {svgContent ? (
              <SvgXml
                xml={svgContent}
                width={svgDimensions.width}
                height={svgDimensions.height}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : null}
          </View>
        </View>

        {/* === CONTEÚDO POR CIMA DA IMAGEM === */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overlayContent}>
            {/* Header */}
            <View style={styles.header}>
              <BackButton to={{ name: "DataScreen" }} />
              <Text style={styles.headerTitle}>Frequência cardíaca</Text>
              <View style={{ width: 46 }} />
            </View>

            {/* Status de Conexão do Wear OS */}
            <View
              style={[
                styles.connectionStatusContainer,
                styles[`connectionStatus${connectionStatus}`],
              ]}
            >
              {connectionStatus === "connected" && (
                <Wifi size={16} color="#10B981" style={{ marginRight: 8 }} />
              )}
              {connectionStatus === "connecting" && (
                <Watch size={16} color="#F59E0B" style={{ marginRight: 8 }} />
              )}
              {connectionStatus === "disconnected" && (
                <Watch size={16} color="#EF4444" style={{ marginRight: 8 }} />
              )}
              {connectionStatus === "error" && (
                <AlertTriangle size={16} color="#EF4444" style={{ marginRight: 8 }} />
              )}

              <View>
                <Text style={styles.connectionStatusText}>{connectionMessage}</Text>
                {lastUpdate && (
                  <Text style={styles.lastUpdateText}>Última atualização: {lastUpdate}</Text>
                )}
              </View>
            </View>

            {/* Frequência Cardíaca com ECG */}
            <View style={styles.heartRateContainer}>
              <ECGDisplay
                bpm={heartRate}
                width={280}
                height={70}
                responsive={false}
                isConnected={connectionStatus === "connected"}
              />

              <View style={styles.heartRatePrimaryInfo}>
                {isLoading ? (
                  <Text style={styles.heartRateValue}>--</Text>
                ) : (
                  <Text style={styles.heartRateValue}>
                    {heartRate !== null ? Math.round(heartRate) : "--"}
                    <Text style={styles.heartRateUnit}> bpm</Text>
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.connectionIndicator,
                  {
                    color: connectionStatus === "connected" ? "#10B981" : "#EF4444",
                  },
                ]}
              >
                {connectionStatus === "connected" ? "● Conectado" : "● Desconectado"}
              </Text>
            </View>

            <View></View>

            {/* Espaço para não ficar coberto pelos cards fixos */}
            <View style={{ height: 180 }} />
          </View>
        </ScrollView>

        {/* Cards fixos no final */}
        <View style={styles.fixedCardsContainer} pointerEvents="box-none">
          {/* Pressão */}
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Pressão</Text>
              <View style={styles.cardContent}>
                <Activity size={26} color="#FF8C00" style={{ marginRight: 12 }} />
                <View style={styles.cardValueContainer}>
                  <Text style={styles.cardValue}>
                    {isLoading ? "--" : pressure !== null ? Math.round(pressure) : "--"}
                  </Text>
                  <Text style={styles.cardUnit}>mmHg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Oxigênio */}
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Oxigênio</Text>
              <View style={styles.cardContent}>
                <Wind size={26} color="#00BFFF" style={{ marginRight: 12 }} />
                <View style={styles.cardValueContainer}>
                  <Text style={styles.cardValue}>
                    {isLoading ? "--" : oxygen !== null ? Math.round(oxygen) : "--"}
                  </Text>
                  <Text style={styles.cardUnit}>SpO2</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Setas de navegação */}
        <NavigationArrows currentScreen="HeartbeatsScreen" screens={DATA_SCREENS} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
    overflow: "hidden",
  },
  svgContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -376,
    marginLeft: -230,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  overlayContent: {
    paddingHorizontal: 20,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  // === HEADER ===
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
  },

  // === FREQUÊNCIA CARDÍACA ===
  heartRateContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  heartRatePrimaryInfo: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  heartRateValue: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#192126",
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartRateUnit: {
    fontSize: 28,
    fontWeight: "500",
    color: "#797E86",
  },
  connectionIndicator: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },

  // === CARDS ===
  fixedCardsContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 114,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  card: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.9)",
  },
  cardInner: {
    padding: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#192126",
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardValueContainer: {
    flexDirection: "column",
  },
  cardValue: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#192126",
  },
  cardUnit: {
    fontSize: 15,
    color: "#797E86",
    marginTop: -4,
  },

  // === STATUS DE CONEXÃO ===
  connectionStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  connectionStatusconnected: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "#10B981",
  },
  connectionStatusconnecting: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "#F59E0B",
  },
  connectionStatusdisconnected: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#EF4444",
  },
  connectionStatuserror: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#EF4444",
  },
  connectionStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#192126",
  },
  lastUpdateText: {
    fontSize: 12,
    color: "#797E86",
    marginTop: 2,
  },
});

export default HeartbeatsScreen;
