import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifyError } from "../../utils/notify";
import BackButton from "@components/BackButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@typings/routes"; // Corrigida a importação de RootStackParamList

const ITEM_HEIGHT = 60; // Altura de cada item de altura

const HeightScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [selectedHeight, setSelectedHeight] = useState(165);
  // Altura real do track (medida via onLayout). O picker agora é flexível, então
  // não dá para derivar a centralização de um valor fixo — medimos e calculamos.
  const [trackHeight, setTrackHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const didCenterRef = useRef(false);
  const heights = Array.from({ length: 151 }, (_, i) => i + 100); // 100 a 250 cm

  // Centralizar a altura inicial assim que soubermos a altura do track (uma vez).
  useEffect(() => {
    if (trackHeight <= 0 || didCenterRef.current) return;
    const initialIndex = heights.indexOf(selectedHeight);
    if (initialIndex !== -1) {
      didCenterRef.current = true;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [trackHeight, selectedHeight, heights]);

  const handleHeight = async () => {
    try {
      await AsyncStorage.setItem("@MOVT:onboarding:height", String(selectedHeight));
      navigation.navigate("Info", { screen: "WeightScreen" });
    } catch (e) {
      console.error("Erro ao salvar altura:", e);
      notifyError("Não foi possível salvar. Tente novamente.");
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffset / ITEM_HEIGHT);
    const newHeight = heights[index];
    if (newHeight && newHeight !== selectedHeight) {
      setSelectedHeight(newHeight);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton autoTopInset />
      <Text style={styles.title}>Altura</Text>
      <Text style={styles.question}>Qual é sua altura?</Text>
      <Text style={styles.instruction}>Indique sua altura em centímetros</Text>

      <View style={styles.heightDisplay}>
        <View style={styles.heightContainer}>
          <Text style={styles.selectedHeight}>{selectedHeight}</Text>
          <Text style={styles.heightUnit}>cm</Text>
        </View>
      </View>

      <View style={styles.pickerContainer}>
        <View
          style={styles.pickerTrack}
          onLayout={(e) => setTrackHeight(e.nativeEvent.layout.height)}
        >
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            onMomentumScrollEnd={handleScroll}
            onScrollEndDrag={handleScroll}
            contentContainerStyle={[
              styles.scrollContent,
              // Centraliza o item selecionado com base na altura medida do track.
              { paddingVertical: Math.max(0, (trackHeight - ITEM_HEIGHT) / 2) },
            ]}
            style={styles.scrollView}
          >
            {heights.map((height, index) => (
              <View key={height} style={styles.heightItem}>
                <Text
                  style={[
                    styles.heightNumber,
                    height === selectedHeight && styles.selectedHeightNumber,
                  ]}
                >
                  {height}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={styles.triangleRight} />
      </View>

      <TouchableOpacity
        style={[
          styles.advanceButton,
          // No Android o insets.bottom pode voltar 0 (nav de 3 botões), então
          // garantimos uma folga mínima para o botão nunca ficar sob a barra nativa.
          { marginBottom: Platform.OS === "android" ? Math.max(insets.bottom, 24) : 50 },
        ]}
        onPress={handleHeight}
      >
        <Text style={styles.advanceButtonText}>Avançar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 32,
    marginTop: 30,
    marginBottom: 4,
    color: "#111",
  },
  question: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    marginTop: 10,
    color: "#111",
    marginBottom: 8,
  },
  instruction: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  heightDisplay: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 0,
    flexDirection: "column",
    justifyContent: "center",
  },
  heightContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  selectedHeight: {
    fontFamily: "Rubik_700Bold",
    fontSize: 48,
    color: "#111",
    marginBottom: 0,
  },
  heightUnit: {
    fontFamily: "Rubik_400Regular",
    fontSize: 20,
    color: "#111",
    marginLeft: 4,
    marginBottom: 0,
    alignSelf: "flex-start",
  },
  pickerContainer: {
    // flex:1 faz o picker absorver o espaço vertical restante e encolher em
    // telas baixas, garantindo que o botão Avançar sempre tenha lugar embaixo.
    flex: 1,
    alignItems: "center",
    marginVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  pickerTrack: {
    backgroundColor: "#BBF246", // Verde lima como na imagem
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    // Altura relativa ao espaço disponível (não mais fixa em 40% da tela), com
    // teto para não esticar demais em telas altas / tablets.
    height: "90%",
    maxHeight: 420,
    minHeight: 180,
    overflow: "hidden",
    position: "relative",
    borderRadius: 8,
  },
  scrollView: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    alignItems: "center",
    // paddingVertical aplicado inline (depende da altura medida do track).
  },
  heightItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  heightNumber: {
    fontFamily: "Rubik_400Regular",
    fontSize: 40,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  selectedHeightNumber: {
    fontFamily: "Rubik_700Bold",
    fontSize: 40,
    color: "#fff",
  },
  advanceButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8, // o picker (flex:1) já ocupa o espaço; botão fica logo abaixo
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  triangleRight: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 0,
    borderRightWidth: 12,
    borderBottomWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "#111",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 8,
    alignSelf: "center",
  },
});

export default HeightScreen;
