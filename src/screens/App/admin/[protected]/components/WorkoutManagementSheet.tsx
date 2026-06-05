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
  FlatList,
} from "react-native";
import { ScrollView as NativeScrollView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import {
  Plus,
  Search,
  Trash2,
  X,
  ArrowLeft,
  Dumbbell,
  Clock,
  Flame,
  Star,
  ChevronRight,
  XCircle,
  Upload,
  Edit2,
  Zap,
  MoreVertical,
  ChevronDown,
  Activity,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../../../../services/api";
import BackButton from "@components/BackButton";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseVariation {
  id_exercicio: number;
  nome: string;
  image_url: string | null;
  series: string;
  repeticoes: string;
  descanso: string;
  observacoes: string;
}

export interface Training {
  id_treino: number;
  nome: string;
  descricao: string;
  imageurl: string | null;
  duracao: string;
  calorias: string;
  nivel: string;
  categoria: string;
  exercicios: ExerciseVariation[];
  ativo: boolean;
}

export interface GlobalExercise {
  id_exercicio: number;
  nome: string;
  descricao: string;
  image_url: string | null;
  categoria: string;
}

interface WorkoutManagementSheetProps {
  onClose?: () => void;
}

export interface WorkoutManagementSheetRef {
  open: () => void;
  close: () => void;
}

type ViewMode = "list" | "form" | "details";

// ─── Sub-components redefined outside for performance ───
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

const WorkoutManagementSheet = forwardRef<WorkoutManagementSheetRef, WorkoutManagementSheetProps>(
  (props, ref) => {
    const { onClose } = props;
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [mode, setMode] = useState<ViewMode>("list");
    const [loading, setLoading] = useState(false);
    const [workouts, setWorkouts] = useState<Training[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Global Exercises for Selection
    const [globalExercises, setGlobalExercises] = useState<GlobalExercise[]>([]);
    const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
    const [isExercisePickerVisible, setIsExercisePickerVisible] = useState(false);
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [dbCategories, setDbCategories] = useState<string[]>([]);
    const [dbLevels, setDbLevels] = useState<string[]>([]);

    // Form States
    const [selectedWorkout, setSelectedWorkout] = useState<Training | null>(null);
    const [editingWorkout, setEditingWorkout] = useState<Training | null>(null);
    const [formData, setFormData] = useState({
      nome: "",
      descricao: "",
      imageurl: "",
      duracao: "",
      calorias: "",
      nivel: "Iniciante",
      categoria: "Hipertrofia",
      secao_home: "" as string,
      exercicios: [] as ExerciseVariation[],
    });
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    // ── Catálogo Global: criar/editar exercício ──
    const [isExerciseFormVisible, setIsExerciseFormVisible] = useState(false);
    const [editingExercise, setEditingExercise] = useState<GlobalExercise | null>(null);
    const [savingExercise, setSavingExercise] = useState(false);
    const [exerciseForm, setExerciseForm] = useState({ nome: "", descricao: "", categoria: "" });
    const [exerciseImage, setExerciseImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }));

    const fetchWorkouts = useCallback(async () => {
      try {
        setLoading(true);
        const response = await api.get("/treinos");
        const list = response.data.data || response.data;
        setWorkouts(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Erro ao buscar treinos:", error);
      } finally {
        setLoading(false);
      }
    }, []);

    const fetchGlobalExercises = useCallback(async () => {
      try {
        setLoadingExercises(true);
        const response = await api.get("/exercicios");
        const list = response.data.data || response.data;
        setGlobalExercises(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Erro ao buscar exercícios:", error);
      } finally {
        setLoadingExercises(false);
      }
    }, []);

    const fetchMetadata = useCallback(async () => {
      try {
        const [catRes, levelRes] = await Promise.all([
          api.get("/treino-categorias"),
          api.get("/treino-niveis"),
        ]);
        setDbCategories(catRes.data.data || []);
        setDbLevels(levelRes.data.data || []);
      } catch (err) {
        console.error("Erro ao buscar metadados de treinos:", err);
      }
    }, []);

    useEffect(() => {
      fetchWorkouts();
      fetchGlobalExercises();
      fetchMetadata();
    }, [fetchWorkouts, fetchGlobalExercises, fetchMetadata]);

    const handleSave = async () => {
      if (!formData.nome || !formData.descricao) {
        Alert.alert("Erro", "Nome e descrição são obrigatórios.");
        return;
      }

      try {
        setLoading(true);
        const dataToSend = new FormData();

        // Formatação inteligente de duração e calorias
        const formattedDuracao = /^\d+$/.test(formData.duracao.trim())
          ? `${formData.duracao.trim()} min`
          : formData.duracao.trim();

        const formattedCalorias = /^\d+$/.test(formData.calorias.trim())
          ? `${formData.calorias.trim()} Kcal`
          : formData.calorias.trim();

        dataToSend.append("nome", formData.nome);
        dataToSend.append("descricao", formData.descricao);
        dataToSend.append("duracao", formattedDuracao);
        dataToSend.append("calorias", formattedCalorias);
        dataToSend.append("nivel", formData.nivel);
        dataToSend.append("categoria", formData.categoria);
        dataToSend.append("secao_home", formData.secao_home || "");
        dataToSend.append("exercicios", JSON.stringify(formData.exercicios));

        if (selectedImage) {
          const uri = selectedImage.uri;
          const name = uri.split("/").pop() || "workout.jpg";
          const match = /\.(\w+)$/.exec(name);
          const type = match ? `image/${match[1] === "gif" ? "gif" : "jpeg"}` : `image/jpeg`;
          // @ts-ignore
          dataToSend.append("image", {
            uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
            name,
            type,
          });
        } else if (formData.imageurl) {
          dataToSend.append("image_url", formData.imageurl);
        }

        const config = { headers: { "Content-Type": "multipart/form-data" } };

        if (editingWorkout) {
          await api.put(`/admin/workouts/${editingWorkout.id_treino}`, dataToSend, config);
          Alert.alert("✅ Sucesso", "Treino atualizado com sucesso!");
        } else {
          await api.post("/admin/workouts", dataToSend, config);
          Alert.alert("✅ Sucesso", "Treino criado com sucesso!");
        }

        setMode("list");
        fetchWorkouts();
        resetForm();
      } catch (error: any) {
        console.error("Erro ao salvar treino:", error);
        Alert.alert("Erro", error.response?.data?.error || "Erro ao salvar treino.");
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

    const openDetailsMode = (workout: Training) => {
      setSelectedWorkout(workout);
      setMode("details");
    };

    const handleDelete = (id: number, nome: string) => {
      Alert.alert("Excluir Treino", `Deseja realmente excluir "${nome}"?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/admin/workouts/${id}`);
              setWorkouts((prev) => prev.filter((w) => w.id_treino !== id));
              Alert.alert("Sucesso", "Treino excluído!");
            } catch {
              Alert.alert("Erro", "Não foi possível excluir o treino.");
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
        duracao: "",
        calorias: "",
        nivel: "Iniciante",
        categoria: "Hipertrofia",
        secao_home: "",
        exercicios: [],
      });
      setEditingWorkout(null);
      setSelectedImage(null);
    };

    const openCreateMode = () => {
      resetForm();
      setMode("form");
    };

    const openEditMode = (workout: Training) => {
      setEditingWorkout(workout);
      setFormData({
        nome: workout.nome,
        descricao: workout.descricao,
        imageurl: workout.imageurl || "",
        duracao: workout.duracao || "",
        calorias: workout.calorias || "",
        nivel: workout.nivel || "Iniciante",
        categoria: workout.categoria || "Hipertrofia",
        secao_home: (workout as any).secao_home || "",
        exercicios: Array.isArray(workout.exercicios) ? workout.exercicios : [],
      });
      setSelectedImage(null);
      setMode("form");
    };

    const addExerciseToTraining = (ex: GlobalExercise) => {
      const variation: ExerciseVariation = {
        id_exercicio: ex.id_exercicio,
        nome: ex.nome,
        image_url: ex.image_url,
        series: "3",
        repeticoes: "12",
        descanso: "45s",
        observacoes: "",
      };
      setFormData((p) => ({
        ...p,
        exercicios: [...p.exercicios, variation],
      }));
      setIsExercisePickerVisible(false);
    };

    const removeExerciseFromTraining = (index: number) => {
      setFormData((p) => ({
        ...p,
        exercicios: p.exercicios.filter((_, i) => i !== index),
      }));
    };

    // ── Criar / editar exercício no catálogo global ──
    const pickExerciseImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de permissão para acessar sua galeria.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setExerciseImage(result.assets[0]);
    };

    const openCreateExercise = () => {
      setEditingExercise(null);
      setExerciseForm({ nome: "", descricao: "", categoria: "" });
      setExerciseImage(null);
      setIsExerciseFormVisible(true);
    };

    const openEditExercise = (ex: GlobalExercise) => {
      setEditingExercise(ex);
      setExerciseForm({
        nome: ex.nome || "",
        descricao: ex.descricao || "",
        categoria: ex.categoria || "",
      });
      setExerciseImage(null);
      setIsExerciseFormVisible(true);
    };

    const saveExercise = async () => {
      if (!exerciseForm.nome.trim()) {
        Alert.alert("Erro", "O nome do exercício é obrigatório.");
        return;
      }
      if (!editingExercise && !exerciseImage) {
        Alert.alert("Erro", "A imagem do exercício é obrigatória.");
        return;
      }
      try {
        setSavingExercise(true);
        const dataToSend = new FormData();
        dataToSend.append("nome", exerciseForm.nome.trim());
        dataToSend.append("descricao", exerciseForm.descricao.trim());
        dataToSend.append("categoria", exerciseForm.categoria.trim() || "Geral");

        if (exerciseImage) {
          const uri = exerciseImage.uri;
          const name = uri.split("/").pop() || "exercicio.jpg";
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
        if (editingExercise) {
          await api.put(
            `/admin/exercicios/${editingExercise.id_exercicio}`,
            dataToSend,
            config
          );
          Alert.alert("✅ Sucesso", "Exercício atualizado!");
        } else {
          await api.post("/admin/exercicios", dataToSend, config);
          Alert.alert("✅ Sucesso", "Exercício criado!");
        }

        setIsExerciseFormVisible(false);
        await fetchGlobalExercises();
      } catch (error: any) {
        console.error("Erro ao salvar exercício:", error);
        Alert.alert("Erro", error.response?.data?.error || "Erro ao salvar exercício.");
      } finally {
        setSavingExercise(false);
      }
    };

    const deleteExercise = (ex: GlobalExercise) => {
      Alert.alert("Excluir Exercício", `Deseja realmente excluir "${ex.nome}" do catálogo?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/exercicios/${ex.id_exercicio}`);
              await fetchGlobalExercises();
              Alert.alert("Sucesso", "Exercício excluído!");
            } catch (error: any) {
              const data = error.response?.data;
              if (error.response?.status === 409) {
                Alert.alert(
                  "Exercício em uso",
                  `Não é possível excluir: está sendo usado em ${
                    data?.treinos?.length ? `(${data.treinos.join(", ")})` : "treinos"
                  }.`
                );
              } else {
                Alert.alert("Erro", data?.error || "Não foi possível excluir o exercício.");
              }
            }
          },
        },
      ]);
    };

    const updateExerciseVariation = (
      index: number,
      key: keyof ExerciseVariation,
      value: string
    ) => {
      setFormData((p) => {
        const newExs = [...p.exercicios];
        newExs[index] = { ...newExs[index], [key]: value };
        return { ...p, exercicios: newExs };
      });
    };

    const filteredWorkouts = workouts.filter(
      (w) =>
        String(w?.nome || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase()) ||
        String(w?.categoria || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase())
    );

    const filteredGlobalExercises = globalExercises.filter((ex) =>
      String(ex?.nome || "")
        .toLowerCase()
        .includes((exerciseSearchQuery || "").toLowerCase())
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
      ),
      []
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={["85%"]}
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
              {(mode === "form" || mode === "details") && (
                <BackButton
                  style={styles.backBtn}
                  onPress={() => {
                    setMode("list");
                    resetForm();
                    setSelectedWorkout(null);
                  }}
                />
              )}
              <View>
                <Text style={styles.headerTitle}>
                  {mode === "list"
                    ? "Treinos"
                    : mode === "details"
                      ? "Detalhes do treino"
                      : editingWorkout
                        ? "Editar treino"
                        : "Novo treino"}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {mode === "list"
                    ? `${workouts.length} treino${workouts.length !== 1 ? "s" : ""} cadastrado${workouts.length !== 1 ? "s" : ""}`
                    : mode === "details"
                      ? "Visualize todas as informações do treino"
                      : "Configure o treino e adicione os exercícios"}
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
                  <Text style={styles.createBtnTxt}>Novo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* ── LIST MODE ── */}
          {mode === "list" ? (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBar}>
                <Search size={17} color="#94A3B8" />
                <BottomSheetTextInput
                  placeholder="Buscar treino ou categoria..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {loading && workouts.length === 0 ? (
                <View style={styles.centeredLoader}>
                  <ActivityIndicator color="#BBF246" size="large" />
                  <Text style={styles.loaderTxt}>Carregando treinos...</Text>
                </View>
              ) : (
                <BottomSheetFlatList<Training>
                  data={filteredWorkouts}
                  keyExtractor={(item: Training, index: number) => String(item?.id_treino || index)}
                  contentContainerStyle={{ paddingBottom: 60, paddingTop: 4 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                      <Dumbbell size={48} color="#E2E8F0" />
                      <Text style={styles.emptyTitle}>Nenhum treino</Text>
                      <Text style={styles.emptySubtitle}>Cadastre o primeiro treino agora</Text>
                    </View>
                  )}
                  renderItem={({ item }: { item: Training }) => (
                    <TouchableOpacity
                      style={styles.workoutCard}
                      onPress={() => openDetailsMode(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardImageWrap}>
                        {item.imageurl ? (
                          <Image
                            source={{ uri: item.imageurl }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.cardImagePlaceholder}>
                            <Dumbbell size={22} color="#BBF246" />
                          </View>
                        )}
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillTxt}>{item.categoria || "Geral"}</Text>
                        </View>
                      </View>

                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.nome}
                        </Text>
                        <View style={styles.cardMetaRow}>
                          <View style={styles.cardMeta}>
                            <Zap size={11} color="#94A3B8" />
                            <Text style={styles.cardMetaTxt}>{item.nivel}</Text>
                          </View>
                          <View style={styles.cardMeta}>
                            <Clock size={11} color="#94A3B8" />
                            <Text style={styles.cardMetaTxt}>{item.duracao || "30m"}</Text>
                          </View>
                          <View style={styles.cardMeta}>
                            <Activity size={11} color="#94A3B8" />
                            <Text style={styles.cardMetaTxt}>
                              {item.exercicios?.length || 0} exs
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => openEditMode(item)}
                        >
                          <Edit2 size={15} color="#6366F1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnRed]}
                          onPress={() => handleDelete(item.id_treino, item.nome)}
                        >
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          ) : mode === "details" ? (
            /* ── DETAILS MODE ── */
            <BottomSheetScrollView
              contentContainerStyle={{ paddingBottom: 80 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedWorkout && (
                <>
                  <View style={styles.detailsHeader}>
                    <View style={styles.detailsMainImgWrap}>
                      {selectedWorkout.imageurl ? (
                        <Image
                          source={{ uri: selectedWorkout.imageurl }}
                          style={styles.detailsMainImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.detailsImgPlaceholder}>
                          <Dumbbell size={48} color="#BBF246" />
                        </View>
                      )}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.6)"]}
                        style={styles.detailsImgGradient}
                      />
                      <View style={styles.detailsBadgeContainer}>
                        <View style={styles.detailsCatBadge}>
                          <Text style={styles.detailsCatBadgeTxt}>{selectedWorkout.categoria}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailsInfoCard}>
                    <View style={styles.detailsMetaRow}>
                      <View style={styles.detailsMetaBox}>
                        <Zap size={16} color="#6366F1" />
                        <Text style={styles.detailsMetaLabel}>Nível</Text>
                        <Text style={styles.detailsMetaVal}>{selectedWorkout.nivel}</Text>
                      </View>
                      <View style={styles.detailsMetaDivider} />
                      <View style={styles.detailsMetaBox}>
                        <Clock size={16} color="#6366F1" />
                        <Text style={styles.detailsMetaLabel}>Duração</Text>
                        <Text style={styles.detailsMetaVal}>{selectedWorkout.duracao}</Text>
                      </View>
                      <View style={styles.detailsMetaDivider} />
                      <View style={styles.detailsMetaBox}>
                        <Flame size={16} color="#6366F1" />
                        <Text style={styles.detailsMetaLabel}>Calorias</Text>
                        <Text style={styles.detailsMetaVal}>{selectedWorkout.calorias}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailsContentBody}>
                    <Text style={styles.detailsDesc}>{selectedWorkout.descricao}</Text>

                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                      <View style={[styles.sectionDot, { backgroundColor: "#6366F1" }]} />
                      <Text style={styles.sectionTitle}>
                        Exercícios ({selectedWorkout.exercicios?.length || 0})
                      </Text>
                    </View>

                    {selectedWorkout.exercicios && selectedWorkout.exercicios.length > 0 ? (
                      selectedWorkout.exercicios.map((ex, idx) => (
                        <View key={idx} style={styles.detailExItem}>
                          <View style={styles.detailExHeader}>
                            <View style={styles.detailExDot}>
                              <Text style={styles.detailExNum}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.detailExName}>{ex.nome}</Text>
                          </View>
                          <View style={styles.detailExStats}>
                            <View style={styles.detailExStat}>
                              <Text style={styles.detailExStatLabel}>SÉRIES</Text>
                              <Text style={styles.detailExStatVal}>{ex.series}</Text>
                            </View>
                            <View style={styles.detailExStat}>
                              <Text style={styles.detailExStatLabel}>REPS</Text>
                              <Text style={styles.detailExStatVal}>{ex.repeticoes}</Text>
                            </View>
                            <View style={styles.detailExStat}>
                              <Text style={styles.detailExStatLabel}>DESCANSO</Text>
                              <Text style={styles.detailExStatVal}>{ex.descanso}</Text>
                            </View>
                          </View>
                          {ex.observacoes && (
                            <Text style={styles.detailExObs}>💡 {ex.observacoes}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.detailsEmptyText}>Nenhum exercício cadastrado.</Text>
                    )}

                    <TouchableOpacity
                      style={styles.detailsEditBtn}
                      onPress={() => openEditMode(selectedWorkout)}
                    >
                      <Edit2 size={18} color="#fff" />
                      <Text style={styles.detailsEditBtnTxt}>Editar este treino</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </BottomSheetScrollView>
          ) : (
            /* ── FORM MODE ── */
            <BottomSheetScrollView
              contentContainerStyle={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                    <Text style={styles.mediaPlaceholderTitle}>Imagem do treino</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#6366F1" }]} />
                <Text style={styles.sectionTitle}>Detalhes do Treino</Text>
              </View>

              <Field label="Nome do treino *">
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="Ex: Peito e Tríceps Insano"
                  placeholderTextColor="#94A3B8"
                  value={formData.nome}
                  onChangeText={(t) => setFormData((p) => ({ ...p, nome: t }))}
                />
              </Field>

              <Field label="Descrição">
                <BottomSheetTextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Foco em hipertrofia e explosão..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={formData.descricao}
                  onChangeText={(t) => setFormData((p) => ({ ...p, descricao: t }))}
                />
              </Field>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Field label="Duração" flex={1}>
                  <BottomSheetTextInput
                    style={styles.input}
                    placeholder="45 min"
                    placeholderTextColor="#94A3B8"
                    value={formData.duracao}
                    onChangeText={(t) => setFormData((p) => ({ ...p, duracao: t }))}
                  />
                </Field>
                <Field label="Calorias" flex={1}>
                  <BottomSheetTextInput
                    style={styles.input}
                    placeholder="300 kcal"
                    placeholderTextColor="#94A3B8"
                    value={formData.calorias}
                    onChangeText={(t) => setFormData((p) => ({ ...p, calorias: t }))}
                  />
                </Field>
              </View>

              <Field label="Nível">
                <NativeScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {dbLevels.map((n) => (
                    <Chip
                      key={n}
                      label={n}
                      active={formData.nivel === n}
                      onPress={() => setFormData((p) => ({ ...p, nivel: n }))}
                    />
                  ))}
                </NativeScrollView>
              </Field>

              <Field label="Categoria">
                <NativeScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {dbCategories.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      active={formData.categoria === c}
                      onPress={() => setFormData((p) => ({ ...p, categoria: c }))}
                    />
                  ))}
                </NativeScrollView>
              </Field>

              {/* ── EXERCISES SECTION ── */}
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#BBF246" }]} />
                <Text style={styles.sectionTitle}>Exercícios e Variações</Text>
              </View>

              {formData.exercicios.map((ex, idx) => (
                <View key={idx} style={styles.variationCard}>
                  <View style={styles.variationHeader}>
                    <View style={styles.variationInfo}>
                      <Text style={styles.variationName}>{ex.nome}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeExerciseFromTraining(idx)}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.variationGrid}>
                    <View style={styles.miniField}>
                      <Text style={styles.miniLabel}>Séries</Text>
                      <BottomSheetTextInput
                        style={styles.miniInput}
                        value={ex.series}
                        onChangeText={(t) => updateExerciseVariation(idx, "series", t)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.miniField}>
                      <Text style={styles.miniLabel}>Reps</Text>
                      <BottomSheetTextInput
                        style={styles.miniInput}
                        value={ex.repeticoes}
                        onChangeText={(t) => updateExerciseVariation(idx, "repeticoes", t)}
                      />
                    </View>
                    <View style={styles.miniField}>
                      <Text style={styles.miniLabel}>Descanso</Text>
                      <BottomSheetTextInput
                        style={styles.miniInput}
                        value={ex.descanso}
                        onChangeText={(t) => updateExerciseVariation(idx, "descanso", t)}
                      />
                    </View>
                  </View>

                  <BottomSheetTextInput
                    style={styles.notesInput}
                    placeholder="Obs: Execução lenta na descida..."
                    placeholderTextColor="#94A3B8"
                    value={ex.observacoes}
                    onChangeText={(t) => updateExerciseVariation(idx, "observacoes", t)}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => setIsExercisePickerVisible(true)}
              >
                <Plus size={18} color="#6366F1" />
                <Text style={styles.addExerciseBtnTxt}>Adicionar exercício</Text>
              </TouchableOpacity>

              {/* ── DESTAQUE NA HOME ── */}
              <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                <View style={[styles.sectionDot, { backgroundColor: "#BBF246" }]} />
                <Text style={styles.sectionTitle}>Destaque na Home</Text>
              </View>
              <Text style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12, fontWeight: "500" }}>
                Escolha onde este treino aparecerá na tela principal dos usuários.
              </Text>
              <NativeScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4, marginBottom: 20 }}
              >
                {(
                  [
                    { label: "Sem destaque", value: "" },
                    { label: "Populares", value: "popular" },
                    { label: "Plano do Dia", value: "plano_do_dia" },
                    { label: "Melhores para Você", value: "melhores_para_voce" },
                    { label: "Desafios", value: "desafio" },
                    { label: "Aquecimento", value: "aquecimento" },
                  ] as { label: string; value: string }[]
                ).map((opt) => (
                  <Chip
                    key={opt.value || "none"}
                    label={opt.label}
                    active={formData.secao_home === opt.value}
                    onPress={() => setFormData((p) => ({ ...p, secao_home: opt.value }))}
                    color={opt.value === "" ? "#94A3B8" : "#BBF246"}
                  />
                ))}
              </NativeScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.65 }]}
                onPress={handleSave}
                disabled={loading}
              >
                <LinearGradient colors={["#BBF246", "#A3E635"]} style={styles.saveBtnGradient}>
                  {loading ? (
                    <ActivityIndicator color="#1E293B" />
                  ) : (
                    <Text style={styles.saveBtnTxt}>
                      {editingWorkout ? "Salvar alterações" : "Criar treino"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ height: 50 }} />
            </BottomSheetScrollView>
          )}
        </View>

        {/* ── EXERCISE PICKER MODAL ── */}
        <Modal
          visible={isExercisePickerVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsExercisePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Exercício</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity onPress={openCreateExercise} style={styles.exModalNewBtn}>
                    <Plus size={15} color="#1E293B" />
                    <Text style={styles.exModalNewBtnTxt}>Criar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsExercisePickerVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.searchBar, { marginTop: 0 }]}>
                <Search size={17} color="#94A3B8" />
                <TextInput
                  placeholder="Buscar na base global..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                  value={exerciseSearchQuery}
                  onChangeText={setExerciseSearchQuery}
                  autoFocus
                />
              </View>

              <FlatList
                data={filteredGlobalExercises}
                keyExtractor={(item: GlobalExercise, index: number) =>
                  String(item?.id_exercicio || index)
                }
                renderItem={({ item }: { item: GlobalExercise }) => (
                  <TouchableOpacity
                    style={styles.exerciseItem}
                    onPress={() => addExerciseToTraining(item)}
                  >
                    <View style={styles.exerciseItemImgWrap}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.exerciseItemImg} />
                      ) : (
                        <Dumbbell size={16} color="#6366F1" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseItemName}>{item.nome}</Text>
                      <Text style={styles.exerciseItemCat}>{item.categoria}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openEditExercise(item)}
                      style={styles.exRowActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit2 size={16} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteExercise(item)}
                      style={styles.exRowActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                    <View style={styles.exRowAddBtn}>
                      <Plus size={18} color="#1E293B" />
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.centeredLoader}>
                    <Text style={styles.loaderTxt}>Nenhum exercício encontrado</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* ── EXERCISE CREATE/EDIT MODAL ── */}
        <Modal
          visible={isExerciseFormVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsExerciseFormVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingExercise ? "Editar Exercício" : "Novo Exercício"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsExerciseFormVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <NativeScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.exFormImagePicker}
                  onPress={pickExerciseImage}
                  activeOpacity={0.8}
                >
                  {exerciseImage ? (
                    <Image source={{ uri: exerciseImage.uri }} style={styles.exFormImage} />
                  ) : editingExercise?.image_url ? (
                    <Image
                      source={{ uri: editingExercise.image_url }}
                      style={styles.exFormImage}
                    />
                  ) : (
                    <View style={styles.exFormImagePlaceholder}>
                      <Upload size={22} color="#94A3B8" />
                      <Text style={styles.exFormImageHint}>Toque para enviar foto (obrigatória)</Text>
                    </View>
                  )}
                  {(exerciseImage || editingExercise?.image_url) && (
                    <View style={styles.exFormImageOverlay}>
                      <Upload size={16} color="#fff" />
                      <Text style={styles.exFormImageOverlayTxt}>Trocar foto</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Field label="Nome do exercício">
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Supino Inclinado"
                    placeholderTextColor="#94A3B8"
                    value={exerciseForm.nome}
                    onChangeText={(t) => setExerciseForm((p) => ({ ...p, nome: t }))}
                  />
                </Field>

                <Field label="Categoria / grupo muscular">
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Peito"
                    placeholderTextColor="#94A3B8"
                    value={exerciseForm.categoria}
                    onChangeText={(t) => setExerciseForm((p) => ({ ...p, categoria: t }))}
                  />
                  <View style={styles.chipRow}>
                    {["Peito", "Costas", "Pernas", "Ombros", "Braços", "Core"].map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        active={exerciseForm.categoria === cat}
                        onPress={() => setExerciseForm((p) => ({ ...p, categoria: cat }))}
                      />
                    ))}
                  </View>
                </Field>

                <Field label="Descrição / instruções">
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                    placeholder="Como executar o movimento..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={exerciseForm.descricao}
                    onChangeText={(t) => setExerciseForm((p) => ({ ...p, descricao: t }))}
                  />
                </Field>

                <TouchableOpacity
                  style={[styles.exFormSaveBtn, savingExercise && { opacity: 0.6 }]}
                  onPress={saveExercise}
                  disabled={savingExercise}
                  activeOpacity={0.85}
                >
                  {savingExercise ? (
                    <ActivityIndicator size="small" color="#1E293B" />
                  ) : (
                    <Text style={styles.exFormSaveBtnTxt}>
                      {editingExercise ? "Salvar alterações" : "Criar exercício"}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 24 }} />
              </NativeScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: "#FAFAFA", borderRadius: 32 },
  handleIndicator: { backgroundColor: "#E2E8F0", width: 40, height: 4 },
  sheetLayout: { flex: 1, paddingHorizontal: 20 },
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
  centeredLoader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt: { fontSize: 14, color: "#94A3B8", fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  emptySubtitle: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },

  // Cards
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
  textArea: { height: 70, textAlignVertical: "top" },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  chipTxt: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  mediaArea: {
    width: "100%",
    height: 160,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    marginBottom: 10,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mediaPlaceholderTitle: { fontSize: 14, fontWeight: "700", color: "#475569" },

  // Variation Card
  variationCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  variationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  variationInfo: { flex: 1 },
  variationName: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  variationGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  miniField: { flex: 1 },
  miniLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  miniInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  notesInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1E293B",
  },

  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#6366F1",
    borderStyle: "dashed",
    marginTop: 10,
    marginBottom: 20,
  },
  addExerciseBtnTxt: { fontSize: 14, fontWeight: "800", color: "#6366F1" },

  saveBtn: { borderRadius: 18, overflow: "hidden" },
  saveBtnGradient: { height: 56, alignItems: "center", justifyContent: "center" },
  saveBtnTxt: { fontSize: 16, fontWeight: "800", color: "#1E293B" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    height: "80%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  exerciseItemImgWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  exerciseItemImg: { width: "100%", height: "100%" },
  exerciseItemName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  exerciseItemCat: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },

  // Catálogo: criar/editar exercício
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  exModalNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#BBF246",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  exModalNewBtnTxt: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  exRowActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  exRowAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BBF246",
  },
  exFormImagePicker: {
    width: "100%",
    height: 170,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    marginTop: 4,
    marginBottom: 8,
    position: "relative",
  },
  exFormImage: { width: "100%", height: "100%" },
  exFormImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 20,
  },
  exFormImageHint: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  exFormImageOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exFormImageOverlayTxt: { fontSize: 12, color: "#fff", fontWeight: "700" },
  exFormSaveBtn: {
    backgroundColor: "#BBF246",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  exFormSaveBtnTxt: { fontSize: 16, fontWeight: "900", color: "#1E293B" },

  // Details
  detailsHeader: { marginBottom: 20 },
  detailsMainImgWrap: {
    width: "100%",
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  detailsMainImg: { width: "100%", height: "100%" },
  detailsImgPlaceholder: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsImgGradient: { ...StyleSheet.absoluteFillObject },
  detailsBadgeContainer: { position: "absolute", bottom: 16, left: 16 },
  detailsCatBadge: {
    backgroundColor: "#BBF246",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  detailsCatBadgeTxt: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1E293B",
    textTransform: "uppercase",
  },

  detailsInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginTop: -30,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  detailsMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailsMetaBox: { alignItems: "center", flex: 1, gap: 4 },
  detailsMetaLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailsMetaVal: { fontSize: 14, color: "#1E293B", fontWeight: "800" },
  detailsMetaDivider: { width: 1, height: 30, backgroundColor: "#F1F5F9" },

  detailsContentBody: { paddingHorizontal: 4, marginTop: 24 },
  detailsDesc: { fontSize: 15, color: "#475569", lineHeight: 22, fontWeight: "500" },
  detailsEmptyText: { textAlign: "center", color: "#94A3B8", marginTop: 20, fontSize: 14 },

  detailExItem: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailExHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  detailExDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  detailExNum: { fontSize: 13, fontWeight: "900", color: "#fff" },
  detailExName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  detailExStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
  },
  detailExStat: { alignItems: "center" },
  detailExStatLabel: { fontSize: 9, color: "#94A3B8", fontWeight: "800", marginBottom: 2 },
  detailExStatVal: { fontSize: 13, fontWeight: "800", color: "#6366F1" },
  detailExObs: { marginTop: 12, fontSize: 12, color: "#64748B", fontStyle: "italic" },

  detailsEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    height: 56,
    borderRadius: 18,
    marginTop: 30,
    gap: 10,
  },
  detailsEditBtnTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
});

WorkoutManagementSheet.displayName = "WorkoutManagementSheet";
export default WorkoutManagementSheet;
