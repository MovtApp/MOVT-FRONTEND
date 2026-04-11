import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@contexts/AuthContext";
import { userService } from "@services/userService";
import * as ImagePicker from "expo-image-picker";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";
import { ChevronRight } from "lucide-react-native";

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user: authUser, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    nome: authUser?.name || "",
    username: authUser?.username || "",
    pronomes: "Pronomes",
    bio: (authUser as any)?.bio || "",
    photo:
      authUser?.photo ||
      (authUser as any)?.avatar_url ||
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
    banner:
      (authUser as any)?.banner_url ||
      authUser?.banner ||
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809",
    genero: "Masculino",
  });

  const [loadingUpdate, setLoadingUpdate] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const id = authUser?.id_us || authUser?.id;
        if (!id) return;
        const res = await userService.getUserProfile(String(id));
        if (res.success) {
          const fetchedUser = res.data;
          setProfileData((prev) => ({
            ...prev,
            nome: fetchedUser.nome || fetchedUser.name || prev.nome,
            username: fetchedUser.username || prev.username,
            bio: fetchedUser.bio || prev.bio,
            photo: fetchedUser.photo || fetchedUser.avatar_url || prev.photo,
            banner: fetchedUser.banner_url || fetchedUser.banner || prev.banner,
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      }
    };
    if (authUser) {
      fetchProfileData();
    }
  }, [authUser]);

  const topPadding =
    Platform.OS === "ios" ? Math.max(insets.top, 10) : insets.top > 0 ? insets.top + 20 : 40;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoadingUpdate(true);
        const imageUri = result.assets[0].uri;
        const response = await userService.updateAvatar(imageUri);
        if (response.success || response.avatar_url || response.photo) {
          const newPhoto =
            response.data?.avatar_url ||
            response.data?.photo ||
            response.avatar_url ||
            response.photo ||
            imageUri;
          updateUser({ photo: newPhoto });
          setProfileData((prev) => ({ ...prev, photo: newPhoto }));
        }
      }
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível atualizar a imagem.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handlePickBanner = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoadingUpdate(true);
        const imageUri = result.assets[0].uri;
        const response = await userService.updateBanner(imageUri);

        if (response.success || response.banner || response.banner_url) {
          const newBanner =
            response.data?.banner_url ||
            response.data?.banner ||
            response.banner_url ||
            response.banner ||
            imageUri;
          updateUser({ banner: newBanner });
          setProfileData((prev) => ({ ...prev, banner: newBanner }));
        }
      }
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível atualizar o banner.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const updateField = async (field: string, value: string) => {
    try {
      await userService.updateField(field, value);
      updateUser({ [field]: value });
    } catch (err) {
      console.error(`Erro ao atualizar ${field}:`, err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Section */}
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={handlePickBanner}
          disabled={loadingUpdate}
        >
          <Image source={{ uri: profileData.banner }} style={styles.bannerImage} />
        </TouchableOpacity>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: profileData.photo }} style={styles.avatar} />
          </View>
          <TouchableOpacity onPress={handlePickImage} disabled={loadingUpdate}>
            <Text style={styles.editAvatarText}>
              {loadingUpdate ? "Atualizando..." : "Editar foto"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <View style={styles.inputList}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.nome}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, nome: text }))}
              onBlur={() => updateField("nome", profileData.nome)}
              placeholder="Seu nome"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Nome de usuário</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.username}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, username: text }))}
              onBlur={() => updateField("username", profileData.username)}
              placeholder="Seu nome de usuário"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, { height: 60, textAlignVertical: "top", paddingTop: 16 }]}
              value={profileData.bio}
              onChangeText={(text) => setProfileData((prev) => ({ ...prev, bio: text }))}
              onBlur={() => updateField("bio", profileData.bio)}
              multiline
              placeholder="Sua bio"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.inputLabel}>Links</Text>
            <Text style={[styles.linkValue, { color: "#94A3B8" }]}>Adicionar links</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={handlePickBanner}
            disabled={loadingUpdate}
          >
            <Text style={styles.inputLabel}>Banners</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.linkValue, { color: "#94A3B8" }]}>Editar banner</Text>
              <ChevronRight size={18} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.inputLabel}>Gênero</Text>
            <View style={styles.rowRight}>
              <Text style={styles.linkValue}>{profileData.genero}</Text>
              <ChevronRight size={18} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        </View>

        <FooterVersion />
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#E2E8F0",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -40, // Sobrepõe o banner
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
  inputList: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    minHeight: 56,
  },
  inputLabel: {
    width: 120,
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    height: 56,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    height: 56,
  },
  rowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  linkValue: {
    fontSize: 15,
    color: "#1E293B",
  },
  actionLinksContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionLinkBtn: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  actionLinkText: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "500",
  },
});

export default EditProfileScreen;
