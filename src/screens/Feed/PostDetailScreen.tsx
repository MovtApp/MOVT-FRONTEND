import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StatusBar,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import PostCard from "./PostCard";
import { COLORS } from "../../styles/colors";
import BackButton from "../../components/BackButton";

const PostDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params as { postId: string | number };
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/posts/${postId}`);
      if (response.data && response.data.success) {
        setPost(response.data.post);
      } else {
        setError("Não foi possível carregar este post.");
      }
    } catch (err) {
      console.error("Erro ao buscar post:", err);
      setError("Erro de conexão ao carregar o post.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPost();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary_green || "#BBF246"} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Platform.OS === "android"
                  ? insets.top > 0
                    ? insets.top + 20
                    : 40
                  : Math.max(insets.top, 10),
            },
          ]}
        >
          <BackButton style={styles.backBtn} />
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 46 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || "Post não encontrado"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPost}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "android"
                ? insets.top > 0
                  ? insets.top + 20
                  : 40
                : Math.max(insets.top, 10),
          },
        ]}
      >
        <BackButton style={styles.backBtn} />
        <Text style={styles.headerTitle}>Publicação</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary_green}
          />
        }
      >
        <PostCard post={post} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center", // Alinhamento centralizado verticalmente
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#BBF246",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default PostDetailScreen;
