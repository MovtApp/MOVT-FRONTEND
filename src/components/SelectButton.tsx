import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Text, StyleProp } from "react-native";

interface SelectButtonProps {
  text: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const SelectButton: React.FC<SelectButtonProps> = ({
  text,
  onPress,
  style,
  textStyle,
  disabled,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {icon && icon}
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#F5F6F9",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: {
    color: "#192126",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});
