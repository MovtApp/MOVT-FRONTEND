import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";

interface SocialButtonProps {
  type: "google" | "facebook" | "apple";
  text: string;
  onPress: () => void;
}

const iconMap = {
  google: <AntDesign name="google" size={20} color="#EA4335" />,
  facebook: <FontAwesome name="facebook" size={20} color="#1877F3" />,
  apple: <Ionicons name="logo-apple" size={20} color="#000" />,
};

const SocialButton: React.FC<SocialButtonProps> = ({ type, text, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.icon}>{iconMap[type]}</View>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    justifyContent: "center",
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    color: "#222",
  },
});

export default SocialButton;
