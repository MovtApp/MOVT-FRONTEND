import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Image as ImageIcon, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postFormSchema, PostFormInputs } from "./postFormSchema";
import { useAuth } from "../hooks/useAuth";
import { uploadImageToSupabase } from "../services/services";
import { api } from "../services/api";
import { userService } from "../services/userService";

interface PostItem {
  id?: string;
  url?: string;
  legenda?: string;
}

interface PostFormSheetProps {
  onClose: () => void;
  initialData?: PostItem;
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onSuccess?: () => void;
}

const PostFormSheet: React.FC<PostFormSheetProps> = ({
  onClose,
  initialData,
  bottomSheetRef,
  onSuccess,
}) => {
  const { user } = useAuth();
  const snapPoints = useMemo(() => ["70%", "95%"], []);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PostFormInputs>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      legenda: initialData?.legenda || "",
      imageurl: initialData?.url || "",
    },
  });

  const [imageUri, setImageUri] = useState<string | null>(initialData?.url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza o formulário com o post alvo. O parent define selectedPost (ou
  // null para novo post) ANTES de chamar present(), então quando initialData
  // muda preenchemos/limpamos os campos. A abertura é 100% imperativa via
  // bottomSheetRef.present() — o sheet nasce fechado (não auto-abre no mount).
  useEffect(() => {
    reset({
      legenda: initialData?.legenda || "",
      imageurl: initialData?.url || "",
    });
    setImageUri(initialData?.url || null);
  }, [initialData, reset]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleImageSelection = () => {
    if (initialData?.id) return; // Impede seleção se estiver editando

    Alert.alert("Selecionar Imagem", "Escolha a origem da imagem:", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tirar Foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão Necessária", "Precisamos de permissão para a câmera.");
            return;
          }
          let result = await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            setValue("imageurl", uri);
          }
        },
      },
      {
        text: "Galeria",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permissão Necessária", "Precisamos de permissão para a galeria.");
            return;
          }
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            setValue("imageurl", uri);
          }
        },
      },
    ]);
  };

  const onSubmitForm = async (data: PostFormInputs) => {
    if (isSubmitting) return;

    if (!user || !user.sessionId) {
      Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = data.imageurl;

    try {
      if (finalImageUrl.startsWith("file://")) {
        const publicUrl = await uploadImageToSupabase(finalImageUrl, "diet-images");
        if (publicUrl) {
          finalImageUrl = publicUrl;
        } else {
          throw new Error("Falha no upload da imagem.");
        }
      }

      const sessionId = user.sessionId;

      if (initialData?.id) {
        // Modo Edição
        const response = await userService.updatePost(initialData.id, data.legenda);
        if (response.success) {
          Alert.alert("Sucesso", "Legenda atualizada!");
          if (onSuccess) onSuccess();
          bottomSheetRef.current?.dismiss();
          reset();
        } else {
          throw new Error(response.message || "Erro ao atualizar");
        }
      } else {
        // Modo Criação
        const postPayload = {
          legenda: data.legenda,
          url: finalImageUrl,
          tipo: "POST",
        };

        const response = await api.post("/user/posts", postPayload, {
          headers: { Authorization: `Bearer ${sessionId}` },
        });

        // Handle common success patterns (data.success or status 200/201)
        if (response.status === 200 || response.status === 201 || response.data?.success) {
          Alert.alert("Sucesso", "Publicação enviada!");
          if (onSuccess) onSuccess();
          bottomSheetRef.current?.dismiss();
          reset();
        } else {
          throw new Error(response.data?.message || "Erro desconhecido");
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar post:", error);
      Alert.alert("Erro", error.message || "Não foi possível enviar sua publicação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInternalClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.sheetTitle}>
            {initialData?.id ? "Editar publicação" : "Nova publicação"}
          </Text>
          <TouchableOpacity onPress={handleInternalClose} style={styles.closeBtn}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Imagem:</Text>
        <TouchableOpacity
          style={[styles.imagePicker, initialData?.id && styles.imagePickerDisabled]}
          onPress={handleImageSelection}
          activeOpacity={initialData?.id ? 1 : 0.7}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <ImageIcon size={48} color="#CBD5E1" />
              <Text style={styles.placeholderText}>Toque para selecionar uma foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.imageurl && <Text style={styles.errorText}>{errors.imageurl.message}</Text>}

        <Text style={styles.label}>Legenda:</Text>
        <Controller
          control={control}
          name="legenda"
          render={({ field: { onChange, onBlur, value } }) => (
            <BottomSheetTextInput
              style={styles.textArea}
              placeholder="Escreva algo sobre este momento..."
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
            />
          )}
        />
        {errors.legenda && <Text style={styles.errorText}>{errors.legenda.message}</Text>}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmitForm)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>Publicar Agora</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetHandle: {
    backgroundColor: "#E2E8F0",
    width: 40,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    marginTop: 16,
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#94A3B8",
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePickerDisabled: {
    borderStyle: "solid",
    opacity: 0.8,
  },
  placeholder: {
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
    minHeight: 120,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
  },
  submitBtn: {
    backgroundColor: "#CBFB5E",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#CBFB5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "#E2E8F0",
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
});

export default PostFormSheet;
