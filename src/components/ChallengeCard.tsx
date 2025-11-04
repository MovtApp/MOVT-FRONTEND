import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  ImageBackground,
  TouchableOpacity,
} from "react-native";

interface ChallengeCardProps {
  image: ImageSourcePropType;
  title: string;
  onPress: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ image, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <ImageBackground
        source={image}
        style={styles.cardImageBackground}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
  },
  cardImageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  overlay: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default ChallengeCard;
