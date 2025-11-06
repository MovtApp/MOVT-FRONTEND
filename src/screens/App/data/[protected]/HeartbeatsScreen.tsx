import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { Heart, Activity, Wind } from "lucide-react-native";
import { SvgXml } from "react-native-svg";
import { Asset } from "expo-asset";


// Dimensões originais do SVG (do arquivo running.svg)
const SVG_ORIGINAL_WIDTH = 390;
const SVG_ORIGINAL_HEIGHT = 796;
const SVG_ASPECT_RATIO = SVG_ORIGINAL_HEIGHT / SVG_ORIGINAL_WIDTH;

// Função para calcular dimensões do SVG de forma dinâmica
const calculateSvgDimensions = (screenWidth: number, screenHeight: number) => {
  const screenAspectRatio = screenHeight / screenWidth;
  
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
  "TrainingScreen",
  "WaterScreen",
];

const HeartbeatsScreen: React.FC = () => {
  const heartRate = 112;
  const pressure = 112;
  const oxygen = 95;
  const [svgContent, setSvgContent] = React.useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
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
          // Animar quando o SVG carregar
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        } else if (asset.uri) {
          // Se não tiver localUri, tentar usar uri diretamente
          const response = await fetch(asset.uri);
          const text = await response.text();
          setSvgContent(text);
          // Animar quando o SVG carregar
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error("Erro ao carregar SVG:", error);
        // Fallback: tentar carregar diretamente do arquivo
        try {
          const response = await fetch(
            require("../../../../assets/running.svg")
          );
          const text = await response.text();
          setSvgContent(text);
          // Animar quando o SVG carregar
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        } catch (fallbackError) {
          console.error("Erro no fallback:", fallbackError);
        }
      }
    };
    loadSvg();
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
          <Animated.View
            style={[
              styles.svgContainer,
              {
                top: (dimensions.height - svgDimensions.height) / 2,
                left: (dimensions.width - svgDimensions.width) / 2,
                width: svgDimensions.width,
                height: svgDimensions.height,
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 3],
                      outputRange: [1, 5],
                    }),
                  },
                ],
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
          </Animated.View>
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
              <BackButton />
              <Text style={styles.headerTitle}>Frequência cardíaca</Text>
              <View style={{ width: 46 }} />
            </View>

            {/* Frequência Cardíaca */}
            <View style={styles.heartRateContainer}>
              <View style={styles.heartRatePrimaryInfo}>
                <Heart size={44} color="#FF0000" fill="#FF0000" style={{ marginRight: 16 }} />
                <Text style={styles.heartRateValue}>
                  {heartRate}
                  <Text style={styles.heartRateUnit}> bpm</Text>
                </Text>
              </View>
            </View>

            <View>
              
            </View>

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
                  <Text style={styles.cardValue}>{pressure}</Text>
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
                  <Text style={styles.cardValue}>{oxygen}</Text>
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
    marginLeft: -230
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
    flexDirection: "row",
    alignItems: "center",
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
});

export default HeartbeatsScreen;