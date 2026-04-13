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
import { Users, Settings, Search, MapPin, Star, TrendingUp } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@components/Header";
import { useAuth } from "@contexts/AuthContext";
import { listCommunities } from "@services/communityService";
import Communities from "@components/Communities";
import { FooterVersion } from "@components/FooterVersion";
import { AppStackParamList, Community } from "../../../@types/routes";
import CommunityManagementSheet, {
  CommunityManagementSheetRef,
} from "../admin/[protected]/components/CommunityManagementSheet";

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
  const route = useRoute<RouteProp<AppStackParamList, "CommunityScreen">>(); // Hook to access route params
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || "Todas");
  const scrollX = useRef(new Animated.Value(0)).current;

  // Ref e estado para uso do Admin
  const adminSheetRef = useRef<CommunityManagementSheetRef>(null);
  const isFocused = useIsFocused();
  const isAdmin = user?.id === "15" || String(user?.id_us) === "15";

  useEffect(() => {
    if (isFocused) {
      fetchCommunities();
    }
  }, [isFocused]);

  useEffect(() => {
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
          <Communities
            showSeeAll={false}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comunidades em Destaque</Text>
          <TrendingUp size={20} color="#BBF246" />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#BBF246" />
          </View>
        ) : (
          <View style={styles.cardsWrapper}>
            {filteredCommunities.map((item, index) => {
              const participants = Number(item.participantes) || 0;
              const maxParticipants = item.max_participantes || 50;
              const progress = Math.min(participants / maxParticipants, 1);

              return (
                <TouchableOpacity
                  key={item.id_comunidade ? String(item.id_comunidade) : `comm-${index}`}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => handleCommunityPress(item)}
                >
                  <View style={styles.cardImageWrapper}>
                    <Image
                      source={{
                        uri:
                          item.imageurl ||
                          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
                      }}
                      style={styles.cardImage}
                    />
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.categoria || "Geral"}</Text>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.nome || "Sem Nome"}
                      </Text>
                      <View style={styles.locationRow}>
                        <MapPin size={12} color="#94A3B8" />
                        <Text style={styles.locationText}>São Paulo, SP</Text>
                      </View>
                    </View>

                    <View style={styles.progressSection}>
                      <View style={styles.confirmedRow}>
                        <Users size={14} color="#64748B" />
                        <Text style={styles.confirmedText}>
                          {participants} de {maxParticipants} membros
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ paddingHorizontal: 25 }}>
          <FooterVersion />
        </View>
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity
          style={styles.adminFab}
          onPress={() => adminSheetRef.current?.open()}
          activeOpacity={0.8}
        >
          <Settings size={28} color="#000" />
        </TouchableOpacity>
      )}

      {isAdmin && (
        <CommunityManagementSheet ref={adminSheetRef} onClose={() => fetchCommunities()} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentHeader: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  section: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  cardsWrapper: {
    paddingHorizontal: 25,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    height: 160,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImageWrapper: {
    width: 120,
    height: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(25, 33, 38, 0.8)",
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cardContent: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 4,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  progressSection: {
    gap: 8,
  },
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmedText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#BBF246",
    borderRadius: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    marginTop: -20,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: "#BBF246",
    width: 18,
  },
  adminFab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 99,
  },
});

export default CommunityScreen;
