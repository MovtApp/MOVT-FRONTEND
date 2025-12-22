import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { Grid3X3, Heart, Bookmark, MapPin, FileText, Calendar } from "lucide-react-native";
import { API_BASE_URL } from "../../../config/api";
import BackButton from "../../../components/BackButton";
import { followTrainer, unfollowTrainer } from "../../../services/followService";
import { AppStackParamList } from "../../../@types/routes";

type TrainerRouteProp = RouteProp<
  {
    TrainerProfile: {
      trainer?: {
        id: string;
        name: string;
        username?: string;
        avatarUrl?: string;
        coverUrl?: string;
        isOnline?: boolean;
        location?: string;
        hasCurriculum?: boolean;
      };
    };
  },
  "TrainerProfile"
>;

export function TrainerProfileScreen() {
  const route = useRoute<TrainerRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const trainer = route.params?.trainer;
  const { user } = useAuth();

  const trainerId = trainer?.id || (route.params as any)?.trainerId || null;

  const [isFollowing, setIsFollowing] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "destaques" | "marcados">("posts");
  const [isUploading, setIsUploading] = useState(false);
  const [fetchedTrainer, setFetchedTrainer] = useState<any | null>(null);
  const [postsList, setPostsList] = useState<any[]>([]);

  const mock = {
    id: "1",
    name: "Oliver Augusto",
    username: "Oliver_guto",
    avatarUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_qbpvr6.jpg",
    coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop",
    isOnline: true,
    location: "São Paulo",
    hasCurriculum: true,
  };

  const data = trainer || mock;
  const effectiveCover = coverUri || fetchedTrainer?.coverUrl || data.coverUrl || "";

  useEffect(() => {
    const id = trainerId;
    if (!id) return;

    const load = async () => {
      try {
        const headers: Record<string, string> = {};
        if (user?.sessionId) headers["Authorization"] = `Bearer ${user.sessionId}`;

        // Fetch trainer detail
        const resp = await fetch(`${API_BASE_URL}/trainers/${id}`, { headers });
        if (resp.ok) {
          const json = await resp.json();
          const t = json.data || json;
          setFetchedTrainer(t);
          if (t?.coverUrl || t?.cover_url) setCoverUri(t.coverUrl || t.cover_url);
        }

        // Fetch trainer posts
        const postsResp = await fetch(`${API_BASE_URL}/trainers/${id}/posts?limit=50`, { headers });
        if (postsResp.ok) {
          const pj = await postsResp.json();
          const data = pj.data || [];
          setPostsList(data);
        }
      } catch (err) {
        console.error("Erro fetch trainer:", err);
      }
    };

    load();
  }, [trainerId, user?.sessionId]);

  // postsList is populated from backend; map to image URLs (fallback to string if API returns simple array)
  const posts: any[] =
    postsList && postsList.length ? postsList.map((p: any) => p.imageUrl || p.image_url || p) : [];

  const screenWidth = Dimensions.get("window").width;
  const imageSize = (screenWidth - 48) / 2;

  // Pick cover image (gallery/camera)
  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão negada",
        "É necessário permitir acesso à galeria para escolher uma imagem."
      );
      return;
    }

    Alert.alert("Alterar foto de fundo", "Selecione a origem:", [
      {
        text: "Galeria",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setCoverUri(uri);
            await handleUploadCover(uri);
          }
        },
      },
      {
        text: "Câmera",
        onPress: async () => {
          const camPerm = await ImagePicker.requestCameraPermissionsAsync();
          if (camPerm.status !== "granted") {
            Alert.alert("Permissão negada", "É necessário permitir acesso à câmera.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setCoverUri(uri);
            await handleUploadCover(uri);
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleUploadCover = async (imageUri: string) => {
    if (!imageUri) return;
    setIsUploading(true);
    try {
      if (!trainerId) {
        Alert.alert("Erro", "ID do trainer não disponível para upload");
        return;
      }

      const formData = new FormData();
      const fileName = imageUri.split("/").pop() || "cover.jpg";
      const fileType = fileName.split(".").pop()?.toLowerCase();
      formData.append("cover", {
        uri: imageUri,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        name: fileName,
      } as any);

      const headers: Record<string, string> = {};
      if (user?.sessionId) headers["Authorization"] = `Bearer ${user.sessionId}`;

      const resp = await fetch(`${API_BASE_URL}/trainers/${trainerId}/cover`, {
        method: "PUT",
        body: formData,
        headers,
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || "Erro no upload");
      }

      const json = await resp.json();
      const coverUrl =
        json?.data?.coverUrl || json?.data?.cover_url || json?.coverUrl || json?.cover_url;
      if (coverUrl) setCoverUri(coverUrl);
      Alert.alert("Sucesso", "Foto de fundo atualizada");
    } catch (error: any) {
      console.error("Erro upload cover:", error);
      Alert.alert("Erro", error.message || "Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle follow / unfollow via API
  const toggleFollow = async () => {
    console.log("[toggleFollow] Iniciando com:", {
      trainerId,
      hasSession: !!user?.sessionId,
      isFollowing,
    });

    if (!trainerId) {
      console.error("[toggleFollow] Erro: trainerId não disponível");
      Alert.alert("Erro", "ID do trainer não disponível");
      return;
    }

    if (!user?.sessionId) {
      console.error("[toggleFollow] Erro: sessionId não disponível");
      Alert.alert("Erro", "Sessão não disponível. Por favor, faça login novamente.");
      return;
    }

    try {
      console.log("[toggleFollow] Enviando requisição...");
      if (!isFollowing) {
        console.log("[toggleFollow] Ação: SEGUIR");
        await followTrainer(trainerId, user.sessionId);
        setIsFollowing(true);
        Alert.alert("Sucesso", "Você está seguindo este trainer!");
      } else {
        console.log("[toggleFollow] Ação: DEIXAR DE SEGUIR");
        await unfollowTrainer(trainerId, user.sessionId);
        setIsFollowing(false);
        Alert.alert("Sucesso", "Você deixou de seguir este trainer.");
      }
    } catch (err: any) {
      console.error("[toggleFollow] Erro capturado:", err);
      console.error("[toggleFollow] Mensagem de erro:", err?.message);
      Alert.alert("Erro", err?.message || "Erro ao processar ação. Verifique sua conexão.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Cover: imagem se existir, caso contrário placeholder. Também permite upload ao tocar. */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => pickCover()}>
          {effectiveCover ? (
            <Image source={{ uri: effectiveCover }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>📷</Text>
              <Text style={styles.coverPlaceholderText}>Foto de fundo não implementada</Text>
            </View>
          )}
          {isUploading && (
            <View style={styles.coverUploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.backButtonAbsolute}>
          <BackButton />
        </View>

        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: data.avatarUrl }} style={styles.avatar} />
              {data.isOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={{ marginRight: 12 }}
                onPress={() => {
                  navigation.navigate("Appointments", {
                    trainerId: trainerId || undefined,
                    trainer: {
                      id: data.id,
                      name: data.name,
                    },
                  });
                }}
              >
                <Calendar size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.followButton, isFollowing ? styles.following : null]}
                onPress={() => toggleFollow()}
              >
                <Text style={[styles.followText, isFollowing ? styles.followTextFollowing : null]}>
                  {isFollowing ? "Seguindo" : "Seguir"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.username}>@{data.username}</Text>

          <View style={styles.infoRow}>
            {data.isOnline && (
              <View style={styles.infoItem}>
                <View style={styles.statusDot} />
                <Text style={styles.infoText}>Disponível agora</Text>
              </View>
            )}

            <View style={styles.infoItem}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.infoText}>{data.location}</Text>
            </View>

            {data.hasCurriculum && (
              <View style={styles.infoItem}>
                <FileText size={14} color="#6B7280" />
                <Text style={styles.infoText}>Currículo</Text>
              </View>
            )}
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("posts")}>
              <Grid3X3 size={22} color={activeTab === "posts" ? "#10B981" : "#6B7280"} />
              <Text style={[styles.tabLabel, activeTab === "posts" ? styles.tabLabelActive : null]}>
                Posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("destaques")}>
              <Heart size={22} color={activeTab === "destaques" ? "#10B981" : "#6B7280"} />
              <Text
                style={[styles.tabLabel, activeTab === "destaques" ? styles.tabLabelActive : null]}
              >
                Destaques
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("marcados")}>
              <Bookmark size={22} color={activeTab === "marcados" ? "#10B981" : "#6B7280"} />
              <Text
                style={[styles.tabLabel, activeTab === "marcados" ? styles.tabLabelActive : null]}
              >
                Marcados
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          {activeTab === "posts" && (
            <View style={styles.gridContainer}>
              <FlatList
                data={posts}
                keyExtractor={(item: any, idx: number) => {
                  if (typeof item === "string") return item + idx;
                  return (
                    (item.id && String(item.id)) || `${item.imageUrl || item.image_url || idx}`
                  );
                }}
                numColumns={2}
                scrollEnabled={false}
                renderItem={({ item }: { item: any }) => {
                  const uri =
                    typeof item === "string" ? item : item.imageUrl || item.image_url || item;
                  return (
                    <Image
                      source={{ uri }}
                      style={[styles.postImage, { width: imageSize, height: imageSize }]}
                    />
                  );
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#14161A", position: "relative" },
  backButtonAbsolute: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 20,
  },
  backButtonContainer: {
    position: "absolute",
    top: 12,
    left: 20,
    zIndex: 10,
  },
  cover: { width: "100%", height: 180 },
  coverPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  coverPlaceholderText: {
    color: "#6b7280",
    fontSize: 12,
  },
  coverUploadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheet: {
    marginTop: -40,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    minHeight: 400,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatarWrap: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "#fff" },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
    right: -4,
    bottom: 8,
  },
  followButton: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  following: { backgroundColor: "#E6E6E6", borderWidth: 1, borderColor: "#D1D5DB" },
  followText: { color: "#fff", fontWeight: "700" },
  followTextFollowing: { color: "#111827" },
  name: { fontSize: 22, fontWeight: "700", marginTop: 12, color: "#111827" },
  username: { color: "#6B7280", marginTop: 4 },
  infoRow: { flexDirection: "row", marginTop: 12, alignItems: "center", flexWrap: "wrap" },
  infoItem: { flexDirection: "row", alignItems: "center", marginRight: 16, marginTop: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981", marginRight: 8 },
  infoText: { color: "#6B7280", marginLeft: 6 },
  tabsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 18 },
  tab: { alignItems: "center", flex: 1 },
  tabLabel: { marginTop: 6, color: "#6B7280" },
  tabLabelActive: { color: "#111827", fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#E6E6E6", marginTop: 12 },
  gridContainer: { marginTop: 12 },
  postImage: { borderRadius: 12, margin: 6, backgroundColor: "#ccc" },
});
