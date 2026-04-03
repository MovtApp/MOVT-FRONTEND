import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ScrollView as NativeScrollView } from "react-native-gesture-handler";
import {
  Plus,
  Search,
  Trash2,
  X,
  ArrowLeft,
  Users,
  Calendar,
  Edit2,
  Upload,
  Layers,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { api } from "../../../../../services/api";

export interface Community {
  id_comunidade: number;
  nome: string;
  descricao: string;
  imageurl: string | null;
  participantes: number;
  max_participantes: number;
  categoria: string;
  tipo_comunidade: string;
  duracao: string;
  calorias: string;
  data_evento: string;
  faixa_etaria: string;
  premiacao: string;
  local_inicio: string;
  local_fim: string;
  telefone_contato: string;
}

interface CommunityManagementSheetProps {
  onClose?: () => void;
}

export interface CommunityManagementSheetRef {
  open: () => void;
  close: () => void;
}

type ViewMode = "list" | "form";

const INITIAL_CATEGORIES = ["Corrida", "Funcional", "Yoga", "Ciclismo", "Outros"];

const CommunityManagementSheet = forwardRef<
  CommunityManagementSheetRef,
  CommunityManagementSheetProps
>((props, ref) => {
  const { onClose } = props;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [mode, setMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Form States
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    imageurl: "",
    max_participantes: "",
    categoria: "Corrida",
    tipo_comunidade: "Presencial",
    duracao: "",
    calorias: "",
    data_evento: "",
    faixa_etaria: "Livre",
    premiacao: "",
    local_inicio: "",
    local_fim: "",
    telefone_contato: "",
  });
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [isNewCategoryModalVisible, setIsNewCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/comunidades");
      const list = response.data.data || response.data;
      setCommunities(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Erro ao buscar comunidades:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/comunidade-categorias");
      if (response.data.success) {
        const apiCats = response.data.data;
        // Garantir que "Outros" esteja sempre no final
        const listWithoutOthers = apiCats.filter((c: string) => c !== "Outros");
        setCategories([...listWithoutOthers, "Outros"]);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
    fetchCategories();
  }, [fetchCommunities, fetchCategories]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Selecionar...";
    try {
      const date = new Date(dateStr);
      // Se a data for inválida (ex: string formatada antiga), tenta retornar o que já existe
      if (isNaN(date.getTime())) return dateStr;

      return (
        date.toLocaleDateString("pt-BR") +
        " às " +
        date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return dateStr;
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsCreatingCategory(true);
      const response = await api.post("/admin/comunidade-categorias", {
        nome: newCategoryName.trim(),
      });

      if (response.data.success) {
        const newCat = response.data.data;
        setCategories((prev) => {
          const listWithoutNewAndOthers = prev.filter((c) => c !== newCat && c !== "Outros");
          return [...listWithoutNewAndOthers, newCat, "Outros"];
        });
        setFormData((p) => ({ ...p, categoria: newCat }));
        setIsNewCategoryModalVisible(false);
        setNewCategoryName("");
      }
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível criar a categoria.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.descricao) {
      Alert.alert("Erro", "Nome e descrição são obrigatórios.");
      return;
    }

    try {
      setLoading(true);

      const dataToSend = new FormData();
      dataToSend.append("nome", formData.nome);
      dataToSend.append("descricao", formData.descricao);
      if (formData.max_participantes) {
        dataToSend.append("max_participantes", formData.max_participantes);
      }
      dataToSend.append("categoria", formData.categoria);
      dataToSend.append("tipo_comunidade", formData.tipo_comunidade);
      dataToSend.append("duracao", formData.duracao || "");
      dataToSend.append("calorias", formData.calorias || "");
      dataToSend.append("data_evento", formData.data_evento || "");
      dataToSend.append("faixa_etaria", formData.faixa_etaria);
      dataToSend.append("premiacao", formData.premiacao || "");
      dataToSend.append("local_inicio", formData.local_inicio || "");
      dataToSend.append("local_fim", formData.local_fim || "");
      dataToSend.append("telefone_contato", formData.telefone_contato || "");
      dataToSend.append("imageurl", formData.imageurl || "");

      if (selectedImage) {
        const uri = selectedImage.uri;
        const name = uri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1] === "gif" ? "gif" : "jpeg"}` : `image/jpeg`;

        // @ts-ignore
        dataToSend.append("image", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name,
          type,
        });
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingCommunity) {
        await api.put(`/admin/communities/${editingCommunity.id_comunidade}`, dataToSend, config);
        Alert.alert("Sucesso", "Comunidade atualizada!");
      } else {
        await api.post("/admin/communities", dataToSend, config);
        Alert.alert("Sucesso", "Comunidade criada!");
      }
      setMode("list");
      fetchCommunities();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar comunidade:", error);
      const msg = error.response?.data?.error || "Erro ao salvar comunidade.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de permissão para acessar sua galeria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleConfirmDate = (date: Date) => {
    setFormData((p) => ({ ...p, data_evento: date.toISOString() }));
    setDatePickerVisibility(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirmar Exclusão", "Deseja realmente excluir esta comunidade?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/admin/communities/${id}`);
            fetchCommunities();
            Alert.alert("Sucesso", "Comunidade excluída!");
          } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir a comunidade.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      imageurl: "",
      max_participantes: "",
      categoria: "Corrida",
      tipo_comunidade: "Presencial",
      duracao: "",
      calorias: "",
      data_evento: "",
      faixa_etaria: "Livre",
      premiacao: "",
      local_inicio: "",
      local_fim: "",
      telefone_contato: "",
    });
    setEditingCommunity(null);
    setSelectedImage(null);
  };

  const openCreateMode = () => {
    resetForm();
    setMode("form");
  };

  const openEditMode = (comm: Community) => {
    setEditingCommunity(comm);
    setFormData({
      nome: comm.nome,
      descricao: comm.descricao,
      imageurl: comm.imageurl || "",
      max_participantes: String(comm.max_participantes || ""),
      categoria: comm.categoria || "Corrida",
      tipo_comunidade: comm.tipo_comunidade || "Presencial",
      duracao: comm.duracao || "",
      calorias: comm.calorias || "",
      data_evento: comm.data_evento || "",
      faixa_etaria: comm.faixa_etaria || "Livre",
      premiacao: comm.premiacao || "",
      local_inicio: comm.local_inicio || "",
      local_fim: comm.local_fim || "",
      telefone_contato: comm.telefone_contato || "",
    });
    setMode("form");
  };

  const filteredCommunities = communities.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["85%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: "#F8FAFC" }}
    >
      <View style={styles.sheetLayout}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {mode === "form" && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setMode("list");
                  resetForm();
                }}
              >
                <ArrowLeft size={20} color="#64748B" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.title}>
                {mode === "list"
                  ? "Comunidades"
                  : editingCommunity
                    ? "Editar comunidade"
                    : "Nova comunidade"}
              </Text>
              <Text style={styles.subtitle}>
                {mode === "list"
                  ? `${communities.length} eventos ativos`
                  : "Preencha os detalhes do evento"}
              </Text>
            </View>
          </View>
          {mode === "list" && (
            <TouchableOpacity style={styles.addBtn} onPress={openCreateMode}>
              <Plus size={20} color="#1E293B" />
              <Text style={styles.addBtnTxt}>Criar</Text>
            </TouchableOpacity>
          )}
        </View>

        {mode === "list" ? (
          <View style={{ flex: 1 }}>
            <View style={styles.searchBar}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                placeholder="Buscar comunidade..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading && communities.length === 0 ? (
              <View style={styles.centeredLoader}>
                <ActivityIndicator color="#BBF246" size="large" />
              </View>
            ) : (
              <BottomSheetFlatList<Community>
                data={filteredCommunities}
                keyExtractor={(item: Community) => item.id_comunidade.toString()}
                contentContainerStyle={{ paddingBottom: 50 }}
                renderItem={({ item }: { item: Community }) => (
                  <View style={styles.itemRow}>
                    <View style={styles.itemImageWrap}>
                      {item.imageurl ? (
                        <Image
                          source={{ uri: item.imageurl }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Users size={24} color="#BBF246" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.nome}</Text>
                      <View style={styles.itemBadges}>
                        <View style={styles.badge}>
                          <Layers size={11} color="#192126" />
                          <Text style={styles.badgeBlue}>{item.categoria}</Text>
                        </View>
                        <View style={styles.badge}>
                          <Users size={11} color="#192126" />
                          <Text style={styles.badgeGray}>
                            {item.participantes}/{item.max_participantes}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => openEditMode(item)}>
                        <Edit2 size={16} color="#192126" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, styles.iconBtnRed]}
                        onPress={() => handleDelete(item.id_comunidade)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        ) : (
          <BottomSheetScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mediaContainer}>
              {selectedImage || formData.imageurl ? (
                <TouchableOpacity
                  className="imagePreviewWrap"
                  style={styles.imagePreviewWrap}
                  activeOpacity={0.9}
                  onPress={pickImage}
                >
                  <Image
                    source={{ uri: selectedImage ? selectedImage.uri : formData.imageurl }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setFormData((p) => ({ ...p, imageurl: "" }));
                    }}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                  <Upload size={32} color="#94A3B8" />
                  <Text style={styles.imagePlaceholderText}>Carregar imagem do evento</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da comunidade/evento*</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Treino de sábado no Parque"
                placeholderTextColor="#94A3B8"
                value={formData.nome}
                onChangeText={(t) => setFormData((p) => ({ ...p, nome: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição*</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Descreva o que acontecerá..."
                placeholderTextColor="#94A3B8"
                multiline
                value={formData.descricao}
                onChangeText={(t) => setFormData((p) => ({ ...p, descricao: t }))}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Categoria</Text>
                <NativeScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {categories.map((cat: string) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.miniBtn, formData.categoria === cat && styles.miniBtnActive]}
                      onPress={() => {
                        if (cat === "Outros") {
                          setIsNewCategoryModalVisible(true);
                        } else {
                          setFormData((p) => ({ ...p, categoria: p.categoria === cat ? "" : cat }));
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.miniBtnTxt,
                          formData.categoria === cat && styles.miniBtnTxtActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </NativeScrollView>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Máx participantes</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 50"
                  keyboardType="numeric"
                  value={formData.max_participantes}
                  onChangeText={(t) => setFormData((p) => ({ ...p, max_participantes: t }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Data e hora do evento*</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                  ]}
                  onPress={() => setDatePickerVisibility(true)}
                >
                  <Text style={{ color: formData.data_evento ? "#1E293B" : "#94A3B8" }}>
                    {formatDate(formData.data_evento)}
                  </Text>
                  <Calendar size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              locale="pt-BR"
              onConfirm={handleConfirmDate}
              onCancel={() => setDatePickerVisibility(false)}
              confirmTextIOS="Confirmar"
              cancelTextIOS="Cancelar"
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Local início</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Portão 3 Ibirapuera"
                  value={formData.local_inicio}
                  onChangeText={(t) => setFormData((p) => ({ ...p, local_inicio: t }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Local fim (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Mesma entrada"
                  value={formData.local_fim}
                  onChangeText={(t) => setFormData((p) => ({ ...p, local_fim: t }))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Duração estimada</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 2 horas"
                  value={formData.duracao}
                  onChangeText={(t) => setFormData((p) => ({ ...p, duracao: t }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Calorias est.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 800kcal"
                  value={formData.calorias}
                  onChangeText={(t) => setFormData((p) => ({ ...p, calorias: t }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Premiação/brindes (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Vale-compras R$ 50 para o 1º"
                value={formData.premiacao}
                onChangeText={(t) => setFormData((p) => ({ ...p, premiacao: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone para contato</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: (11) 99999-9999"
                keyboardType="phone-pad"
                value={formData.telefone_contato}
                onChangeText={(t) => setFormData((p) => ({ ...p, telefone_contato: t }))}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnTxt}>
                  {editingCommunity ? "Atualizar comunidade" : "Criar comunidade"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </BottomSheetScrollView>
        )}
      </View>

      <Modal
        visible={isNewCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNewCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Categoria</Text>
              <TouchableOpacity onPress={() => setIsNewCategoryModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Digite o nome da nova categoria para sua comunidade.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Beach Tennis"
              placeholderTextColor="#94A3B8"
              autoFocus
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsNewCategoryModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  (!newCategoryName.trim() || isCreatingCategory) && { opacity: 0.6 },
                ]}
                onPress={handleAddCategory}
                disabled={!newCategoryName.trim() || isCreatingCategory}
              >
                {isCreatingCategory ? (
                  <ActivityIndicator color="#1E293B" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnTxt}>Adicionar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetLayout: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },
  addBtn: {
    backgroundColor: "#BBF246",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addBtnTxt: { color: "#1E293B", fontWeight: "700", fontSize: 14 },
  closeBtn: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 15,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: "#1E293B" },
  centeredLoader: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemImageWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F7FEE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  itemImage: { width: "100%", height: "100%" },
  itemTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 4 },
  itemBadges: { flexDirection: "row", gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeBlue: { fontSize: 10, fontWeight: "600", color: "#192126" },
  badgeGray: { fontSize: 10, fontWeight: "600", color: "#192126" },
  actions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8, backgroundColor: "#F7FEE7", borderRadius: 10 },
  iconBtnRed: { backgroundColor: "#FEF2F2" },
  formContainer: {
    paddingBottom: 80,
    paddingHorizontal: 4,
  },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: "row" },
  label: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 15,
    color: "#1E293B",
  },
  miniBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  miniBtnActive: { backgroundColor: "#BBF246", borderColor: "#BBF246" },
  miniBtnTxt: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  miniBtnTxtActive: { color: "#1E293B" },
  saveBtn: {
    backgroundColor: "#BBF246",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnTxt: { color: "#1E293B", fontSize: 16, fontWeight: "800" },
  mediaContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
  },
  imagePreviewWrap: {
    width: "100%",
    height: "100%",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  changeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#BBF246",
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  changeImageBtnTxt: {
    color: "#192126",
    fontSize: 14,
    fontWeight: "700",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  modalCancelBtnTxt: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#BBF246",
  },
  modalSaveBtnTxt: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "700",
  },
});

CommunityManagementSheet.displayName = "CommunityManagementSheet";

export default CommunityManagementSheet;
