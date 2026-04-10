import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image as ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dietFormSchema, DietFormInputs } from "./dietFormSchema";
import { useAuth } from "../hooks/useAuth";
import SelectInput from "./SelectInput";
import { uploadImageToSupabase } from "../services/services";
import { api } from "../services/api";

interface DietMeal {
  id_dieta?: string;
  id: string;
  title: string;
  imageUrl: string;
  authorName: string;
  authorAvatar: string;
  description?: string;
  categoria?: string;
  calorias?: number;
  tempo_preparo?: number;
  carboidratos?: number;
  gordura?: number;
  proteina?: number;
}

interface DietFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DietMeal;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  sheetIndex: number;
  setSheetIndex: (idx: number) => void;
  onSuccess?: () => void;
}

const mapDietMealToDietFormInputs = (meal: DietMeal | undefined, user: any): DietFormInputs => {
  return {
    id_dieta: meal?.id_dieta || undefined,
    nome: meal?.title || "",
    descricao: meal?.description || "",
    imageurl: meal?.imageUrl || "",
    categoria: meal?.categoria || "",
    calorias: meal?.calorias || undefined,
    tempo_preparo: meal?.tempo_preparo || undefined,
    carboidratos: meal?.carboidratos || undefined,
    gordura: meal?.gordura || undefined,
    proteina: meal?.proteina || undefined,
    nome_autor: meal?.authorName || user?.name || "",
    avatar_autor_url: meal?.authorAvatar || user?.photo || "",
  };
};

const DietFormSheet: React.FC<DietFormSheetProps> = ({
  isOpen,
  onClose,
  initialData,
  bottomSheetRef,
  sheetIndex,
  setSheetIndex,
  onSuccess,
}) => {
  const { user } = useAuth();
  const snapPoints = useMemo(() => ["90%", "100%"], []);

  const isAddingNewDiet = !initialData;
  const initialFormValues = useMemo(
    () => mapDietMealToDietFormInputs(initialData, user),
    [initialData, user]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DietFormInputs>({
    resolver: zodResolver(dietFormSchema),
    defaultValues: initialFormValues,
  });
  // const selectedCategory = watch('categoria'); // Variável não utilizada removida

  const [imageUri, setImageUri] = useState<string | null>(initialFormValues.imageurl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { label: "Café da manhã", value: "breakfast" },
    { label: "Almoço", value: "lunch" },
    { label: "Janta", value: "dinner" },
  ];

  useEffect(() => {
    reset(initialFormValues);
    setImageUri(initialFormValues.imageurl || null);
  }, [initialData, reset, initialFormValues]);

  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      // Garantir que o sheet abra na posição correta
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [isOpen, bottomSheetRef]); // bottomSheetRef adicionado como dependência

  // Debug do estado isSubmitting
  useEffect(() => {
    console.log("🔄 Estado isSubmitting mudou para:", isSubmitting);
  }, [isSubmitting]);

  const setPickedImage = (uri: string) => {
    setImageUri(uri);
    setValue("imageurl", uri);
  };

  const handleImageSelection = () => {
    Alert.alert(
      "Selecionar Imagem",
      "Escolha a origem da imagem:",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Tirar Foto",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Permissão Necessária",
                "Precisamos da sua permissão para acessar a câmera."
              );
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: "images",
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setPickedImage(uri);
            }
          },
        },
        {
          text: "Selecionar da Galeria",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Permissão Necessária",
                "Precisamos da sua permissão para acessar a galeria de imagens."
              );
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: "images",
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setPickedImage(uri);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onSubmitForm = async (data: DietFormInputs) => {
    console.log("🎯 onSubmitForm chamada, isSubmitting atual:", isSubmitting);

    if (isSubmitting) {
      console.log("⚠️ Prevenindo múltiplos envios");
      return; // Prevenir múltiplos envios
    }

    if (!user || !user.sessionId) {
      Alert.alert("Erro", "Usuário não autenticado. Por favor, faça login novamente.");
      return;
    }

    // Validação adicional dos campos obrigatórios
    if (!data.nome || !data.descricao || !data.imageurl || !data.categoria) {
      Alert.alert(
        "Erro",
        "Por favor, preencha todos os campos obrigatórios: Nome, Descrição, Imagem e Categoria."
      );
      return;
    }

    console.log("✅ Validações passaram, definindo isSubmitting = true");
    setIsSubmitting(true);

    // Fallback para garantir que o estado seja resetado após 15 segundos
    const fallbackTimeout = setTimeout(() => {
      console.warn("⚠️ Timeout de segurança ativado - resetando estado");
      setIsSubmitting(false);
    }, 30000); // Reduzido para 30 segundos

    let imageUrlToUpload = data.imageurl;
    console.log("🖼️ URL da imagem:", imageUrlToUpload);

    // Se a imagem for uma URI local, faça o upload para o Supabase
    if (imageUrlToUpload && imageUrlToUpload.startsWith("file://")) {
      console.log("📤 Fazendo upload da imagem para Supabase...");
      try {
        const publicUrl = await uploadImageToSupabase(imageUrlToUpload, "diet-images");
        if (publicUrl) {
          imageUrlToUpload = publicUrl;
          console.log("✅ Upload da imagem concluído:", publicUrl);
        } else {
          throw new Error("Falha ao obter a URL pública da imagem");
        }
      } catch (uploadError: any) {
        console.error("❌ Erro no upload:", uploadError.message);
        Alert.alert("Erro", `Falha ao fazer upload da imagem: ${uploadError.message}`);
        setIsSubmitting(false);
        clearTimeout(fallbackTimeout);
        return;
      }
    }

    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      imageurl: imageUrlToUpload,
      categoria: data.categoria,
      calorias: data.calorias ?? null,
      tempo_preparo: data.tempo_preparo ?? null,
      gordura: data.gordura ?? null,
      proteina: data.proteina ?? null,
      carboidratos: data.carboidratos ?? null,
    };

    try {
      console.log("=== ENVIANDO DIETA PARA O BACKEND ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      console.log("URL da imagem final:", imageUrlToUpload);
      console.log("Usuário autenticado:", user?.name);
      console.log("Session ID:", user?.sessionId);
      console.log("Base URL da API:", api.defaults.baseURL);
      console.log("Headers padrão:", api.defaults.headers);

      if (initialData?.id_dieta) {
        // Editar dieta existente
        console.log("Editando dieta existente:", initialData.id_dieta);
        const response = await api.put(`/dietas/${initialData.id_dieta}`, payload, {
          headers: {
            Authorization: `Bearer ${user.sessionId}`,
          },
        });
        console.log("✅ Resposta da API (editar):", response.data);
        Alert.alert("Sucesso", "Dieta atualizada com sucesso!");
      } else {
        // Criar nova dieta
        console.log("📝 Criando nova dieta");
        console.log("URL completa:", `${api.defaults.baseURL}/dietas`);
        console.log("Iniciando requisição POST...");

        const response = await api.post("/dietas", payload, {
          headers: {
            Authorization: `Bearer ${user.sessionId}`,
          },
          timeout: 15000, // 15 segundos de timeout
        });
        console.log("✅ Resposta da API (criar):", response.data);
        Alert.alert("Sucesso", "Dieta criada com sucesso!");
      }

      // Chamar callback de sucesso para atualizar a lista
      if (onSuccess) {
        onSuccess();
      }

      onClose();
      reset();
    } catch (error: any) {
      console.error("❌ Erro ao salvar dieta:", error.message);
      let errorMessage = "Ocorreu um erro ao salvar a dieta.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Tempo de conexão esgotado. Verifique sua internet.";
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Erro de rede. Verifique sua conexão.";
      } else if (error.response?.status === 401) {
        errorMessage = "Não autorizado. Faça login novamente.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert("Erro", errorMessage);
    } finally {
      console.log("🔄 Finalizando submit, resetando estado");
      clearTimeout(fallbackTimeout);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      index={sheetIndex}
      onChange={setSheetIndex}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
      enableOverDrag={false}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
      activeOffsetY={[-1, 1]}
      failOffsetX={[-5, 5]}
    >
      <BottomSheetScrollView
        style={styles.sheetContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View style={styles.headerRow}>
          <Text style={styles.sheetTitle}>
            {isAddingNewDiet ? "Nova Dieta" : "Editar Dieta"}
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Informações Básicas</Text>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.nome && styles.inputError]}
                placeholder="Ex: Salada de Frango"
                placeholderTextColor="#94A3B8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}

          <Controller
            control={control}
            name="descricao"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea, errors.descricao && styles.inputError]}
                placeholder="Descreva a dieta..."
                placeholderTextColor="#94A3B8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={3}
              />
            )}
          />
          {errors.descricao && <Text style={styles.errorText}>{errors.descricao.message}</Text>}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Categoria e Preparo</Text>
          <View style={styles.row}>
            <View style={{ flex: 1.5 }}>
              <Controller
                control={control}
                name="categoria"
                render={({ field: { onChange, value } }) => (
                  <SelectInput
                    value={value}
                    onChange={onChange}
                    placeholder="Categoria"
                    options={categoryOptions}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Controller
                control={control}
                name="tempo_preparo"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.tempo_preparo && styles.inputError]}
                    placeholder="Tempo (min)"
                    placeholderTextColor="#94A3B8"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                    value={value?.toString() || ""}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>
          <View style={styles.row}>
            {errors.categoria ? (
              <Text style={[styles.errorText, { flex: 1.5 }]}>{errors.categoria.message}</Text>
            ) : null}
            {errors.tempo_preparo ? (
              <Text style={[styles.errorText, { flex: 1, marginLeft: 12 }]}>
                {errors.tempo_preparo.message}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Valores Nutricionais</Text>
          <View style={styles.calorieContainer}>
            <Text style={styles.calorieLabel}>Calorias (kcal)</Text>
            <Controller
              control={control}
              name="calorias"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.calorieInput, errors.calorias && styles.inputError]}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                  value={value?.toString() || ""}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          {errors.calorias && <Text style={styles.errorText}>{errors.calorias.message}</Text>}

          <View style={styles.macrosGrid}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Prot. (g)</Text>
              <Controller
                control={control}
                name="proteina"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.macroInput, errors.proteina && styles.inputError]}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                    value={value?.toString() || ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.proteina && <Text style={styles.errorText}>{errors.proteina.message}</Text>}
            </View>

            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Carb. (g)</Text>
              <Controller
                control={control}
                name="carboidratos"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.macroInput, errors.carboidratos && styles.inputError]}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                    value={value?.toString() || ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.carboidratos && (
                <Text style={styles.errorText}>{errors.carboidratos.message}</Text>
              )}
            </View>

            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Gord. (g)</Text>
              <Controller
                control={control}
                name="gordura"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.macroInput, errors.gordura && styles.inputError]}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                    value={value?.toString() || ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.gordura && <Text style={styles.errorText}>{errors.gordura.message}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Mídia</Text>
          <View style={styles.imagePickerContainer}>
            {imageUri ? (
              <TouchableOpacity
                onPress={handleImageSelection}
                activeOpacity={0.9}
                style={styles.imageWrapper}
              >
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                <View style={styles.changeImageBadge}>
                  <ImageIcon size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleImageSelection}
                activeOpacity={0.7}
                style={styles.imagePlaceholder}
              >
                <View style={styles.placeholderIconCircle}>
                  <ImageIcon size={32} color="#94A3B8" />
                </View>
                <Text style={styles.imagePlaceholderText}>Adicione uma foto da sua dieta</Text>
              </TouchableOpacity>
            )}
          </View>
          {errors.imageurl && <Text style={styles.errorText}>{errors.imageurl.message}</Text>}
        </View>

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelBtn]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            onPress={handleSubmit(onSubmitForm)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{isSubmitting ? "Salvando..." : "Salvar Dieta"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.extraBottomSpace} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetHandle: {
    backgroundColor: "#E2E8F0",
    width: 36,
    height: 4,
    marginTop: 8,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerRow: {
    marginTop: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  inputError: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  calorieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  calorieInput: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "right",
    minWidth: 80,
    paddingVertical: 8,
  },
  macrosGrid: {
    flexDirection: "row",
    gap: 12 as any,
  },
  macroCol: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  macroInput: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    width: "100%",
    paddingVertical: 4,
  },
  imagePickerContainer: {
    marginTop: 4,
  },
  imageWrapper: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeImageBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 4,
  },
  bottomButtonsContainer: {
    flexDirection: "row",
    gap: 12 as any,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },
  saveBtn: {
    backgroundColor: "#BBF246",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  extraBottomSpace: {
    height: 100,
  },
});

export default DietFormSheet;
