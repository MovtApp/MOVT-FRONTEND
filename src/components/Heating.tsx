import React, { useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { Clock, Play, ChevronRight, Activity } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface Heating {
  imageUrl: string;
  title: string;
  level: string;
  minutes: string;
  id: string;
}

const heatingData: Heating[] = [
  {
    id: "1",
    title: "Mobilidade Articular",
    level: "Iniciante",
    minutes: "10 min",
    imageUrl:
      "https://img.freepik.com/free-photo/close-up-diversity-sport-woman-training_23-2149174755.jpg?t=st=1758304427~exp=1758308027~hmac=41581cca3f5711388c58aa44f0a34ae2987db489977a6a44f18ae8cf1f8dc66d&w=1060",
  },
  {
    id: "2",
    title: "Cárdio na Esteira",
    level: "Iniciante",
    minutes: "15 min",
    imageUrl:
      "https://img.freepik.com/free-photo/young-adult-doing-indoor-sport-gym_23-2149205553.jpg?t=st=1758304525~exp=1758308125~hmac=0b7e81fe45e19678de8a25feb63f9ec4b1cbb193d17d2718643d65ff5403e21f&w=1060",
  },
  {
    id: "3",
    title: "Elevação de Pernas",
    level: "Modo Ativo",
    minutes: "12 min",
    imageUrl:
      "https://img.freepik.com/free-photo/side-view-determined-young-woman-holding-slam-ball-with-her-legs-doing-abdominal-crunches-have-flat-abs_662251-1367.jpg?t=st=1758304715~exp=1758308315~hmac=28cd720f804c7bf649b7d575084bd3812f74fb786d8df1daf0da95a43b182eef&w=1480",
  },
];

const HeatingCard: React.FC<{ item: Heating; onPress?: () => void }> = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 2, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }, { translateY }] }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <LinearGradient
          colors={["#FFFFFF", "#F9FAFB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Seção da Imagem (100% de Altura) */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.04)"]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Conteúdo do Texto */}
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <View style={styles.typeBadge}>
                <Activity size={10} color="#BBF246" />
                <Text style={styles.typeBadgeText}>AQUECIMENTO</Text>
              </View>
            </View>

            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={styles.infoText}>{item.minutes}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoItem}>
                <Text style={styles.infoText}>{item.level}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Text style={styles.actionText}>Ver detalhes</Text>
              <ChevronRight size={14} color="#6B7280" />
            </View>
          </View>

          {/* Botão de Navegação Lateral */}
          <TouchableOpacity style={styles.navButton} activeOpacity={0.7}>
            <Play size={14} fill="#192126" color="#192126" />
          </TouchableOpacity>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

interface HeatingScreenProps {
  heatingData?: Heating[];
  onPressItem?: (item: Heating) => void;
}

const HeatingScreen: React.FC<HeatingScreenProps> = ({ heatingData: propData, onPressItem }) => {
  const data = propData || heatingData;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Aquecimento rápido</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>

      <View style={styles.cardsList}>
        {data.map((item) => (
          <HeatingCard key={item.id} item={item} onPress={() => onPressItem?.(item)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: 10,
    marginBottom: 100,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  activeIndicator: {
    width: 30,
    height: 4,
    backgroundColor: "#BBF246",
    borderRadius: 2,
    marginTop: 4,
  },
  cardsList: {
    gap: 16,
    marginTop: 10,
  },
  cardWrapper: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    height: 120,
  },
  imageContainer: {
    width: 110,
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  headerRow: {
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#BBF246",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: Platform.select({ ios: 17, android: 16 }),
    fontWeight: "800",
    color: "#192126",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  infoText: {
    fontSize: Platform.select({ ios: 11, android: 9 }),
    color: "#9CA3AF",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: Platform.select({ ios: 12, android: 10 }),
    fontWeight: "700",
    color: "#4B5563",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
});

export default React.memo(HeatingScreen);
