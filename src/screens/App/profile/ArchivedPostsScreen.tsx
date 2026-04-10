import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Archive, PackageOpen } from "lucide-react-native";
import { userService } from "@services/userService";
import { FooterVersion } from "@components/FooterVersion";
import BackButton from "@components/BackButton";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 3) / 3;

const ArchivedPostsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const fetchArchivedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getArchivedPosts();
      if (res.success) {
        setPosts(res.data);
      }
    } catch (error) {
      console.error("Erro ao buscar posts arquivados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedPosts();
  }, [fetchArchivedPosts]);

  const handleUnarchive = (post: any) => {
    Alert.alert(
      "Desarquivar publicação",
      "Deseja tornar esta publicação visível novamente no seu perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desarquivar",
          onPress: async () => {
            setUnarchivingId(String(post.id));
            try {
              const res = await userService.unarchivePost(String(post.id));
              if (res.success) {
                setPosts((prev) => prev.filter((p) => p.id !== post.id));
              } else {
                Alert.alert("Erro", res.message || "Não foi possível desarquivar.");
              }
            } catch {
              Alert.alert("Erro", "Ocorreu um problema ao desarquivar.");
            } finally {
              setUnarchivingId(null);
            }
          },
        },
      ]
    );
  };

  const topPadding = Platform.OS === "ios"
    ? Math.max(insets.top, 10)
    : insets.top > 0 ? insets.top + 20 : 40;

  const renderPost = ({ item }: { item: any }) => {
    const isUnarchiving = unarchivingId === String(item.id);
    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => handleUnarchive(item)}
      >
        <Image
          source={{ uri: item.image_url || item.url }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        <View style={styles.archiveBadge}>
          {isUnarchiving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Archive size={14} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Arquivados</Text>
        <View style={{ width: 46 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#BBF246" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centered}>
          <PackageOpen size={56} color="#CBD5E1" strokeWidth={1.2} />
          <Text style={styles.emptyTitle}>Nenhuma publicação arquivada</Text>
          <Text style={styles.emptySubtitle}>
            Posts que você arquivar aparecerão aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPost}
          numColumns={3}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.hint}>
              Toque em um post para desarquivá-lo
            </Text>
          }
          ListFooterComponent={
            <FooterVersion style={styles.footer} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    gap: 1.5,
    marginBottom: 1.5,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  archiveBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    padding: 4,
  },
  footer: {
    alignItems: "flex-start",
    marginTop: 40,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
});

export default ArchivedPostsScreen;
