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
import { ScrollView as NativeScrollView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
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
  MapPin,
  Clock,
  Flame,
  Trophy,
  Phone,
  Tag,
  ChevronRight,
  XCircle,
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
    if (!dateStr) return "Selecionar data e hora...";
    try {
      const date = new Date(dateStr);
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
    } catch {
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
      if (formData.max_participantes)
        dataToSend.append("max_participantes", formData.max_participantes);
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

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingCommunity) {
        await api.put(`/admin/communities/${editingCommunity.id_comunidade}`, dataToSend, config);
        Alert.alert("✅ Sucesso", "Comunidade atualizada com sucesso!");
      } else {
        await api.post("/admin/communities", dataToSend, config);
        Alert.alert("✅ Sucesso", "Comunidade criada com sucesso!");
      }
      setMode("list");
      fetchCommunities();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar comunidade:", error);
      Alert.alert("Erro", error.response?.data?.error || "Erro ao salvar comunidade.");
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
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const handleConfirmDate = (date: Date) => {
    setFormData((p) => ({ ...p, data_evento: date.toISOString() }));
    setDatePickerVisibility(false);
  };

  const handleDelete = (id: number, nome: string) => {
    Alert.alert("Excluir Comunidade", `Deseja realmente excluir "${nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/admin/communities/${id}`);
            setCommunities((prev) => prev.filter((c) => c.id_comunidade !== id));
            Alert.alert("Sucesso", "Comunidade excluída!");
          } catch {
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
    setSelectedImage(null);
    setMode("form");
  };

  const filteredCommunities = communities.filter(
    (c) =>
      String(c?.nome || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase()) ||
      String(c?.categoria || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase())
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
    ),
    []
  );

  // ─── Chip helper ────────────────────────────────────────────────────────────
  const Chip = ({
    label,
    active,
    onPress,
    color = "#BBF246",
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipTxt, active && { color: color === "#BBF246" ? "#1E293B" : "#fff" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ─── Field helper ───────────────────────────────────────────────────────────
  const Field = ({
    label,
    children,
    flex,
  }: {
    label: string;
    children: React.ReactNode;
    flex?: number;
  }) => (
    <View style={[styles.fieldGroup, flex !== undefined && { flex }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["92%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.sheetLayout}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {mode === "form" && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setMode("list");
                  resetForm();
                }}
              >
                <ArrowLeft size={18} color="#64748B" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.headerTitle}>
                {mode === "list"
                  ? "Comunidades"
                  : editingCommunity
                    ? "Editar Comunidade"
                    : "Nova Comunidade"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {mode === "list"
                  ? `${communities.length} comunidade${communities.length !== 1 ? "s" : ""} ativa${communities.length !== 1 ? "s" : ""}`
                  : "Preencha todos os detalhes do evento"}
              </Text>
            </View>
          </View>

          {mode === "list" && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={openCreateMode}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#BBF246", "#A3E635"]}
                style={styles.createBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Plus size={16} color="#1E293B" strokeWidth={2.5} />
                <Text style={styles.createBtnTxt}>Criar</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* ── LIST MODE ── */}
        {mode === "list" ? (
          <View style={{ flex: 1 }}>
            {/* Search */}
            <View style={styles.searchBar}>
              <Search size={17} color="#94A3B8" />
              <TextInput
                placeholder="Buscar por nome ou categoria..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <XCircle size={17} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {loading && communities.length === 0 ? (
              <View style={styles.centeredLoader}>
                <ActivityIndicator color="#BBF246" size="large" />
                <Text style={styles.loaderTxt}>Carregando comunidades...</Text>
              </View>
            ) : (
              <BottomSheetFlatList<Community>
                data={filteredCommunities}
                keyExtractor={(item: Community, index: number) =>
                  String(item?.id_comunidade || index)
                }
                contentContainerStyle={{ paddingBottom: 60, paddingTop: 4 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Users size={48} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>Nenhuma comunidade</Text>
                    <Text style={styles.emptySubtitle}>Crie a primeira comunidade agora</Text>
                  </View>
                )}
                renderItem={({ item }: { item: Community }) => {
                  const participants = Number(item.participantes) || 0;
                  const maxP = item.max_participantes || 50;
                  const progress = Math.min(participants / maxP, 1);
                  const isFull = participants >= maxP;

                  return (
                    <View style={styles.communityCard}>
                      {/* Image */}
                      <View style={styles.cardImageWrap}>
                        {item.imageurl ? (
                          <Image
                            source={{ uri: item.imageurl }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.cardImagePlaceholder}>
                            <Users size={22} color="#BBF246" />
                          </View>
                        )}
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillTxt} numberOfLines={1}>
                            {item.categoria || "Geral"}
                          </Text>
                        </View>
                      </View>

                      {/* Content */}
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.nome}
                        </Text>

                        {/* Meta row */}
                        <View style={styles.cardMetaRow}>
                          <View style={styles.cardMeta}>
                            <Users size={11} color="#94A3B8" />
                            <Text style={styles.cardMetaTxt}>
                              {participants}/{maxP}
                            </Text>
                          </View>
                          {item.tipo_comunidade ? (
                            <View style={styles.cardMeta}>
                              <Tag size={11} color="#94A3B8" />
                              <Text style={styles.cardMetaTxt}>{item.tipo_comunidade}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressBg}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${progress * 100}%`,
                                backgroundColor: isFull ? "#EF4444" : "#BBF246",
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => openEditMode(item)}
                          activeOpacity={0.8}
                        >
                          <Edit2 size={15} color="#6366F1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnRed]}
                          onPress={() => handleDelete(item.id_comunidade, item.nome)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        ) : (
          /* ── FORM MODE ── */
          <BottomSheetScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Cover Image ── */}
            <TouchableOpacity style={styles.mediaArea} onPress={pickImage} activeOpacity={0.85}>
              {selectedImage || formData.imageurl ? (
                <View style={{ width: "100%", height: "100%" }}>
                  <Image
                    source={{ uri: selectedImage ? selectedImage.uri : formData.imageurl }}
                    style={{ width: "100%", height: "100%", borderRadius: 18 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setFormData((p) => ({ ...p, imageurl: "" }));
                    }}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <View style={styles.uploadIconWrap}>
                    <Upload size={24} color="#64748B" />
                  </View>
                  <Text style={styles.mediaPlaceholderTitle}>Adicionar imagem de capa</Text>
                  <Text style={styles.mediaPlaceholderSub}>Recomendado: 16:9 · máx 5MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Section: Informações Básicas ── */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#6366F1" }]} />
              <Text style={styles.sectionTitle}>Informações Básicas</Text>
            </View>

            <Field label="Nome da comunidade / evento *">
              <TextInput
                style={styles.input}
                placeholder="Ex: Treino de sábado no Parque"
                placeholderTextColor="#94A3B8"
                value={formData.nome}
                onChangeText={(t) => setFormData((p) => ({ ...p, nome: t }))}
              />
            </Field>

            <Field label="Descrição *">
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva o que acontecerá no evento..."
                placeholderTextColor="#94A3B8"
                multiline
                value={formData.descricao}
                onChangeText={(t) => setFormData((p) => ({ ...p, descricao: t }))}
              />
            </Field>

            {/* ── Categoria ── */}
            <Field label="Categoria">
              <NativeScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={formData.categoria === cat}
                    onPress={() => {
                      if (cat === "Outros") {
                        setIsNewCategoryModalVisible(true);
                      } else {
                        setFormData((p) => ({ ...p, categoria: cat }));
                      }
                    }}
                  />
                ))}
              </NativeScrollView>
            </Field>

            {/* ── Tipo ── */}
            <Field label="Tipo de comunidade">
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["Presencial", "Online", "Híbrido"].map((tipo) => (
                  <Chip
                    key={tipo}
                    label={tipo}
                    active={formData.tipo_comunidade === tipo}
                    onPress={() => setFormData((p) => ({ ...p, tipo_comunidade: tipo }))}
                  />
                ))}
              </View>
            </Field>

            {/* ── Faixa Etária ── */}
            <Field label="Faixa etária">
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["Livre", "+14", "+18"].map((fx) => (
                  <Chip
                    key={fx}
                    label={fx}
                    active={formData.faixa_etaria === fx}
                    onPress={() => setFormData((p) => ({ ...p, faixa_etaria: fx }))}
                  />
                ))}
              </View>
            </Field>

            {/* ── Section: Logística ── */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#10B981" }]} />
              <Text style={styles.sectionTitle}>Logística do Evento</Text>
            </View>

            {/* Máx participantes + Data */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Field label="Máx. participantes" flex={1}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 100"
                  keyboardType="numeric"
                  value={formData.max_participantes}
                  onChangeText={(t) => setFormData((p) => ({ ...p, max_participantes: t }))}
                />
              </Field>
              <Field label="Data e hora *" flex={1.5}>
                <TouchableOpacity
                  style={[styles.input, styles.dateBtn]}
                  onPress={() => setDatePickerVisibility(true)}
                >
                  <Calendar size={15} color="#64748B" />
                  <Text
                    style={[styles.dateBtnTxt, formData.data_evento && { color: "#1E293B" }]}
                    numberOfLines={1}
                  >
                    {formatDate(formData.data_evento)}
                  </Text>
                </TouchableOpacity>
              </Field>
            </View>

            {/* Local Início + Fim (Full Width) */}
            <Field label="Local de início">
              <View style={styles.inputIconWrap}>
                <MapPin size={15} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Ex: Portão 3 Ibirapuera"
                  placeholderTextColor="#94A3B8"
                  value={formData.local_inicio}
                  onChangeText={(t) => setFormData((p) => ({ ...p, local_inicio: t }))}
                />
              </View>
            </Field>

            <Field label="Local de fim (opcional)">
              <View style={styles.inputIconWrap}>
                <MapPin size={15} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Ex: Mesmo local de início"
                  placeholderTextColor="#94A3B8"
                  value={formData.local_fim}
                  onChangeText={(t) => setFormData((p) => ({ ...p, local_fim: t }))}
                />
              </View>
            </Field>

            {/* ── Section: Detalhes ── */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.sectionTitle}>Detalhes do Evento</Text>
            </View>

            {/* Duração + Calorias */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Field label="Duração estimada" flex={1}>
                <View style={styles.inputIconWrap}>
                  <Clock size={15} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="Ex: 2 horas"
                    placeholderTextColor="#94A3B8"
                    value={formData.duracao}
                    onChangeText={(t) => setFormData((p) => ({ ...p, duracao: t }))}
                  />
                </View>
              </Field>
              <Field label="Calorias estimadas" flex={1}>
                <View style={styles.inputIconWrap}>
                  <Flame size={15} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="Ex: 800kcal"
                    placeholderTextColor="#94A3B8"
                    value={formData.calorias}
                    onChangeText={(t) => setFormData((p) => ({ ...p, calorias: t }))}
                  />
                </View>
              </Field>
            </View>

            <Field label="Premiação / brindes (opcional)">
              <View style={styles.inputIconWrap}>
                <Trophy size={15} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Ex: Vale-compras R$ 50 para o 1º"
                  placeholderTextColor="#94A3B8"
                  value={formData.premiacao}
                  onChangeText={(t) => setFormData((p) => ({ ...p, premiacao: t }))}
                />
              </View>
            </Field>

            <Field label="Telefone para contato">
              <View style={styles.inputIconWrap}>
                <Phone size={15} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Ex: (11) 99999-9999"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={formData.telefone_contato}
                  onChangeText={(t) => setFormData((p) => ({ ...p, telefone_contato: t }))}
                />
              </View>
            </Field>

            {/* ── Save Button ── */}
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#BBF246", "#A3E635"]}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#1E293B" />
                ) : (
                  <Text style={styles.saveBtnTxt}>
                    {editingCommunity ? "Atualizar Comunidade" : "Criar Comunidade"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </BottomSheetScrollView>
        )}
      </View>

      {/* ── Date Picker ── */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        locale="pt-BR"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />

      {/* ── Modal Nova Categoria ── */}
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
              <TouchableOpacity
                onPress={() => setIsNewCategoryModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
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
  sheetBg: { backgroundColor: "#FAFAFA", borderRadius: 32 },
  handleIndicator: { backgroundColor: "#E2E8F0", width: 40, height: 4 },
  sheetLayout: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  headerSubtitle: { fontSize: 13, color: "#94A3B8", marginTop: 2, fontWeight: "600" },
  createBtn: { borderRadius: 12, overflow: "hidden" },
  createBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  createBtnTxt: { fontSize: 14, fontWeight: "800", color: "#1E293B" },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1E293B" },

  // Loader / Empty
  centeredLoader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt: { fontSize: 14, color: "#94A3B8", fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  emptySubtitle: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },

  // Community Card
  communityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F7FEE7",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryPill: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(30,41,59,0.75)",
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
  },
  categoryPillTxt: { fontSize: 8, fontWeight: "800", color: "#fff", textTransform: "uppercase" },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginBottom: 4 },
  cardMetaRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaTxt: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  progressBg: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  cardActions: { flexDirection: "row", gap: 8, marginLeft: 10 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnRed: { backgroundColor: "#FEF2F2" },

  // Form
  formContainer: { paddingBottom: 80, paddingTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 14,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  textArea: { height: 90, textAlignVertical: "top" },

  inputIconWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 14, top: Platform.OS === "ios" ? 14 : 11, zIndex: 1 },
  inputWithIcon: { paddingLeft: 38 },

  dateBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateBtnTxt: { flex: 1, fontSize: 13, color: "#94A3B8", fontWeight: "500" },

  // Chip
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  chipTxt: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  // Media
  mediaArea: {
    width: "100%",
    height: 176,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    marginBottom: 20,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(239,68,68,0.85)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  mediaPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  uploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mediaPlaceholderTitle: { fontSize: 14, fontWeight: "700", color: "#475569" },
  mediaPlaceholderSub: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },

  // Save button
  saveBtn: { marginTop: 24, borderRadius: 16, overflow: "hidden" },
  saveBtnGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnTxt: { fontSize: 16, fontWeight: "800", color: "#1E293B" },

  // Modal
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
    marginBottom: 6,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  modalSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 20, marginTop: 4 },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
    marginBottom: 24,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  modalCancelBtnTxt: { color: "#64748B", fontSize: 15, fontWeight: "700" },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#BBF246",
  },
  modalSaveBtnTxt: { color: "#1E293B", fontSize: 15, fontWeight: "700" },
});

CommunityManagementSheet.displayName = "CommunityManagementSheet";

export default CommunityManagementSheet;
