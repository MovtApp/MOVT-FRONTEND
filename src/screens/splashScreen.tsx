import React, { useEffect } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<any, "SplashScreen">;

export function SplashScreen({ navigation }: Props) {
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          // Usuário está autenticado, navegar para App
          navigation.replace("App");
        } else {
          // Usuário não está autenticado, navegar para Auth
          navigation.replace("Auth");
        }
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigation, user, loading]);

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={require("../assets/Background.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00123D" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BBF246",
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 252,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 270,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
