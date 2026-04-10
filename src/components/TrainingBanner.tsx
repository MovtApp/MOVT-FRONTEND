import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Pressable,
  Platform,
  TouchableOpacity,
} from "react-native";
import { ArrowRight, Star } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface TrainingBannerProps {
  title: string;
  imageUrl: string;
  onPress: () => void;
  category?: string;
  tag?: string;
}

const TrainingBanner: React.FC<TrainingBannerProps> = ({
  title,
  imageUrl,
  onPress,
  category = "TREINO DO DIA",
  tag = "PREMIUM",
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.container}
      >
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.backgroundImage}
          imageStyle={styles.imageStyle}
        >
          {/* Overlay Cinematográfico com Gradiente */}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.4, 1]}
            style={styles.overlay}
          >
            {/* Tag Superior */}
            <View style={styles.topInfo}>
              <View style={styles.premiumTag}>
                <Star size={10} color="#192126" fill="#192126" />
                <Text style={styles.premiumText}>{tag}</Text>
              </View>
            </View>

            {/* Conteúdo Central/Inferior */}
            <View style={styles.content}>
              <Text style={styles.categoryLabel}>{category}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>Começar treino</Text>
                  <View style={styles.arrowCircle}>
                    <ArrowRight size={14} color="#192126" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 0,
    borderRadius: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 30,
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: Platform.select({ ios: 180, android: 220 }),
  },
  imageStyle: {
    borderRadius: 24,
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  topInfo: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
  },
  premiumTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BBF246",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#192126",
    letterSpacing: 0.5,
  },
  content: {
    // Agora o conteúdo será centralizado pelo overlay
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#BBF246",
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 10,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TrainingBanner;
