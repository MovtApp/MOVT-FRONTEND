import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle, Platform } from "react-native";
import Constants from "expo-constants";

interface Props {
  style?: ViewStyle;
}

export const FooterVersion: React.FC<Props> = ({ style }) => {
  // Busca a versão definida no app.json de forma automática
  const version = Constants.expoConfig?.version || "1.0.0";

  return (
    <View style={[styles.footer, style]}>
      <Image
        source={{
          uri: "https://res.cloudinary.com/dgxavefbh/image/upload/v1771958920/Component_13_cwktao.png",
        }}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.versionText}>Versão {version}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: "flex-start",
    marginTop: 50,
    marginBottom: 30,
  },
  logoImage: {
    width: Platform.select({ ios: 90, android: 100 }),
    height: Platform.select({ ios: 45, android: 50 }),
    marginBottom: -6,
  },
  versionText: {
    fontSize: 14,
    color: "#192126",
    fontFamily: "Rubik_400Regular",
    opacity: 0.8,
  },
});
