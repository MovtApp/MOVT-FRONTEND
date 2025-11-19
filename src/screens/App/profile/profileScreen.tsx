import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../../contexts/AuthContext";
import Header from "../../../components/Header";
import { Mail, User, CheckCircle, LogOut, Edit2, Camera } from "lucide-react-native";
// Importação do expo-image-picker (precisará ser instalado)
import * as ImagePicker from "expo-image-picker";

const ProfileScreen: React.FC = () => {
  const { user, signOut, updateUser } = useAuth(); // Assumindo que o contexto tem uma função updateUser
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Função para solicitar permissões e selecionar imagem
  const pickImage = async () => {
    // Solicita permissão para acessar a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão negada",
        "É necessário permitir o acesso à galeria para selecionar uma imagem."
      );
      return;
    }

    // Permite ao usuário escolher entre câmera ou galeria
    const options = ["Selecionar da Galeria", "Tirar Foto", "Cancelar"];

    Alert.alert("Alterar Foto de Perfil", "Como deseja adicionar sua foto?", [
      {
        text: options[0],
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Proporção quadrada para avatar
            quality: 0.8,
            base64: false, // Não usar base64 para evitar payloads grandes
          });

          if (!result.canceled) {
            handleUploadImage(result.assets[0].uri);
          }
        },
      },
      {
        text: options[1],
        onPress: async () => {
          // Solicita permissão para usar a câmera
          const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
          if (cameraPermission.status !== "granted") {
            Alert.alert(
              "Permissão negada",
              "É necessário permitir o acesso à câmera para tirar uma foto."
            );
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Proporção quadrada para avatar
            quality: 0.8,
            base64: false, // Não usar base64 para evitar payloads grandes
          });

          if (!result.canceled) {
            handleUploadImage(result.assets[0].uri);
          }
        },
      },
      {
        text: options[2],
        style: "cancel",
      },
    ]);
  };

  // Função para fazer o upload da imagem para o backend
  const handleUploadImage = async (imageUri: string) => {
    if (!imageUri) return;

    setIsUploading(true);

    try {
      // Criar FormData para enviar a imagem
      const formData = new FormData();

      // Extrair nome do arquivo da URI
      const fileName = imageUri.split("/").pop() || "avatar.jpg";
      const fileType = fileName.split(".").pop()?.toLowerCase();

      // Adiciona a imagem ao FormData
      formData.append("avatar", {
        uri: imageUri,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        name: fileName,
      } as unknown as Blob);

      // Faz a requisição para o backend
      const response = await fetch(`http://10.0.2.2:3000/api/user/avatar`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro ao fazer o upload da imagem");
      }

      // Atualiza o contexto de autenticação com o novo avatar
      if (result.success && result.data) {
        // Atualiza o usuário localmente no contexto
        updateUser({ ...user, photo: result.data.photo });
        Alert.alert("Sucesso", "Foto de perfil atualizada com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload da imagem:", error);
      Alert.alert("Erro", error.message || "Ocorreu um erro ao fazer o upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  // Função auxiliar para obter o token de autenticação
  const getAuthToken = async (): Promise<string> => {
    // O token está armazenado como sessionId no contexto de autenticação
    try {
      return user?.sessionId || "";
    } catch {
      return "";
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da aplicação?", [
      {
        text: "Cancelar",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Sair",
        onPress: async () => {
          setIsLoading(true);
          try {
            await signOut();
          } catch {
            Alert.alert("Erro", "Erro ao tentar sair");
            setIsLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de Avatar e Dados Principais */}
        <View style={styles.profileHeaderCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={isUploading}
          >
            {user.photo ? (
              <View style={styles.avatarOverlay}>
                <Image source={{ uri: user.photo }} style={styles.avatar} />
                <View style={styles.cameraIconContainer}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera size={20} color="#fff" />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color="#BBF246" />
                <View style={styles.cameraIconContainer}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera size={20} color="#fff" />
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userUsername}>@{user.username}</Text>

        </View>

        {/* Seção de Informações do Usuário */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <User size={20} color="#192126" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nome Completo</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <User size={20} color="#192126" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nome de Usuário</Text>
              <Text style={styles.infoValue}>@{user.username}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Mail size={20} color="#192126" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <CheckCircle size={20} color={user.isVerified ? "#192126" : "#BBF246"} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status de Verificação</Text>
              <Text style={[styles.infoValue, { color: user.isVerified ? "#22C55E" : "#EF4444" }]}>
                {user.isVerified ? "Verificado" : "Não Verificado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Seção de ID do Usuário */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Identificação</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <User size={20} color="#192126" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID do Usuário</Text>
              <Text style={styles.infoValue}>{user.id}</Text>
            </View>
          </View>
        </View>

        {/* Seção de Ações */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editButton}>
            <Edit2 size={18} color="#fff" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signOutButton, isLoading && styles.signOutButtonDisabled]}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <LogOut size={18} color="#fff" />
                <Text style={styles.signOutButtonText}>Sair da Aplicação</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Informações Adicionais */}
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>Versão da Aplicação: 1.0.0</Text>
          <Text style={styles.additionalInfoText}>© 2024 MOVT. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },

  // Profile Header Section
  profileHeaderCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#BBF246",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#192126",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#BBF246",
  },
  avatarOverlay: {
    position: "relative",
    width: 96,
    height: 96,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1E232C",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#192126",
  },
  userUsername: {
    fontSize: 14,
    color: "#666",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: "#BBF246",
    fontWeight: "600",
  },

  // Info Section
  infoSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#BBF246",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#BBF246",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#192126",
    fontWeight: "500",
  },

  // Action Section
  actionSection: {
    marginBottom: 24,
    gap: 10,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#8A2BE2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },

  // Additional Info
  additionalInfo: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  additionalInfoText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});

export default ProfileScreen;
