import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
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
} from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  X,
  ArrowLeft,
  Edit2,
  Upload,
  CreditCard,
  DollarSign,
  Type,
  FileText,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../../../../services/api";

export interface StripePlan {
  id: string;
  stripe_product_id: string;
  stripe_price_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  images?: string[];
}

interface StripePlansSheetProps {
  onClose?: () => void;
}

export interface StripePlansSheetRef {
  open: () => void;
  close: () => void;
}

type ViewMode = "list" | "form";

const StripePlansSheet = forwardRef<StripePlansSheetRef, StripePlansSheetProps>((props, ref) => {
  const { onClose } = props;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [mode, setMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [saving, setSaving] = useState(false);

  // Form States
  const [editingPlan, setEditingPlan] = useState<StripePlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetRef.current?.expand();
      fetchPlans();
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get("/plans");
      setPlans(response.data);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      Alert.alert("Erro", "Não foi possível carregar os planos da Stripe.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: StripePlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
    });
    setSelectedImage(null);
    setMode("form");
  };

  const pickImage = async () => {
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

  const handleSave = async () => {
    if (!editingPlan) return;
    if (!formData.name || !formData.price) {
      Alert.alert("Erro", "Nome e preço são obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("price", formData.price);

      if (selectedImage) {
        const uriParts = selectedImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        submitData.append("image", {
          uri: selectedImage.uri,
          name: `plan-image.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      await api.patch(`/admin/plans/${editingPlan.id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Sucesso", "Plano atualizado com sucesso!");
      setMode("list");
      fetchPlans();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      Alert.alert("Erro", "Houve um problema ao sincronizar com a Stripe.");
    } finally {
      setSaving(false);
    }
  };

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
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#E2E8F0", width: 40 }}
      backgroundStyle={{ borderRadius: 32 }}
      onClose={onClose}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {mode === "form" ? (
            <TouchableOpacity onPress={() => setMode("list")} style={styles.backBtn}>
              <ArrowLeft size={20} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconContainer}>
              <CreditCard size={24} color="#1E293B" />
            </View>
          )}

          <Text style={styles.title}>{mode === "list" ? "Planos" : "Editar plano"}</Text>

          <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={styles.closeBtn}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {mode === "list" ? (
          <View style={styles.listContainer}>
            <Text style={styles.subtitle}>Planos registrados na Stripe</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#BBF246" style={{ marginTop: 40 }} />
            ) : (
              plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  onPress={() => handleEdit(plan)}
                  activeOpacity={0.7}
                >
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDesc} numberOfLines={2}>
                      {plan.description || "Sem descrição definida na Stripe."}
                    </Text>
                    <View style={styles.planMeta}>
                      <Text style={styles.planPrice}>R$ {plan.price.toFixed(2)}</Text>
                      <Text style={styles.planInterval}>
                        /{" "}
                        {plan.interval === "month"
                          ? "mês"
                          : plan.interval === "year"
                            ? "ano"
                            : "cobrança única"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.editCircle}>
                    <Edit2 size={16} color="#1E293B" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Plano</Text>
              <View style={styles.inputWrapper}>
                <Type size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
                  placeholder="Ex: Plano Premium"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preço (R$)</Text>
              <View style={styles.inputWrapper}>
                <DollarSign size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(t) => setFormData((p) => ({ ...p, price: t }))}
                  keyboardType="numeric"
                  placeholder="29.90"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.helperText}>Isso criará um novo preço padrão na Stripe.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { height: 120, alignItems: "flex-start", paddingTop: 16 },
                ]}
              >
                <FileText size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { height: "100%", textAlignVertical: "top" }]}
                  value={formData.description}
                  onChangeText={(t) => setFormData((p) => ({ ...p, description: t }))}
                  multiline
                  placeholder="Benefícios e detalhes do plano..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Imagem do Plano</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.9}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                ) : editingPlan?.images && editingPlan.images.length > 0 ? (
                  <Image source={{ uri: editingPlan.images[0] }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Upload size={32} color="#94A3B8" />
                    <Text style={styles.imagePlaceholderText}>Trocar Imagem do Plano</Text>
                  </View>
                )}
                {(selectedImage || (editingPlan?.images && editingPlan.images.length > 0)) && (
                  <View style={styles.changeBadge}>
                    <Upload size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#1E293B" />
              ) : (
                <Text style={styles.saveBtnText}>Sincronizar com Stripe</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "#BBF24615",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  subtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 22,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: { gap: 12 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 17, fontWeight: "800", color: "#1E293B", marginBottom: 6 },
  planDesc: { fontSize: 14, color: "#64748B", lineHeight: 18, marginBottom: 12 },
  planMeta: { flexDirection: "row", alignItems: "baseline" },
  planPrice: { fontSize: 18, fontWeight: "900", color: "#34C759" },
  planInterval: { fontSize: 12, color: "#94A3B8", marginLeft: 4, fontWeight: "600" },
  editCircle: {
    width: 36,
    height: 36,
    backgroundColor: "#BBF246",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  formContainer: { gap: 20 },
  inputGroup: {},
  label: { fontSize: 14, fontWeight: "800", color: "#1E293B", marginBottom: 10, marginLeft: 2 },
  helperText: { fontSize: 11, color: "#94A3B8", marginTop: 6, marginLeft: 4, fontWeight: "500" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 64,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  inputIcon: { marginRight: 15 },
  input: { flex: 1, color: "#1E293B", fontWeight: "700", fontSize: 16 },
  imagePicker: {
    height: 180,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    overflow: "hidden",
    position: "relative",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  imagePlaceholderText: { color: "#94A3B8", fontWeight: "700", fontSize: 14 },
  changeBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#1E293B",
    padding: 8,
    borderRadius: 12,
  },
  saveBtn: {
    backgroundColor: "#BBF246",
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { color: "#1E293B", fontWeight: "900", fontSize: 17, letterSpacing: 0.5 },
});

StripePlansSheet.displayName = "StripePlansSheet";

export default StripePlansSheet;
