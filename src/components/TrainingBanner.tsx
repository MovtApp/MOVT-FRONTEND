import { ArrowRight } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from "react-native";

interface TrainingBannerProps {
  title: string;
  imageUrl: string;
  onPress: () => void;
}

const TrainingBanner: React.FC<TrainingBannerProps> = ({
  title,
  imageUrl,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.bannerContainer}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onPress} style={styles.linkContainer}>
            <Text style={styles.linkText}>Ver mais</Text>
            <ArrowRight size={18} color={"#BBF246"} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
  },
  backgroundImage: {
    width: "100%",
    height: 200,
  },
  imageStyle: {
    borderRadius: 16,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#BBF246",
    marginRight: 5, // Espaçamento entre o texto e o ícone
  },
});

export default TrainingBanner;
