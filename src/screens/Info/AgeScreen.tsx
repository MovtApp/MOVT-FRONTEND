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
import { useNavigation } from "@react-navigation/native";
import RootStackParamList from "@typings/routes";

const { width: screenWidth } = Dimensions.get("window");
const ITEM_WIDTH = 80; // Largura de cada item de peso

const AgeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedAge, setSelectedAge] = useState(75);
  const scrollViewRef = useRef<ScrollView>(null);
  const ages = Array.from({ length: 100 }, (_, i) => i + 1); // 1 a 100 anos

  // Centralizar o peso inicial quando o componente montar
  useEffect(() => {
    const initialIndex = ages.indexOf(selectedAge);
    if (initialIndex !== -1) {
      setTimeout(() => {
        const scrollPosition = initialIndex * ITEM_WIDTH;
        scrollViewRef.current?.scrollTo({
          x: scrollPosition,
          animated: false,
        });
      }, 100);
    }
  }, [selectedAge, ages]);

  const handleAge = () => {
    navigation.navigate("Info", { screen: "HeightScreen" });
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / ITEM_WIDTH);
    const newAge = ages[index];
    if (newAge && newAge !== selectedAge) {
      setSelectedAge(newAge);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton />
        <Text style={styles.title}>Idade</Text>
        <Text style={styles.question}>Quantos anos você tem?</Text>
        <Text style={styles.instruction}>Por favor, informe sua idade.</Text>

        <View style={styles.ageDisplay}>
          <View style={styles.weightContainer}>
            <Text style={styles.selectedAge}>{selectedAge}</Text>
          </View>
          <View style={styles.triangleUp} />
        </View>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerTrack}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              onMomentumScrollEnd={handleScroll}
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
            >
              {ages.map((age, index) => (
                <View key={age} style={styles.ageItem}>
                  <Text
                    style={[
                      styles.ageNumber,
                      age === selectedAge && styles.selectedAgeNumber,
                    ]}
                  >
                    {age}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.advanceButton} onPress={handleAge}>
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
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
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
  ageDisplay: {
    alignItems: "center",
    marginVertical: 30,
    marginBottom: 10,
    flexDirection: "column",
    justifyContent: "center",
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  selectedAge: {
    fontFamily: "Rubik_700Bold",
    fontSize: 48,
    color: "#111",
    marginBottom: 0,
  },
  triangleUp: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderTopWidth: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#111",
    borderTopColor: "transparent",
  },
  pickerContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  pickerTrack: {
    backgroundColor: "#BBF246", // Verde lima como na imagem
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    width: screenWidth - 0, // Largura responsiva
    height: 100,
    overflow: "hidden",
    position: "relative",
  },
  tickMarksContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: (screenWidth - 80) / 2,
  },
  tickMarkContainer: {
    width: ITEM_WIDTH,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  tickMark: {
    width: 2,
    height: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginBottom: 15,
  },
  selectedTickMark: {
    width: 3,
    height: 30,
    backgroundColor: "#111",
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: (screenWidth - 80) / 2, // Centralizar perfeitamente
  },
  ageItem: {
    width: ITEM_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  ageNumber: {
    fontFamily: "Rubik_400Regular",
    fontSize: 40,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  selectedAgeNumber: {
    fontFamily: "Rubik_700Bold",
    fontSize: 40,
    color: "#fff",
  },
  advanceButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 50,
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});

export default AgeScreen;
