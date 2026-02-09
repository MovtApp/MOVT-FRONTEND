import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from "react-native";
import { Users } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Header from "@components/Header";
import { useAuth } from "@contexts/AuthContext";
import { listCommunities } from "@services/communityService";
import Communities from "@components/Communities";
import { FooterVersion } from "@components/FooterVersion";
import { AppStackParamList, Community } from "../../../@types/routes";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = 270;
const SPACING = (width - ITEM_WIDTH) / 2;

// Imagens do carousel
const heroImages = [
  "https://res.cloudinary.com/ditlmzgrh/image/upload/v1766512184/image_fqqud0.png",
  "https://res.cloudinary.com/ditlmzgrh/image/upload/v1766512307/image_1_v03nyz.png",
  "https://img.freepik.com/free-photo/yoga-group-enjoying-outdoor-workout_1262-20499.jpg?t=st=1766512380~exp=1766515980~hmac=27576ac5ad65441c2d80f61fd4f2841ba71fc535f4014c71c26bac1f15514fa5&w=1480",
];

const CommunityScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'CommunityScreen'>>(); // Hook to access route params
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || "Todas");
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Update selectedCategory if it changes via route params (e.g., subsequent navigations)
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  useEffect(() => {
    if (user?.sessionId) {
      fetchCommunities();
    }
  }, [user, selectedCategory]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      if (user?.sessionId) {
        const data = await listCommunities(user.sessionId, selectedCategory);

        // Adaptar dados da API para garantir que seja um array
        let formattedData: Community[] = [];
        if (Array.isArray(data)) {
          formattedData = data;
        } else if (data && Array.isArray(data.data)) {
          formattedData = data.data;
        }

        setCommunities(formattedData);
      }
    } catch (error) {
      console.error("Erro ao buscar comunidades:", error);
      Alert.alert("Erro", "Não foi possível carregar as comunidades.");
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = event.nativeEvent.contentOffset.x / ITEM_WIDTH;
    const roundIndex = Math.round(index);
    setActiveBannerIndex(roundIndex);
  };

  const filteredCommunities = communities.filter((item) => {
    if (selectedCategory === "Todas") return true;

    // Proteção contra valores nulos/undefined
    const nome = item.nome || "";
    const categoria = item.categoria || "";

    return (
      categoria === selectedCategory || nome.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  const handleSelectCategory = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("Todas");
    } else {
      setSelectedCategory(category);
    }
  };

  const renderHeroItem = ({ item, index }: { item: string; index: number }) => {
    const inputRange = [(index - 1) * ITEM_WIDTH, index * ITEM_WIDTH, (index + 1) * ITEM_WIDTH];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [-80, 0, 80],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[styles.heroImageContainer, { transform: [{ scale }, { translateX }], opacity }]}
      >
        <Image source={{ uri: item }} style={styles.heroImage} />
      </Animated.View>
    );
  };

  const CellRenderer = useCallback(
    ({ index, children, style, ...props }: any) => {
      const zIndex = heroImages.length - Math.abs(activeBannerIndex - index);
      return (
        <View style={[style, { zIndex, elevation: zIndex }]} index={index} {...props}>
          {children}
        </View>
      );
    },
    [activeBannerIndex]
  );

  const handleCommunityPress = (community: Community) => {
    navigation.navigate("CommunityDetails", { community });
  };

  return (
    <View style={styles.container}>
      <Header showNotifications={true} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentHeader}>
          <Text style={styles.headerTitle}>Comunidades</Text>
        </View>

        {/* Hero Image - Carousel */}
        <View style={styles.heroContainer}>
          <Animated.FlatList
            data={heroImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SPACING }}
            keyExtractor={(_, index) => index.toString()}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
              listener: handleScroll,
            })}
            scrollEventThrottle={16}
            renderItem={renderHeroItem}
            CellRendererComponent={CellRenderer}
          />
          <View style={styles.paginationContainer}>
            {heroImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeBannerIndex ? styles.paginationDotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {/* Communities Section */}
          <Communities
            showSeeAll={false}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Encontre as comunidades perto de você!</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          /* Nearby Communities Cards */
          communities.map((item, index) => (
            <TouchableOpacity
              key={item.id_comunidade ? String(item.id_comunidade) : `comm-${index}`}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => handleCommunityPress(item)}
            >
              <Image
                source={{ uri: item.imageurl || "https://via.placeholder.com/150" }}
                style={styles.cardImage}
              />

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.nome || "Sem Nome"}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.descricao || "Sem descrição disponível."}
                </Text>

                <View style={styles.confirmedRow}>
                  <Users size={16} color="#666" />
                  <Text style={styles.confirmedText}>
                    {item.participantes || 0}/{item.max_participantes || 50} confirmados
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <FooterVersion style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  footer: {
    paddingHorizontal: 30,
    marginTop: 20,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
  contentHeader: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  heroContainer: {
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImageContainer: {
    width: ITEM_WIDTH,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: 270,
    height: 200,
    borderRadius: 20,
    resizeMode: "cover",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    paddingHorizontal: 30,
    marginBottom: 16,
  },
  section: {
    marginBottom: 10,
    paddingHorizontal: 30,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 30,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: 120,
    height: 140,
    resizeMode: "cover",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmedText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#4CAF50",
    width: 24,
  },
});

export default CommunityScreen;
