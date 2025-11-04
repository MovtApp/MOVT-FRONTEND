import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../@types/routes";

type NavigationArrowsProps = {
  currentScreen: keyof AppStackParamList;
  screens: (keyof AppStackParamList)[];
};

const NavigationArrows: React.FC<NavigationArrowsProps> = ({ currentScreen, screens }) => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handlePreviousScreen = () => {
    const currentIndex = screens.indexOf(currentScreen);
    const previousIndex = currentIndex === 0 ? screens.length - 1 : currentIndex - 1;
    navigation.navigate(screens[previousIndex] as any);
  };

  const handleNextScreen = () => {
    const currentIndex = screens.indexOf(currentScreen);
    const nextIndex = currentIndex === screens.length - 1 ? 0 : currentIndex + 1;
    navigation.navigate(screens[nextIndex] as any);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.arrowPill, styles.leftArrowPill]}
        onPress={handlePreviousScreen}
      >
        <ChevronLeft size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrowPill, styles.rightArrowPill]}
        onPress={handleNextScreen}
      >
        <ChevronRight size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0,
    transform: [{ translateY: -50 }],
    zIndex: 10,
  },
  arrowPill: {
    width: 44,
    height: 88,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#192126",
  },
  leftArrowPill: {
    position: "absolute",
    left: 6,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  rightArrowPill: {
    position: "absolute",
    right: 6,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
});

export default NavigationArrows;
