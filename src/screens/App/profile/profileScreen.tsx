import React, { useEffect, useMemo, useState } from "react";
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
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../../contexts/AuthContext";
import Header from "../../../components/Header";
import { Mail, User, CheckCircle, Camera, X, Edit } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import ProfilePFScreen from "./profilePFScreen";
import ProfilePJ from "./ProfilePJScreen";

const CACHED_AVATAR_KEY = "@Profile:cachedAvatar";

const ProfileScreen: React.FC = () => {
  const { user, updateUser } = useAuth(); // Assumindo que o contexto tem uma função updateUser
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<"username" | "email" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const resolvedDocumentType = useMemo(() => {
    const normalizedType = user?.documentType?.toUpperCase();
    if (normalizedType === "CPF" || normalizedType === "CNPJ") {
      return normalizedType;
    }

    if (user?.documentId) {
      const digits = user.documentId.replace(/\D/g, "");
      if (digits.length > 11) {
        return "CNPJ";
      }
      if (digits.length > 0) {
        return "CPF";
      }
    }

    return null;
  }, [user?.documentId, user?.documentType]);

  useEffect(() => {
    if (!editModalVisible || !editField) return;

    const currentValue = editField === "username" ? user?.username || "" : user?.email || "";
    setEditValue(currentValue);
  }, [editModalVisible, editField, user?.username, user?.email]);

  useEffect(() => {
    const ensureAvatarPersistence = async () => {
      try {
        const cachedUri = await AsyncStorage.getItem(CACHED_AVATAR_KEY);

        if (cachedUri) {
          const fileInfo = await FileSystem.getInfoAsync(cachedUri);
          if (fileInfo.exists) {
            setLocalAvatarUri(cachedUri);
            return;
          }
          await AsyncStorage.removeItem(CACHED_AVATAR_KEY);
        }

        if (user?.photo) {
          await downloadAndCacheRemoteAvatar(user.photo);
        } else {
          setLocalAvatarUri(null);
        }
      } catch (error) {
        console.error("Erro ao carregar avatar persistido:", error);
      }
    };

    ensureAvatarPersistence();
  }, [user?.photo]);

  const downloadAndCacheRemoteAvatar = async (remoteUri: string) => {
    try {
      const extension = remoteUri.split(".").pop()?.split("?")[0] || "jpg";
      const destinationUri = `${FileSystem.documentDirectory}movt_avatar_remote.${extension}`;
      const downloadResult = await FileSystem.downloadAsync(remoteUri, destinationUri);

      await AsyncStorage.setItem(CACHED_AVATAR_KEY, downloadResult.uri);
      setLocalAvatarUri(downloadResult.uri);
    } catch (error) {
      console.error("Erro ao baixar avatar remoto:", error);
    }
  };

  const persistLocalAvatar = async (uri: string, remoteUri?: string) => {
    try {
      const extension = uri.split(".").pop()?.split("?")[0] || "jpg";
      const destinationUri = `${FileSystem.documentDirectory}movt_avatar_${Date.now()}.${extension}`;

      await FileSystem.copyAsync({ from: uri, to: destinationUri });
      await AsyncStorage.setItem(CACHED_AVATAR_KEY, destinationUri);
      setLocalAvatarUri(destinationUri);
    } catch (error) {
      console.error("Erro ao salvar avatar localmente:", error);
      if (remoteUri) {
        await downloadAndCacheRemoteAvatar(remoteUri);
      }
    }
  };

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
        await persistLocalAvatar(imageUri, result.data.photo);
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

  const handleEditPress = (field: "username" | "email") => {
    const currentValue = field === "username" ? user?.username || "" : user?.email || "";
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || !editField) {
      Alert.alert("Erro", "O campo não pode estar vazio");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        field: editField,
        value: editValue.trim(),
      };

      const response = await fetch(`http://10.0.2.2:3000/api/user/update-field`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.sessionId || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar dados");
      }

      if (result.success && result.data) {
        updateUser({
          ...user,
          email: result.data.email ?? user?.email,
          username: result.data.username ?? user?.username,
          isVerified:
            typeof result.data.isVerified === "boolean" ? result.data.isVerified : user?.isVerified,
        } as any);

        const fieldLabel = editField === "username" ? "Username" : "Email";
        Alert.alert("Sucesso", `${fieldLabel} atualizado com sucesso!`);
        setEditModalVisible(false);
        setEditField(null);
        setEditValue("");
      }
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", error.message || "Erro ao atualizar dados");
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out handled elsewhere; removed unused handler to satisfy linter

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (resolvedDocumentType === "CNPJ") {
    return <ProfilePJ />;
  }

  if (resolvedDocumentType === "CPF") {
    return <ProfilePFScreen />;
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
            {localAvatarUri || user.photo ? (
              <View style={styles.avatarOverlay}>
                <Image
                  key={localAvatarUri || user?.photo}
                  source={{ uri: localAvatarUri || user?.photo || "" }}
                  style={styles.avatar}
                />
                <View style={styles.cameraIconContainer}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#192126" />
                  ) : (
                    <Camera size={20} color="#BBF246" fill="#192126" />
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
            <TouchableOpacity
              onPress={() => handleEditPress("username")}
              style={styles.editIconButton}
            >
              <Edit size={18} color="#192426" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Mail size={20} color="#192126" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Endereço de E-mail</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEditPress("email")}
              style={styles.editIconButton}
            >
              <Edit size={18} color="#192126" />
            </TouchableOpacity>
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

        {/* Informações Adicionais */}
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>Versão da Aplicação: 1.0.0</Text>
          <Text style={styles.additionalInfoText}>© 2024 MOVT. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>

      {/* Modal de Edição */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editField === "username" ? "Editar nome de usuário" : "Editar endereço de e-mail"}
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              {editField === "username" ? "Nome de usuário" : "Endereço de E-mail"}
            </Text>
            <TextInput
              style={styles.textInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={
                editField === "username" ? "Digite seu novo username" : "Digite seu novo email"
              }
              placeholderTextColor="#999"
              keyboardType={editField === "email" ? "email-address" : "default"}
              editable={!isLoading}
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 16,
    backgroundColor: "#BBF246",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
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
  editIconButton: {
    padding: 8,
    marginLeft: 8,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#192126",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#192126",
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#192126",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#BBF246",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#192126",
  },
});

export default ProfileScreen;
