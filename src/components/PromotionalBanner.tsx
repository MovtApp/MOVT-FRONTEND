import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PromotionalBannerProps {
  gender: "male" | "female";
}

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ gender }) => {
  const womanImageUrl =
    "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757510977/Group_1000001568_6_yvfeg7.png";
  const manImageUrl =
    "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757685101/Group_1000001569_spmkb7.png";

  const displayedImage = gender === "male" ? womanImageUrl : manImageUrl;

  return (
    <View style={styles.bannerContainer}>
      <Image
        source={{ uri: displayedImage }} // Imagem da mulher
        style={styles.personImage}
        resizeMode="contain"
      />
      <LinearGradient
        colors={["#192126", "#BBF246"]}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Comece forte e defina suas metas!</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Let&apos;s go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginBottom: 30,
    marginTop: 10,
    position: "relative",
    height: 160,
  },
  banner: {
    borderRadius: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  personImage: {
    position: "absolute",
    width: 350,
    height: 232,
    zIndex: 1000,
    marginTop: -36,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    marginLeft: 150,
  },
  bannerText: {
    maxWidth: "100%",
    alignItems: "flex-start",
    paddingRight: 50,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: "#192126",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bannerButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  dumbbellsImage: {
    position: "relative",
    bottom: 10,
    right: 10,
    width: 80,
    height: 80,
    zIndex: 4,
  },
});

export default PromotionalBanner;
