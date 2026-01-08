import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@contexts/AuthContext";
import { Heart, Grid3X3, Bookmark, MapPin, Briefcase } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { userService } from "@services/userService";
import BackButton from "@components/BackButton";

const { width } = Dimensions.get("window");

const ProfilePFScreen = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Posts");
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Mock de fotos para o grid seguindo a estética da imagem
  const posts = [
    "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_2_kgtuno.jpg",
    "https://img.freepik.com/free-photo/view-woman-helping-man-exercise-gym_52683-98092.jpg",
    "https://img.freepik.com/free-photo/medium-shot-people-helping-each-other-gym_23-2149591024.jpg",
    "https://img.freepik.com/free-photo/man-helping-woman-with-her-workout-gym_23-2149591022.jpg",
    "https://img.freepik.com/free-photo/man-working-out-gym_23-2149591020.jpg",
    "https://img.freepik.com/free-photo/woman-working-out-gym_23-2149591018.jpg",
  ];

  const handlePickImage = async (type: "avatar" | "banner") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoadingUpdate(true);
        const imageUri = result.assets[0].uri;

        if (type === "avatar") {
          const response = await userService.updateAvatar(imageUri);
          if (response.success) {
            updateUser({ photo: response.data.photo });
            Alert.alert("Sucesso", "Foto de perfil atualizada!");
          }
        } else {
          const response = await userService.updateBanner(imageUri);
          if (response.success) {
            updateUser({ banner: response.data.banner });
            Alert.alert("Sucesso", "Banner atualizado!");
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao atualizar imagem:", error);
      Alert.alert("Erro", "Não foi possível atualizar a imagem.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.backButtonContainer}>
        <BackButton />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Banner de Topo */}
        <View style={styles.bannerContainer}>
          <Image
            source={
              user?.banner
                ? { uri: user.banner }
                : {
                    uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1767896239/Captura_de_tela_2026-01-08_151542_r3acpt.png",
                  }
            }
            style={styles.banner}
          />
          <TouchableOpacity
            onPress={() => handlePickImage("banner")}
            disabled={loadingUpdate}
          ></TouchableOpacity>
        </View>

        {/* Informações do Perfil */}
        <View style={styles.contentWrap}>
          {/* Foto de Perfil + Botão Editar */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  user?.photo
                    ? { uri: user.photo }
                    : {
                        uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1767896239/Captura_de_tela_2026-01-08_151542_r3acpt.png",
                      }
                }
                style={styles.avatar}
              />
              <TouchableOpacity
                onPress={() => handlePickImage("avatar")}
                disabled={loadingUpdate}
              ></TouchableOpacity>
            </View>
          </View>

          {/* Nome e Username */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>{user?.name || "Oliver Augusto"}</Text>
            <Text style={styles.usernameText}>@{user?.username || "Oliver_guto"}</Text>
          </View>

          {/* Linha de Status e Info */}
          <View style={styles.statsRow}>
            <View style={styles.statusItem}>
              <View style={styles.statusDot} />
              <Text style={styles.statusLabel}>Disponível agora</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <MapPin color="#6366F1" size={14} />
              </View>
              <Text style={styles.infoLabel}>São Paulo</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Briefcase color="#6366F1" size={14} />
              </View>
              <Text style={styles.infoLabel}>Currículo</Text>
            </View>
          </View>

          {/* Abas / Categorias */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Posts")}>
              <Grid3X3 color={activeTab === "Posts" ? "#000" : "#94A3B8"} size={22} />
              <Text style={[styles.tabText, activeTab === "Posts" && styles.tabTextActive]}>
                Posts
              </Text>
              {activeTab === "Posts" && <View style={styles.activeLine} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Destaques")}>
              <Heart color={activeTab === "Destaques" ? "#000" : "#94A3B8"} size={22} />
              <Text style={[styles.tabText, activeTab === "Destaques" && styles.tabTextActive]}>
                Destaques
              </Text>
              {activeTab === "Destaques" && <View style={styles.activeLine} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Marcados")}>
              <Bookmark color={activeTab === "Marcados" ? "#000" : "#94A3B8"} size={22} />
              <Text style={[styles.tabText, activeTab === "Marcados" && styles.tabTextActive]}>
                Marcados
              </Text>
              {activeTab === "Marcados" && <View style={styles.activeLine} />}
            </TouchableOpacity>
          </View>

          {/* Grid de Fotos */}
          <View style={styles.grid}>
            {posts.map((url, index) => (
              <View key={index} style={styles.gridItem}>
                <Image source={{ uri: url }} style={styles.gridImage} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {loadingUpdate && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#CBFB5E" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContainer: {
    width: "100%",
    height: 220,
  },
  banner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentWrap: {
    paddingHorizontal: 24,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: -55, // Overlap exato da foto com o banner
    marginBottom: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  settingsButton: {
    backgroundColor: "#F1F5F9",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  nameSection: {
    marginTop: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  usernameText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0F172A",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    backgroundColor: "#EEF2FF", // Fundo azul claro/roxo dos ícones
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0F172A",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 35,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 15,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  tabText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#000",
  },
  activeLine: {
    position: "absolute",
    bottom: -16,
    width: "40%",
    height: 3,
    backgroundColor: "#CBFB5E",
    borderRadius: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
    paddingBottom: 40,
  },
  gridItem: {
    width: (width - 64) / 2, // Ajustado para contemplar o paddingHorizontal 24 (24*2 + gap 16)
    height: 200,
    marginBottom: 16,
    borderRadius: 25, // Bordas bem arredondadas conforme a imagem
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editProfileButton: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  editProfileText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalScrollContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  editModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  saveButton: {
    backgroundColor: "#CBFB5E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
});

export default ProfilePFScreen;
