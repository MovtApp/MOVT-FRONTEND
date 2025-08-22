import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import BackButton from "@components/BackButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/@types/routes";
import { useNavigation } from "@react-navigation/native";

const { height: screenHeight } = Dimensions.get("window");
const ITEM_HEIGHT = 60; // Altura de cada item de altura

const HeightScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedHeight, setSelectedHeight] = useState(165);
  const scrollViewRef = useRef<ScrollView>(null);
  const heights = Array.from({ length: 151 }, (_, i) => i + 100); // 100 a 250 cm

  // Centralizar a altura inicial quando o componente montar
  useEffect(() => {
    const initialIndex = heights.indexOf(selectedHeight);
    if (initialIndex !== -1) {
      setTimeout(() => {
        const scrollPosition = initialIndex * ITEM_HEIGHT;
        scrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: false,
        });
      }, 100);
    }
  }, [selectedHeight, heights]);

  const handleHeight = () => {
    navigation.navigate("Info", { screen: "ObjectivesScreen" });
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
      <BackButton />
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
        <View style={styles.pickerTrack}>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="center"
            decelerationRate="fast"
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={styles.scrollContent}
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

      <TouchableOpacity style={styles.advanceButton} onPress={handleHeight}>
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
    paddingTop: 60,
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
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  heightDisplay: {
    alignItems: "center",
    marginVertical: 30,
    marginBottom: 10,
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
    alignItems: "center",
    marginVertical: 40,
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
    height: screenHeight * 0.4, // Altura responsiva
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
    paddingVertical: (screenHeight * 0.4 - 60) / 2, // Centralizar perfeitamente
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
    marginBottom: 30,
    marginTop: 30,
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
