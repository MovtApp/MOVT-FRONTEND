import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "./Text";

interface InputProps {
  text: string;
  onPress?: () => void;
  style?: any;
  textStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  text,
  onPress,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.Button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.ButtonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  Button: {
    backgroundColor: "#F5F6F9",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22,
  },
  ButtonText: {
    color: "#192126",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});
