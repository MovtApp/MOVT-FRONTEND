import { COLORS } from "@styles/colors";
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  maxLength?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = "default",
  maxLength,
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.leftIcon}>{icon}</View>}
      <TextInput
        style={[styles.input, icon ? { paddingLeft: 44 } : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize="none"
      />
    </View>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    fontFamily: "Rubik_400Regular",
    borderWidth: 1,
    borderColor: COLORS.grayscale[20],
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: COLORS.grayscale[0],
    minHeight: 48,
    flex: 1,
  },
  leftIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: [{ translateY: -12 }], // Centraliza verticalmente considerando height: 48 e icon: 24
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
});
