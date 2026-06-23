import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus, Camera } from "lucide-react-native";
import BackButton from "@components/BackButton";
import { useAuth } from "@contexts/AuthContext";
import { userService } from "@services/userService";
import { RootStackParamList } from "@typings/routes";

const ProfileMediaScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [photo, setPhoto] = useState<string | null>(
    user?.photo || (user as any)?.avatar_url || null
  );
  const [banner, setBanner] = useState<string | null>(user?.banner || null);
  const [uploading, setUploading] = useState<"photo" | "banner" | null>(null);

  // Abre câmera/galeria para um alvo (foto de perfil ou capa) e sobe a imagem
  // reutilizando os endpoints já existentes (avatar-base64 / banner-base64).
  const pickAndUpload = (target: "photo" | "banner") => {
    const aspect: [number, number] = target === "photo" ? [1, 1] : [16, 9];
    const label = target === "photo" ? "foto de perfil" : "capa";

    Alert.alert(`Escolher ${label}`, `Como deseja adicionar sua ${label}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tirar foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect,
            quality: 0.8,
          });
          if (!result.canceled) await upload(target, result.assets[0].uri);
        },
      },
      {
        text: "Galeria",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect,
            quality: 0.8,
          });
          if (!result.canceled) await upload(target, result.assets[0].uri);
        },
      },
    ]);
  };

  const upload = async (target: "photo" | "banner", imageUri: string) => {
    setUploading(target);
    try {
      if (target === "photo") {
        const res = await userService.updateAvatar(imageUri);
        const newPhoto =
          res.data?.avatar_url || res.data?.photo || res.avatar_url || res.photo || imageUri;
        updateUser({ photo: newPhoto });
        setPhoto(newPhoto);
      } else {
        const res = await userService.updateBanner(imageUri);
        const newBanner =
          res.data?.banner_url || res.data?.banner || res.banner_url || res.banner || imageUri;
        updateUser({ banner: newBanner });
        setBanner(newBanner);
      }
    } catch (err) {
      console.error(`Erro ao enviar ${target}:`, err);
      Alert.alert("Erro", "Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploading(null);
    }
  };

  const canAdvance = !!photo && !!banner && !uploading;

  const handleAdvance = () => {
    if (!canAdvance) {
      Alert.alert("Quase lá", "Adicione sua foto de perfil e a capa para continuar.");
      return;
    }
    navigation.navigate("Info", { screen: "ProfileDetailsScreen" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <BackButton autoTopInset />
        <Text style={styles.title}>Seu perfil</Text>
        <Text style={styles.question}>Adicione uma foto e uma capa</Text>
        <Text style={styles.instruction}>
          Capriche: é assim que outras pessoas vão te reconhecer no MOVT.
        </Text>

        {/* Capa */}
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={() => pickAndUpload("banner")}
          disabled={uploading === "banner"}
          activeOpacity={0.85}
        >
          {banner ? (
            <Image source={{ uri: banner }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <ImagePlus size={28} color="#94A3B8" />
              <Text style={styles.bannerPlaceholderText}>Adicionar capa</Text>
            </View>
          )}
          {uploading === "banner" && (
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Foto de perfil (sobreposta à capa) */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => pickAndUpload("photo")}
            disabled={uploading === "photo"}
            activeOpacity={0.85}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={26} color="#94A3B8" />
              </View>
            )}
            {uploading === "photo" && (
              <View style={[styles.overlay, styles.avatarOverlay]}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque para alterar a foto de perfil</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.advanceButton,
          !canAdvance && styles.advanceButtonDisabled,
          { marginBottom: Platform.OS === "android" ? insets.bottom + 16 : 50 },
        ]}
        onPress={handleAdvance}
        disabled={!canAdvance}
      >
        <Text style={styles.advanceButtonText}>Avançar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 32,
    marginTop: 30,
    marginBottom: 4,
    color: "#111",
  },
  question: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    marginTop: 10,
    color: "#111",
    marginBottom: 8,
  },
  instruction: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  bannerContainer: {
    marginTop: 24,
    height: 150,
    borderRadius: 16,
    backgroundColor: "#F5F6F9",
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bannerPlaceholderText: {
    color: "#94A3B8",
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -45, // sobrepõe a capa
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#F5F6F9",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    marginTop: 10,
    color: "#94A3B8",
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  avatarOverlay: {
    borderRadius: 48,
  },
  advanceButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  advanceButtonDisabled: {
    opacity: 0.5,
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});

export default ProfileMediaScreen;
