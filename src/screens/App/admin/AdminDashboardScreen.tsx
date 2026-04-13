import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Linking,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../@types/routes";
import { useAuth } from "../../../hooks/useAuth";
import {
  TrendingUp,
  Calendar,
  Users,
  Clock,
  Filter,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  User,
  CheckCircle,
  XCircle,
  Bell,
  X,
  CreditCard,
  Target,
  Activity,
  Dumbbell,
  Building2,
  Layers,
  Search,
  Mail,
  Shield,
  MoreVertical,
  Star,
  Zap,
  Trash2,
  Edit3,
  Save,
  Plus,
  Link,
  UserPlus,
  Unlink,
  MapPin,
  PhoneCall,
  Phone,
  MessageSquare,
  ArrowRight,
  Map,
  Check,
  ShieldCheck,
} from "lucide-react-native";
import { CartesianChart, Line, Area, useChartPressState, PolarChart, Pie } from "victory-native";
import { LinearGradient as SkiaGradient, vec, Circle } from "@shopify/react-native-skia";
import BackButton from "../../../components/BackButton";
import { api } from "../../../services/api";
import * as ImagePicker from "expo-image-picker";
import DecisionBI from "./components/DecisionBI";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import CommunityManagementSheet, {
  CommunityManagementSheetRef,
} from "./[protected]/components/CommunityManagementSheet";

const PolarChartAny = PolarChart as any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPI {
  label: string;
  value: string | number;
  percent: number;
  color: string;
}

interface PendingAppointment {
  id_agendamento: number;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  notas: string | null;
  created_at: string;
  pagamento_verificado: boolean;
  user_name: string;
  user_avatar: string | null;
}

interface PersonalClient {
  id_us: number;
  nome: string;
  avatar_url: string | null;
  email: string;
  last_appointment: string | null;
  total_appointments: number;
}

interface DashboardData {
  trainer: { nome: string; avatar_url: string | null; plan: string };
  kpis: {
    totalMonth: number;
    pending: number;
    upcoming: number;
    clients: number;
    revenue: number;
  };
  revenue: {
    current: number;
    growth: string;
  };
  chartData: { label: string; total: number }[];
  statusDistribution: { label: string; count: number; color: string }[];
  appointments: PendingAppointment[];
  pending: PendingAppointment[];
  clients: PersonalClient[];
  retention: {
    rate: number;
    count: number;
    total: number;
  };
  reviews?: {
    id: number;
    ratingProfessional: number;
    ratingTraining: number;
    comment: string;
    created_at: string;
    user_name: string;
    user_avatar: string;
    appointment_date: string;
    appointment_time: string;
  }[];
  receiptHistory?: {
    id_agendamento: number;
    data_agendamento: string;
    hora_inicio: string;
    valor_recebido: number;
    receipt_url: string;
    user_name: string;
    user_avatar: string;
  }[];
  planDistribution?: { label: string; count: number; color: string }[];
  churn?: { rate: string; status: string; count: number };
  ltv?: { value: number; arpu: number };
  churnBreakdown?: { label: string; value: string }[];
  ltvBreakdown?: { plan: string; val: number }[];
  topUnits?: { name: string; members: number; rev: number; grow: string }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { state, isActive } = useChartPressState({ x: "", y: { total: 0 } });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"day" | "month" | "year">("day");
  const [data, setData] = useState<DashboardData | null>(null);

  // Estados de Filtro
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tempStatus, setTempStatus] = useState<string>("all");

  const filterSheetRef = React.useRef<BottomSheet>(null);
  const appointmentsSheetRef = React.useRef<BottomSheet>(null);
  const usersSheetRef = React.useRef<BottomSheet>(null);
  const trainersSheetRef = React.useRef<BottomSheet>(null);
  const gymsSheetRef = React.useRef<BottomSheet>(null);
  const plansSheetRef = React.useRef<BottomSheet>(null);
  const expiringSheetRef = React.useRef<BottomSheet>(null);
  const editPlanSheetRef = React.useRef<BottomSheet>(null);
  const gymDetailSheetRef = React.useRef<BottomSheet>(null);
  const linkTrainerSheetRef = React.useRef<BottomSheet>(null);
  const createGymSheetRef = React.useRef<BottomSheet>(null);
  const editGymSheetRef = React.useRef<BottomSheet>(null);
  const revenueSheetRef = React.useRef<BottomSheet>(null);
  const approvalsSheetRef = React.useRef<BottomSheet>(null);
  const clientsSheetRef = React.useRef<BottomSheet>(null);
  const performanceSheetRef = React.useRef<BottomSheet>(null);
  const reviewsSheetRef = React.useRef<BottomSheet>(null);
  const paymentsSheetRef = React.useRef<BottomSheet>(null);
  const evaluationSheetRef = React.useRef<BottomSheet>(null);
  const historySheetRef = React.useRef<BottomSheet>(null);
  const activePlansSheetRef = React.useRef<BottomSheet>(null);
  const userDetailSheetRef = React.useRef<BottomSheet>(null);
  // Ref para Gestão de Comunidades (componente dedicado)
  const adminCommSheetRef = React.useRef<CommunityManagementSheetRef>(null);

  // Novos Refs para BI Estratégico
  const churnDetailSheetRef = React.useRef<BottomSheet>(null);
  const ltvDetailSheetRef = React.useRef<BottomSheet>(null);
  const revenueMixSheetRef = React.useRef<BottomSheet>(null);
  const unitAuditSheetRef = React.useRef<BottomSheet>(null);

  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<PersonalClient | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "cliente_pf" | "cliente_pj" | "admin"
  >("all");
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    description: "",
    interval: "month",
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState("");
  const [selectedGym, setSelectedGym] = useState<any | null>(null);
  const [gymTrainers, setGymTrainers] = useState<any[]>([]);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [trainerSearchResults, setTrainerSearchResults] = useState<any[]>([]);
  const [googleSearchQuery, setGoogleSearchQuery] = useState("");
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [gymForm, setGymForm] = useState<any>({});
  const [adminTrainers, setAdminTrainers] = useState<any[]>([]);
  const [trainerListSearchQuery, setTrainerListSearchQuery] = useState("");
  const [trainerListStatusFilter, setTrainerListStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [adminGyms, setAdminGyms] = useState<any[]>([]);
  const [gymListSearchQuery, setGymListSearchQuery] = useState("");
  const [gymListStatusFilter, setGymListStatusFilter] = useState<"all" | "active" | "blocked">(
    "all"
  );

  const filteredAdminGyms = useMemo(() => {
    return adminGyms.filter((g) => {
      const matchesSearch =
        (g.nome || "").toLowerCase().includes(gymListSearchQuery.toLowerCase()) ||
        (g.endereco || g.endereco_completo || "")
          .toLowerCase()
          .includes(gymListSearchQuery.toLowerCase());

      const matchesStatus =
        gymListStatusFilter === "all" ||
        (gymListStatusFilter === "active" && g.ativo) ||
        (gymListStatusFilter === "blocked" && !g.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [adminGyms, gymListSearchQuery, gymListStatusFilter]);

  const [adminExpiring, setAdminExpiring] = useState<any[]>([]);
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);

  // Contador de comunidades para exibição no painel
  const [adminCommunitiesCount, setAdminCommunitiesCount] = useState(0);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expiringSearchQuery, setExpiringSearchQuery] = useState("");
  const [expiringPlanFilter, setExpiringPlanFilter] = useState<
    "all" | "FREE" | "premium" | "familia"
  >("all");

  const trainersAvailableToLink = useMemo(() => {
    // Pegamos todos os adminTrainers que NÃO estão em gymTrainers (já vinculados)
    const linkedIds = new Set(gymTrainers.map((t) => t.id_us));

    return adminTrainers
      .filter((t) => !linkedIds.has(t.id_us))
      .filter((t) => {
        if (!trainerSearchQuery) return true;
        const query = trainerSearchQuery.toLowerCase();
        return (
          (t.nome || "").toLowerCase().includes(query) ||
          (t.email || "").toLowerCase().includes(query)
        );
      });
  }, [adminTrainers, gymTrainers, trainerSearchQuery]);

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      const matchesSearch =
        u.nome.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase());

      const matchesStatus =
        userStatusFilter === "all" ||
        (userStatusFilter === "active" && u.ativo) ||
        (userStatusFilter === "blocked" && !u.ativo);

      const r = String(u.role || u.tipo || u.role_name || "").toLowerCase();
      const isAdmin = r.includes("admin") || Number(u.id_us) === 15;
      const isPJ =
        r.includes("personal") ||
        r.includes("trainer") ||
        r.includes("pj") ||
        (u.cref && String(u.cref).trim().length > 1) ||
        [16, 19, 20, 21, 22].includes(Number(u.id_us));

      let matchesRole = true;
      if (userRoleFilter === "admin") matchesRole = isAdmin;
      else if (userRoleFilter === "cliente_pj") matchesRole = isPJ;
      else if (userRoleFilter === "cliente_pf") matchesRole = true; // Exibe todos no card 'Todos'

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [adminUsers, userSearchQuery, userStatusFilter, userRoleFilter]);

  const filteredAdminTrainers = useMemo(() => {
    return adminTrainers.filter((u) => {
      const matchesSearch =
        u.nome.toLowerCase().includes(trainerListSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(trainerListSearchQuery.toLowerCase());

      const matchesStatus =
        trainerListStatusFilter === "all" ||
        (trainerListStatusFilter === "active" && u.ativo) ||
        (trainerListStatusFilter === "blocked" && !u.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [adminTrainers, trainerListSearchQuery, trainerListStatusFilter]);

  const [activePlanSearchQuery, setActivePlanSearchQuery] = useState("");
  const [activePlanFilter, setActivePlanFilter] = useState<"all" | "FREE" | "premium" | "familia">(
    "all"
  );

  const filteredActivePlansUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      const matchesSearch =
        u.nome.toLowerCase().includes(activePlanSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(activePlanSearchQuery.toLowerCase());

      const planType = (u.plan || "").toLowerCase();
      const matchesPlan =
        activePlanFilter === "all" ||
        (activePlanFilter === "FREE" &&
          (!planType ||
            planType === "free" ||
            (planType !== "premium" && planType !== "familia"))) ||
        (activePlanFilter === "premium" && planType === "premium") ||
        (activePlanFilter === "familia" && planType === "familia");

      return matchesSearch && matchesPlan;
    });
  }, [adminUsers, activePlanSearchQuery, activePlanFilter]);

  const rawExpiringUsers = useMemo(() => {
    return adminExpiring.length > 0
      ? adminExpiring
      : adminUsers.filter((u) => {
          const p = (u.plan || u.plano || "").toLowerCase();
          return (
            p.includes("premium") ||
            p.includes("gold") ||
            p.includes("familia") ||
            p.includes("family")
          );
        });
  }, [adminExpiring, adminUsers]);

  const filteredExpiringUsers = useMemo(() => {
    let filtered = rawExpiringUsers;

    if (expiringPlanFilter !== "all") {
      filtered = filtered.filter((u) => {
        const plan = (u.plan || u.plano || "").toLowerCase();
        if (expiringPlanFilter === "FREE")
          return (
            !plan ||
            plan === "free" ||
            (!plan.includes("premium") &&
              !plan.includes("gold") &&
              !plan.includes("familia") &&
              !plan.includes("family"))
          );
        if (expiringPlanFilter === "premium")
          return plan.includes("premium") || plan.includes("gold");
        if (expiringPlanFilter === "familia")
          return plan.includes("familia") || plan.includes("family");
        return true;
      });
    }

    if (expiringSearchQuery.trim()) {
      const query = expiringSearchQuery.toLowerCase();
      filtered = filtered.filter((u) => {
        return (
          (u.nome || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [rawExpiringUsers, expiringSearchQuery, expiringPlanFilter]);

  // Form de Avaliação
  const [notaIntensidade, setNotaIntensidade] = useState(3);
  const [comentarioTecnico, setComentarioTecnico] = useState("");
  const [notaAluno, setNotaAluno] = useState(5);

  const fetchData = useCallback(async (tab: string = "month", status: string = "all") => {
    try {
      const response = await api.get(`/admin/dashboard-stats`, {
        params: { tab, status },
      });
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar Dashboard Admin:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab, filterStatus);
    fetchAdminPlans(false); // Carrega contador em background logo no início
    // Carrega contador de comunidades para exibição no painel
    api
      .get("/comunidades")
      .then((r) => {
        const list = r.data.data || r.data;
        setAdminCommunitiesCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
  }, [fetchData, activeTab, filterStatus]);

  const fetchAdminUsers = async () => {
    try {
      setLoadingSheet(true);
      usersSheetRef.current?.expand();
      const response = await api.get("/admin/all-users");
      setAdminUsers(response.data.users || []);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const fetchActivePlansList = async () => {
    try {
      setLoadingSheet(true);
      activePlansSheetRef.current?.expand();
      if (adminUsers.length === 0) {
        const response = await api.get("/admin/all-users");
        setAdminUsers(response.data.users || []);
      }
    } catch (err) {
      console.error("Erro ao buscar usuarios para planos:", err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const fetchAdminTrainers = async (silent: boolean = false) => {
    try {
      setLoadingSheet(true);
      if (!silent) trainersSheetRef.current?.expand();
      const response = await api.get("/admin/trainers");
      setAdminTrainers(response.data.users || []);
    } catch (err) {
      console.error("Erro ao buscar personais:", err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const fetchAdminGyms = async () => {
    try {
      setLoadingSheet(true);
      gymsSheetRef.current?.expand();
      const response = await api.get("/admin/gyms");
      setAdminGyms(response.data.data || []);
    } catch (err) {
      console.error("Erro ao buscar academias:", err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const fetchAdminExpiring = async () => {
    try {
      setLoadingSheet(true);
      expiringSheetRef.current?.expand();

      // Busca paralela para garantir que temos dados mesmo que um endpoint venha vazio
      const [expResp, usersResp] = await Promise.all([
        api.get("/admin/expiring-users"),
        adminUsers.length === 0
          ? api.get("/admin/all-users")
          : Promise.resolve({ data: { users: adminUsers } }),
      ]);

      setAdminExpiring(expResp.data.users || []);
      if (adminUsers.length === 0 && usersResp.data.users) {
        setAdminUsers(usersResp.data.users);
      }
    } catch (err) {
      console.error("Erro ao buscar planos a vencer:", err);
    } finally {
      setLoadingSheet(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const fetchAdminPlans = async (shouldExpand: boolean = true) => {
    try {
      if (shouldExpand) {
        setLoadingSheet(true);
        plansSheetRef.current?.expand();
      }
      const response = await api.get("/plans");
      setAdminPlans(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
    } finally {
      if (shouldExpand) setLoadingSheet(false);
    }
  };

  const openEditPlan = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        price: String(plan.price),
        description: plan.description || "",
        interval: plan.interval || "month",
        features: Array.isArray(plan.features)
          ? plan.features
          : plan.features
            ? JSON.parse(plan.features)
            : [],
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "",
        price: "",
        description: "",
        interval: "month",
        features: [],
      });
    }
    editPlanSheetRef.current?.expand();
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setPlanForm((f) => ({ ...f, features: [...f.features, newFeature.trim()] }));
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setPlanForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }));
  };

  const savePlanEdits = async () => {
    try {
      if (!planForm.name || !planForm.price) {
        Alert.alert("Erro", "Nome e preço são obrigatórios.");
        return;
      }

      setLoadingSheet(true);
      const payload = {
        name: planForm.name,
        price: parseFloat(planForm.price),
        description: planForm.description,
        interval: planForm.interval,
        features: JSON.stringify(planForm.features),
      };

      let response;
      if (editingPlan) {
        response = await api.patch(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        response = await api.post(`/admin/plans`, payload);
      }

      if (response.data.success) {
        Alert.alert("Sucesso", editingPlan ? "Plano atualizado!" : "Plano criado com sucesso!");
        editPlanSheetRef.current?.close();
        fetchAdminPlans();
      }
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setLoadingSheet(false);
    }
  };

  const deletePlan = (planId: string, planName: string) => {
    Alert.alert(
      "Arquivar Plano",
      `Deseja realmente arquivar o plano "${planName}"? Ele não aparecerá mais para novas vendas no Stripe.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingSheet(true);
              const response = await api.delete(`/admin/plans/${planId}`);
              if (response.data.success) {
                Alert.alert("Sucesso", "Plano arquivado com sucesso!");
                fetchAdminPlans();
              }
            } catch (err) {
              Alert.alert("Erro", "Não foi possível arquivar o plano.");
            } finally {
              setLoadingSheet(false);
            }
          },
        },
      ]
    );
  };

  // --- GESTÃO DE ACADEMIAS & VÍNCULOS ---
  const searchGoogleGyms = async (query: string) => {
    setGoogleSearchQuery(query);
    if (query.length < 3) {
      setGoogleResults([]);
      return;
    }
    try {
      setIsSearchingGoogle(true);
      const response = await api.get(`/admin/gyms/google-search?query=${query}`);
      if (response.data.success) {
        setGoogleResults(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro busca Google:", err);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const selectGoogleGym = async (placeId: string) => {
    try {
      setLoadingSheet(true);
      const response = await api.get(`/admin/gyms/google-details/${placeId}`);
      if (response.data.success) {
        setGymForm(response.data.data);
        // Fecha busca e deixa o formulário de criação "em espera"
        // Ou abre direto a confirmação
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível carregar detalhes da academia.");
    } finally {
      setLoadingSheet(false);
    }
  };

  const saveNewGym = async () => {
    try {
      setLoadingSheet(true);
      const response = await api.post("/admin/gyms", gymForm);
      if (response.data.success) {
        Alert.alert("Sucesso", "Academia cadastrada com sucesso!");
        createGymSheetRef.current?.close();
        fetchAdminGyms();
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível cadastrar a academia.");
    } finally {
      setLoadingSheet(false);
    }
  };

  const toggleGymStatus = async (gymId: number, currentName: string, isCurrentlyAtivo: boolean) => {
    const action = isCurrentlyAtivo ? "Bloquear" : "Ativar";

    Alert.alert(
      "Confirmar Ação",
      `Deseja realmente ${action.toLowerCase()} a academia ${currentName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action,
          style: isCurrentlyAtivo ? "destructive" : "default",
          onPress: async () => {
            try {
              const response = await api.patch(`/admin/gyms/${gymId}/status`);
              if (response.data.success) {
                setAdminGyms((prev) =>
                  prev.map((g) =>
                    g.id_academia === gymId ? { ...g, ativo: !isCurrentlyAtivo } : g
                  )
                );
                if (selectedGym?.id_academia === gymId) {
                  setSelectedGym((prev: any) => ({ ...prev, ativo: !isCurrentlyAtivo }));
                }
                Alert.alert("Sucesso", `Academia ${action.toLowerCase()}da com sucesso!`);
              }
            } catch (err) {
              console.error("Erro ao alternar status da academia:", err);
              Alert.alert("Erro", "Não foi possível alterar o status da academia.");
            }
          },
        },
      ]
    );
  };

  const deleteGym = (gymId: number, gymName: string) => {
    Alert.alert(
      "Excluir Academia",
      `Deseja realmente excluir "${gymName}"? Esta ação removerá também todos os vínculos de profissionais.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingSheet(true);
              const response = await api.delete(`/admin/gyms/${gymId}`);
              if (response.data.success) {
                fetchAdminGyms();
              }
            } catch (err) {
              Alert.alert("Erro", "Não foi possível excluir.");
            } finally {
              setLoadingSheet(false);
            }
          },
        },
      ]
    );
  };

  const openUserDetail = (u: any) => {
    setSelectedUserDetail(u);
    userDetailSheetRef.current?.expand();
  };

  const openGymDetails = async (gym: any) => {
    setSelectedGym(gym);
    gymDetailSheetRef.current?.expand();
    fetchGymTrainers(gym.id_academia);
  };

  const fetchGymTrainers = async (gymId: number) => {
    try {
      setLoadingSheet(true);
      const response = await api.get(`/admin/gyms/${gymId}/trainers`);
      if (response.data.success) {
        setGymTrainers(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar treidadores da academia:", err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const searchTrainersToLink = (query: string) => {
    setTrainerSearchQuery(query);
  };

  const linkTrainer = async (trainerId: number) => {
    if (!selectedGym) return;
    try {
      const response = await api.post(`/admin/gyms/${selectedGym.id_academia}/trainers`, {
        trainer_id: trainerId,
      });
      if (response.data.success) {
        Alert.alert("Sucesso", "Profissional vinculado com sucesso!");
        fetchGymTrainers(selectedGym.id_academia);
        linkTrainerSheetRef.current?.close();
        fetchAdminGyms(); // Atualiza contador na lista
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível vincular o profissional.");
    }
  };

  const unlinkTrainer = (trainerId: number, trainerName: string) => {
    if (!selectedGym) return;
    Alert.alert(
      "Desvincular Profissional",
      `Deseja realmente remover o vínculo de ${trainerName} com esta academia?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete(
                `/admin/gyms/${selectedGym.id_academia}/trainers/${trainerId}`
              );
              if (response.data.success) {
                fetchGymTrainers(selectedGym.id_academia);
                fetchAdminGyms();
              }
            } catch (err) {
              Alert.alert("Erro", "Não foi possível desvincular.");
            }
          },
        },
      ]
    );
  };

  const toggleUserStatus = async (userId: number) => {
    // Trava de Auto-Bloqueio (Safe-Lock para Admins)
    if (userId === Number(user?.id_us)) {
      Alert.alert(
        "Ação Negada",
        "Você não pode bloquear ou desativar sua própria conta de administrador."
      );
      return;
    }

    const userToToggle = adminUsers.find((u) => u.id_us === userId);
    const isBlocking = userToToggle?.ativo;

    const performToggle = async () => {
      try {
        const response = await api.patch(`/admin/users/${userId}/toggle-active`);
        if (response.data.success) {
          setAdminUsers((prev) =>
            prev.map((u) => (u.id_us === userId ? { ...u, ativo: response.data.ativo } : u))
          );
          if (selectedUserDetail?.id_us === userId) {
            setSelectedUserDetail((prev: any) => ({ ...prev, ativo: response.data.ativo }));
          }
        }
      } catch (err) {
        Alert.alert("Erro", "Não foi possível alterar o status do usuário.");
      }
    };

    if (isBlocking) {
      Alert.alert(
        "Confirmar Bloqueio",
        `Deseja realmente bloquear o acesso de ${userToToggle.nome}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Bloquear", style: "destructive", onPress: performToggle },
        ]
      );
    } else {
      performToggle();
    }
  };

  const performPlanChange = async (userId: number, newPlan: string) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/plan`, { plan: newPlan });
      if (response.data.success) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id_us === userId ? { ...u, plan: newPlan, role: u.role } : u))
        );
        if (selectedUserDetail?.id_us === userId) {
          setSelectedUserDetail((prev: any) => ({ ...prev, plan: newPlan }));
        }
        fetchData(activeTab, filterStatus);
        Alert.alert("Sucesso", `O plano de foi alterado para ${newPlan.toUpperCase()}.`);
      }
    } catch (err) {
      console.error("Erro ao mudar plano:", err);
      Alert.alert("Erro", "Não foi possível alterar o plano.");
    }
  };

  const changeUserPlan = (u: any) => {
    Alert.alert("Gerenciar Assinatura", `Alterar plano de ${u.nome}:`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Free", onPress: () => performPlanChange(u.id_us, "FREE") },
      { text: "Premium", onPress: () => performPlanChange(u.id_us, "premium") },
      { text: "Família", onPress: () => performPlanChange(u.id_us, "familia") },
    ]);
  };

  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  const changeUserRole = async (userId: number, newRole: string) => {
    if (userId === Number(user?.id_us)) {
      Alert.alert("Operação Negada", "Você não pode alterar seu próprio nível de acesso.");
      return;
    }

    const performUpdate = async () => {
      try {
        setUpdatingRoleId(userId);
        const response = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
        if (response.status === 200 || response.data?.success) {
          setAdminUsers((prev) =>
            prev.map((u) => (u.id_us === userId ? { ...u, role: newRole } : u))
          );
          // Recarregar KPIs para atualizar os contadores no topo
          fetchData(activeTab, filterStatus);
          Alert.alert("Sucesso", "Papel do usuário atualizado com sucesso!");
        }
      } catch (err) {
        console.error("Erro ao mudar papel:", err);
        Alert.alert("Erro", "Não foi possível atualizar o papel.");
      } finally {
        setUpdatingRoleId(null);
      }
    };

    if (newRole === "admin") {
      Alert.alert("🛡️ CONCEDER PODER ADMIN", "Confirmar promoção para Administrador?", [
        { text: "Cancelar", style: "cancel" },
        { text: "CONFIRMAR", style: "destructive", onPress: performUpdate },
      ]);
    } else {
      performUpdate();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(activeTab, filterStatus);
  }, [fetchData, activeTab, filterStatus]);

  const handleAction = async (id: number, status: string) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      Alert.alert(
        "Sucesso",
        status === "confirmado" ? "Agendamento aprovado!" : "Agendamento recusado."
      );
      fetchData(activeTab, filterStatus);
    } catch {
      Alert.alert("Erro", "Falha ao processar ação.");
    }
  };

  const openClientHistory = async (client: PersonalClient) => {
    setSelectedClient(client);
    setFetchingHistory(true);
    historySheetRef.current?.expand();
    try {
      const response = await api.get(`/admin/clients/${client.id_us}/history`);
      if (response.data.success) {
        setClientHistory(response.data.history);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o histórico.");
    } finally {
      setFetchingHistory(false);
    }
  };

  const openEvaluation = (appt: any) => {
    setSelectedAppt(appt);
    setNotaIntensidade(appt.nota_intensidade || 3);
    setComentarioTecnico(appt.comentario_tecnico || "");
    setNotaAluno(appt.nota_aluno || 5);
    evaluationSheetRef.current?.expand();
  };

  const submitEvaluation = async () => {
    if (!selectedAppt) return;
    try {
      await api.post(`/personal/workouts/evaluation`, {
        id_agendamento: selectedAppt.id_agendamento,
        nota_intensidade: notaIntensidade,
        comentario_tecnico: comentarioTecnico,
        nota_aluno: notaAluno,
      });
      Alert.alert("Sucesso", "Avaliação salva com sucesso!");
      evaluationSheetRef.current?.close();
      // Recarregar histórico
      if (selectedClient) openClientHistory(selectedClient);
      fetchData(activeTab, filterStatus);
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar avaliação.");
    }
  };

  const openFilter = () => {
    setTempStatus(filterStatus);
    filterSheetRef.current?.expand();
  };

  const applyFilters = () => {
    setFilterStatus(tempStatus);
    fetchData(activeTab, tempStatus);
    filterSheetRef.current?.close();
  };

  const handleUploadReceipt = async (apptId: number) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão Negada",
          "Precisamos de acesso às suas fotos para enviar o comprovante."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setIsUploading(true);

        const formData = new FormData();
        const fileToUpload = {
          uri: Platform.OS === "ios" ? selectedImage.uri.replace("file://", "") : selectedImage.uri,
          name: "receipt.jpg",
          type: "image/jpeg",
        } as any;

        formData.append("receipt", fileToUpload);

        const response = await api.post(`/personal/appointments/${apptId}/receipt`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          Alert.alert(
            "Sucesso",
            `Comprovante validado pela IA!\nValor lido: R$ ${response.data.data.amount}\nPagador: ${response.data.data.payer || "Não identificado"}`
          );
          fetchData(activeTab, filterStatus);
          paymentsSheetRef.current?.close();
        }
      }
    } catch (error: any) {
      console.error("Erro no upload do comprovante:", error);
      Alert.alert("Erro", error.response?.data?.error || "Falha ao processar comprovante.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const performanceData = useMemo(() => {
    if (!data || !data.statusDistribution || data.statusDistribution.length === 0)
      return { rate: 0, status: "", color: "#94A3B8", bg: "transparent" };

    const distro = data.statusDistribution;
    const total = distro.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const confirmed = distro.find((d) => d.label?.toLowerCase() === "confirmado")?.count || 0;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    if (rate >= 90) return { rate, status: "Excelente", color: "#10B981", bg: "#DCFCE7" };
    if (rate >= 70) return { rate, status: "Bom", color: "#6366F1", bg: "#EEF2FF" };
    if (rate >= 50) return { rate, status: "Regular", color: "#F59E0B", bg: "#FEF3C7" };
    return { rate, status: "Atenção", color: "#EF4444", bg: "#FEE2E2" };
  }, [data]);

  const kpisData = useMemo(() => {
    if (!data || !Array.isArray(data.kpis)) return [];
    return data.kpis;
  }, [data]);

  const renderKPI = (item: any) => {
    const Icon =
      item.id === "plans" || item.id === "stripe_plans"
        ? CreditCard
        : item.id === "users"
          ? Users
          : item.id === "expiring"
            ? Calendar
            : item.id === "trainers"
              ? User
              : item.id === "gyms"
                ? Building2
                : Layers;

    const isPositive = !item.grow || item.grow.startsWith("+");
    const growValue = item.grow || "+0%";

    return (
      <TouchableOpacity
        key={item.label}
        style={styles.kpiCard}
        activeOpacity={0.7}
        onPress={() => {
          const labelLower = (item.label || "").toLowerCase();

          // Se clicou em Planos Ativos -> Abre a nova aba focada em Métrica de Assinantes
          if (labelLower.includes("planos ativos") || item.id === "active_plans") {
            fetchActivePlansList();
            return;
          }

          // Se clicou em Planos (Stripe) -> Abre o sheet de produtos da Stripe
          if (
            (item.id === "plans" || item.id === "stripe_plans") &&
            !labelLower.includes("ativo")
          ) {
            fetchAdminPlans();
            return;
          }

          // Outros Mapeamentos
          if (item.id === "users") fetchAdminUsers();
          else if (item.id === "expiring") fetchAdminExpiring();
          else if (item.id === "trainers") fetchAdminTrainers();
          else if (item.id === "gyms") fetchAdminGyms();
        }}
      >
        <LinearGradient
          colors={[item.color + "12", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.kpiIconBox, { backgroundColor: item.color + "18" }]}>
          <Icon size={20} color={item.color} />
        </View>
        <Text style={styles.kpiValue}>
          {(() => {
            const labelLower = (item.label || "").toLowerCase();
            // Bifurcação 1: Planos Ativos (Assinantes Pagantes Reais)
            if (labelLower.includes("planos ativos") || item.id === "active_plans") {
              return adminUsers.filter((u) => {
                const p = (u.plan || u.plano || "").toLowerCase();
                return (
                  p.includes("premium") ||
                  p.includes("gold") ||
                  p.includes("familia") ||
                  p.includes("family")
                );
              }).length;
            }
            // Bifurcação 2: Planos Gerais (Produtos Cadastrados no Stripe)
            if (
              (item.id === "plans" || item.id === "stripe_plans") &&
              !labelLower.includes("ativo")
            ) {
              return adminPlans.length;
            }
            // Fallback: Default backend value
            return item.value;
          })()}
        </Text>
        <Text style={styles.kpiLabel}>{item.label}</Text>
        <View style={styles.kpiGrowRow}>
          {isPositive ? (
            <ArrowUpRight size={12} color="#10B981" />
          ) : (
            <ArrowDownRight size={12} color="#EF4444" />
          )}
          <Text style={[styles.kpiGrowText, { color: isPositive ? "#10B981" : "#EF4444" }]}>
            {growValue}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <BackButton />
            <Text style={styles.headerTitle}>Dashboard</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={openFilter}>
                <Filter size={20} color={filterStatus !== "all" ? "#10B981" : "#1E293B"} />
                {filterStatus !== "all" && <View style={styles.filterActiveDot} />}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.tabBar}>
            {(["day", "month", "year"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab === "day" ? "Hoje" : tab === "month" ? "Mensal" : "Anual"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
          }
        >
          {/* KPI Grid */}
          <View style={styles.kpiGrid}>{kpisData.map(renderKPI)}</View>

          {/* ── FATURAMENTO ESTIMADO ── */}
          <View style={styles.sectionHeader}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View>
                <Text style={styles.sectionTitle}>Faturamento</Text>
                <Text style={styles.sectionSubtitle}>Baseado em sessões confirmadas</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.revenueValue}>
                  {formatCurrency(data?.revenue.current ?? 0)}
                </Text>
                <Text style={[styles.growthText, { color: "#10B981" }]}>
                  {data?.revenue.growth} vs período ant.
                </Text>
              </View>
            </View>
          </View>

          {/* Gráfico de Volume */}
          <View style={styles.chartCardCustom}>
            <View style={{ height: 180, marginTop: 10 }}>
              {(() => {
                const chartData = data?.chartData || [];

                if (chartData.length === 0) {
                  return (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Activity size={24} color="#CBD5E1" />
                      <Text
                        style={{ fontSize: 13, color: "#94A3B8", marginTop: 8, fontWeight: "600" }}
                      >
                        Sem transações no Stripe para este período
                      </Text>
                    </View>
                  );
                }

                return (
                  <CartesianChart
                    data={chartData}
                    xKey="label"
                    yKeys={["total"]}
                    padding={{ top: 10, bottom: 10, left: 0, right: 0 }}
                    domainPadding={{ top: 20, left: 10, right: 10 }}
                    chartPressState={state}
                  >
                    {({ points, chartBounds }) => (
                      <>
                        <Area
                          points={points.total}
                          y0={chartBounds.bottom}
                          animate={{ type: "timing", duration: 800 }}
                        >
                          <SkiaGradient
                            start={vec(chartBounds.left, chartBounds.top)}
                            end={vec(chartBounds.left, chartBounds.bottom)}
                            colors={["#10B98130", "#10B98100"]}
                          />
                        </Area>
                        <Line
                          points={points.total}
                          color="#10B981"
                          strokeWidth={2.5}
                          animate={{ type: "timing", duration: 800 }}
                        />
                        {isActive && (
                          <Circle
                            cx={state.x.position}
                            cy={state.y.total.position}
                            r={6}
                            color="#10B981"
                          />
                        )}
                      </>
                    )}
                  </CartesianChart>
                );
              })()}
            </View>
          </View>

          {/* ── NOVAS MÉTRICAS DE APOIO À DECISÃO (BI) ── */}
          <DecisionBI
            data={data}
            formatCurrency={formatCurrency}
            onOpenChurn={() => churnDetailSheetRef.current?.expand()}
            onOpenLTV={() => ltvDetailSheetRef.current?.expand()}
            onOpenRevenue={() => revenueMixSheetRef.current?.expand()}
            onOpenUnits={() => unitAuditSheetRef.current?.expand()}
          />

          {/* ── OPERAÇÕES ── */}
          <View style={styles.operationSection}>
            <Text style={styles.sectionTitle}>Operações:</Text>
            <View style={styles.statusList}>
              <TouchableOpacity style={styles.statusItem} onPress={() => fetchAdminUsers()}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#6366F1" }]} />
                  <Text style={styles.statusLabel}>Usuários</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>
                    {kpisData.find((k) => k.id === "users")?.value ?? 0}
                  </Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statusItem} onPress={() => fetchAdminTrainers()}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
                  <Text style={styles.statusLabel}>Personais trainer</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>
                    {kpisData.find((k) => k.id === "trainers")?.value ?? 0}
                  </Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statusItem} onPress={() => fetchAdminGyms()}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={styles.statusLabel}>Academias</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>
                    {kpisData.find((k) => k.id === "gyms")?.value ?? 0}
                  </Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statusItem} onPress={() => fetchAdminPlans()}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#8B5CF6" }]} />
                  <Text style={styles.statusLabel}>Planos</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>{adminPlans.length}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusItem}
                onPress={() => adminCommSheetRef.current?.open()}
              >
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#EC4899" }]} />
                  <Text style={styles.statusLabel}>Comunidades</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>{adminCommunitiesCount}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── SHEET: FILTRO ── */}
        <BottomSheet
          ref={filterSheetRef}
          index={-1}
          snapPoints={["40%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filtrar por Status</Text>
              <TouchableOpacity onPress={() => filterSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status do Agendamento</Text>
              <View style={styles.filterOptionsGrid}>
                {["all", "confirmado", "pendente", "cancelado"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterOption, tempStatus === st && styles.filterOptionActive]}
                    onPress={() => setTempStatus(st)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        tempStatus === st && styles.filterOptionTextActive,
                      ]}
                    >
                      {st === "all"
                        ? "Todos"
                        : st === "confirmado"
                          ? "Confirmado"
                          : st === "pendente"
                            ? "Pendente"
                            : "Cancelado"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => setTempStatus("all")}>
                <Text style={styles.resetBtnText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: AGENDAMENTOS ── */}
        <BottomSheet
          ref={appointmentsSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Todos Agendamentos</Text>
              <TouchableOpacity onPress={() => appointmentsSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 10 }}>
              {data?.appointments?.map((item) => (
                <View key={item.id_agendamento} style={styles.pendingCard}>
                  <View style={styles.pendingRow}>
                    <Image
                      source={
                        item.user_avatar
                          ? { uri: item.user_avatar }
                          : { uri: "https://via.placeholder.com/40" }
                      }
                      style={styles.avatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.clientName}>{item.user_name}</Text>
                      <Text style={styles.clientMeta}>
                        {item.data_agendamento} • {item.hora_inicio}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === "confirmado"
                              ? "#DCFCE7"
                              : item.status === "pendente"
                                ? "#FEF3C7"
                                : "#FEE2E2",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              item.status === "confirmado"
                                ? "#166534"
                                : item.status === "pendente"
                                  ? "#D97706"
                                  : "#991B1B",
                          },
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              {data?.appointments?.length === 0 && (
                <Text style={styles.emptyTxt}>Nenhum agendamento encontrado.</Text>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: FATURAMENTO ── */}
        <BottomSheet
          ref={revenueSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Extrato de Ganhos</Text>
              <TouchableOpacity onPress={() => revenueSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 10 }}>
              <View style={styles.revenueTotalCard}>
                <Text style={styles.revenueTotalLabel}>Total no Período</Text>
                <Text style={styles.revenueTotalValue}>
                  {formatCurrency(data?.kpis.revenue || 0)}
                </Text>
              </View>
              {data?.appointments
                ?.filter((a) => a.status === "confirmado" || a.status === "concluido")
                .map((item) => (
                  <View key={item.id_agendamento} style={styles.revenueItem}>
                    <View style={styles.revenueItemLeft}>
                      <Text style={styles.revenueItemName}>{item.user_name}</Text>
                      <Text style={styles.revenueItemMeta}>{item.data_agendamento}</Text>
                    </View>
                    <Text style={styles.revenueItemValue}>+ {formatCurrency(100)}</Text>
                  </View>
                ))}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: APROVAÇÕES ── */}
        <BottomSheet
          ref={approvalsSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Pendentes de Aprovação</Text>
              <TouchableOpacity onPress={() => approvalsSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 20 }}>
              {data?.pending?.map((item) => (
                <View key={item.id_agendamento} style={styles.pendingCard}>
                  <View style={styles.pendingRow}>
                    <Image
                      source={
                        item.user_avatar
                          ? { uri: item.user_avatar }
                          : { uri: "https://via.placeholder.com/40" }
                      }
                      style={styles.avatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.clientName}>{item.user_name}</Text>
                      <Text style={styles.clientMeta}>
                        {item.data_agendamento} • {item.hora_inicio}
                      </Text>
                    </View>
                  </View>
                  <View style={{ gap: 12, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[
                        styles.approveBtn,
                        { height: 52, borderRadius: 16, backgroundColor: "#10B981" },
                      ]}
                      onPress={() => handleUploadReceipt(item.id_agendamento)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <CreditCard size={18} color="#fff" />
                          <Text style={[styles.approveTxt, { fontSize: 14 }]}>
                            Confirmar com Comprovante (IA)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.actionBtns}>
                      <TouchableOpacity
                        style={[styles.approveBtn, { backgroundColor: "#F1F5F9", borderWidth: 0 }]}
                        onPress={() => handleAction(item.id_agendamento, "confirmado")}
                      >
                        <CheckCircle size={16} color="#64748B" />
                        <Text style={[styles.approveTxt, { color: "#64748B" }]}>
                          Aprovar Simples
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.refuseBtn}
                        onPress={() => handleAction(item.id_agendamento, "cancelado")}
                      >
                        <X size={16} color="#EF4444" />
                        <Text style={styles.refuseTxt}>Recusar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              {data?.pending?.length === 0 && (
                <Text style={styles.emptyTxt}>Nenhuma aprovação pendente.</Text>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: CLIENTES ── */}
        <BottomSheet
          ref={clientsSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Meus Clientes</Text>
              <TouchableOpacity onPress={() => clientsSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 20 }}>
              {data?.clients?.map((item) => (
                <TouchableOpacity
                  key={item.id_us}
                  style={styles.pendingCard}
                  onPress={() => openClientHistory(item)}
                >
                  <View style={styles.pendingRow}>
                    <Image
                      source={
                        item.avatar_url
                          ? { uri: item.avatar_url }
                          : { uri: "https://via.placeholder.com/40" }
                      }
                      style={styles.avatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.clientName}>{item.nome}</Text>
                      <Text style={styles.clientMeta}>
                        {item.total_appointments} agendamentos • Último:{" "}
                        {item.last_appointment || "Nunca"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
              {data?.clients?.length === 0 && (
                <Text style={styles.emptyTxt}>Nenhum cliente cadastrado.</Text>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: PERFORMANCE ── */}
        <BottomSheet
          ref={performanceSheetRef}
          index={-1}
          snapPoints={["60%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Insights de Performance</Text>
              <TouchableOpacity onPress={() => performanceSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <View
                style={[
                  styles.revenueTotalCard,
                  { width: "100%", backgroundColor: performanceData.color },
                ]}
              >
                <Text style={[styles.revenueTotalLabel, { color: "rgba(255,255,255,0.7)" }]}>
                  Sua taxa de aprovação é
                </Text>
                <Text style={styles.revenueTotalValue}>{performanceData.rate}%</Text>
                <View
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                    Status: {performanceData.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Target size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>
                    Foco no Cliente
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>
                    Você aprovou{" "}
                    {data?.statusDistribution?.find((d) => d.label.toLowerCase() === "confirmado")
                      ?.count || 0}{" "}
                    sessões este mês.
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }}>
                    Tempo de Resposta
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>
                    Mantenha suas notificações ativas para responder rápido.
                  </Text>
                </View>
              </View>

              <View
                style={{ backgroundColor: "#F8FAFC", padding: 16, borderRadius: 20, marginTop: 10 }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#1E293B", marginBottom: 6 }}
                >
                  Dica Pro:
                </Text>
                <Text style={{ fontSize: 12, color: "#64748B", lineHeight: 18 }}>
                  Personais que aprovam agendamentos em menos de 1 hora aumentam sua retenção em até
                  40%.
                </Text>
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: HISTÓRICO DO CLIENTE ── */}
        <BottomSheet
          ref={historySheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.headerTitle}>{selectedClient?.nome || "Histórico"}</Text>
                <Text style={styles.cardSubtitle}>Histórico de Treinos</Text>
              </View>
              <TouchableOpacity onPress={() => historySheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {fetchingHistory ? (
              <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView style={{ marginTop: 20 }}>
                {clientHistory.map((appt) => (
                  <View key={appt.id_agendamento} style={styles.pendingCard}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <Text style={styles.clientName}>
                          {appt.data_agendamento} • {appt.hora_inicio}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                          <View
                            style={[
                              {
                                backgroundColor:
                                  appt.status === "concluido" ? "#10B981" : "#94A3B8",
                                width: 6,
                                height: 6,
                              },
                            ]}
                          />
                          <Text style={{ fontSize: 10, marginLeft: 4, color: "#64748B" }}>
                            {appt.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      {appt.status === "concluido" || appt.status === "confirmado" ? (
                        <TouchableOpacity
                          style={[
                            styles.approveBtn,
                            { paddingHorizontal: 12, height: 32, flex: 0 },
                          ]}
                          onPress={() => openEvaluation(appt)}
                        >
                          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                            {appt.nota_aluno ? "Ver Avaliação" : "Avaliar"}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {appt.comentario_tecnico && (
                      <View
                        style={{
                          marginTop: 10,
                          padding: 10,
                          backgroundColor: "#F8FAFC",
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E293B" }}>
                          Feedback Técnico:
                        </Text>
                        <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                          {appt.comentario_tecnico}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                {clientHistory.length === 0 && (
                  <Text style={styles.emptyTxt}>Nenhum registro encontrado.</Text>
                )}
              </ScrollView>
            )}
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: AVALIAÇÃO DE TREINO ── */}
        <BottomSheet
          ref={evaluationSheetRef}
          index={-1}
          snapPoints={["75%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Avaliação do Treino</Text>
              <TouchableOpacity onPress={() => evaluationSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 10 }}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Intensidade do Treino (1-5)</Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => setNotaIntensidade(num)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: notaIntensidade === num ? "#10B981" : "#F1F5F9",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: notaIntensidade === num ? "#fff" : "#64748B",
                          fontWeight: "800",
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.filterSection, { marginTop: 10 }]}>
                <Text style={styles.filterSectionTitle}>Feedback para o Aluno</Text>
                <View
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderRadius: 16,
                    padding: 16,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Alert.prompt(
                        "Feedback",
                        "O que o aluno pode melhorar?",
                        (text) => setComentarioTecnico(text),
                        "plain-text",
                        comentarioTecnico
                      );
                    }}
                  >
                    <Text
                      style={{ fontSize: 14, color: comentarioTecnico ? "#1E293B" : "#94A3B8" }}
                    >
                      {comentarioTecnico || "Toque aqui para escrever o feedback técnico..."}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.filterSection, { marginTop: 10 }]}>
                <Text style={styles.filterSectionTitle}>Nota do Aluno (Performance)</Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => setNotaAluno(num)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: notaAluno === num ? "#10B981" : "#F1F5F9",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{ color: notaAluno === num ? "#fff" : "#64748B", fontWeight: "800" }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  { marginTop: 20, height: 55, alignSelf: "stretch", flex: 0 },
                ]}
                onPress={submitEvaluation}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.applyBtnText}>Salvar Avaliação</Text>
              </TouchableOpacity>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: AVALIAÇÕES DO PERSONAL ── */}
        <BottomSheet
          ref={reviewsSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Avaliações</Text>
              <TouchableOpacity onPress={() => reviewsSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 20 }}>
              {data?.reviews?.map((item) => {
                const isPositive = (item.ratingProfessional + item.ratingTraining) / 2 >= 4;
                return (
                  <View key={item.id} style={styles.pendingCard}>
                    <View style={styles.pendingRow}>
                      <Image
                        source={
                          item.user_avatar
                            ? { uri: item.user_avatar }
                            : { uri: "https://via.placeholder.com/40" }
                        }
                        style={styles.avatar}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.clientName}>{item.user_name}</Text>
                        <Text style={styles.clientMeta}>
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isPositive ? "#DCFCE7" : "#FEF3C7" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isPositive ? "#166534" : "#D97706" },
                          ]}
                        >
                          ★ {((item.ratingProfessional + item.ratingTraining) / 2).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        marginTop: 10,
                        padding: 10,
                        backgroundColor: "#F8FAFC",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#F1F5F9",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B" }}>
                          Profissional:{" "}
                          <Text style={{ color: "#1E293B" }}>{item.ratingProfessional}</Text>/5
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B" }}>
                          Treino: <Text style={{ color: "#1E293B" }}>{item.ratingTraining}</Text>/5
                        </Text>
                      </View>
                      {item.comment ? (
                        <Text
                          style={{ fontSize: 12, color: "#1E293B", lineHeight: 18, marginTop: 4 }}
                        >
                          &quot;{item.comment}&quot;
                        </Text>
                      ) : (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#94A3B8",
                            fontStyle: "italic",
                            marginTop: 4,
                          }}
                        >
                          Sem comentário
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
              {(!data?.reviews || data.reviews.length === 0) && (
                <Text style={styles.emptyTxt}>Nenhuma avaliação encontrada.</Text>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: COMPROVANTES ── */}
        <BottomSheet
          ref={paymentsSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comprovantes Enviados</Text>
              <TouchableOpacity onPress={() => paymentsSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 20 }}>
              {data?.receiptHistory?.map((item) => (
                <View key={item.id_agendamento} style={styles.pendingCard}>
                  <View style={styles.pendingRow}>
                    <Image
                      source={
                        item.user_avatar
                          ? { uri: item.user_avatar }
                          : { uri: "https://via.placeholder.com/40" }
                      }
                      style={styles.avatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.clientName}>{item.user_name}</Text>
                      <Text style={styles.clientMeta}>
                        {new Date(item.data_agendamento).toLocaleDateString("pt-BR")} •{" "}
                        {item.hora_inicio}
                      </Text>
                      <Text
                        style={{ fontSize: 13, fontWeight: "800", color: "#10B981", marginTop: 4 }}
                      >
                        + {formatCurrency(item.valor_recebido)}
                      </Text>
                    </View>
                    <View style={{ padding: 8, backgroundColor: "#DCFCE7", borderRadius: 10 }}>
                      <CheckCircle size={18} color="#10B981" />
                    </View>
                  </View>
                </View>
              ))}
              {(!data?.receiptHistory || data.receiptHistory.length === 0) && (
                <Text style={styles.emptyTxt}>Nenhum comprovante enviado ainda.</Text>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: GERENCIAR USUÁRIOS ── */}
        <BottomSheet
          ref={usersSheetRef}
          index={-1}
          snapPoints={["100%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <View style={styles.sheetContent}>
            <View style={[styles.sheetHeader, { marginBottom: 18 }]}>
              <View>
                <Text style={styles.sheetTitle}>Gestão de Usuários</Text>
                <Text style={styles.sheetSubtitle}>{adminUsers.length} usuários no total</Text>
              </View>
              <TouchableOpacity
                onPress={() => usersSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Stats: Role Filters */}
            <View style={[styles.sheetStatsRow, { marginBottom: 15 }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  userRoleFilter === "cliente_pf" && {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#64748B",
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  setUserRoleFilter(userRoleFilter === "cliente_pf" ? "all" : "cliente_pf")
                }
              >
                <Text style={[styles.sheetStatValue, { color: "#64748B" }]}>
                  {adminUsers.length}
                </Text>
                <Text style={styles.sheetStatLabel}>Todos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  userRoleFilter === "cliente_pj" && {
                    backgroundColor: "#F0FDF4",
                    borderColor: "#16A34A",
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  setUserRoleFilter(userRoleFilter === "cliente_pj" ? "all" : "cliente_pj")
                }
              >
                <Text style={[styles.sheetStatValue, { color: "#16A34A" }]}>
                  {
                    adminUsers.filter((u) => {
                      const r = String(u.role || u.tipo || u.role_name || "").toLowerCase();
                      const isPJId = [16, 19, 20, 21, 22].includes(Number(u.id_us));
                      const hasCref = u.cref && String(u.cref).trim().length > 1;
                      return (
                        r.includes("personal") ||
                        r.includes("trainer") ||
                        r.includes("pj") ||
                        isPJId ||
                        hasCref
                      );
                    }).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Personais</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  userRoleFilter === "admin" && {
                    backgroundColor: "#FAF5FF",
                    borderColor: "#9333EA",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setUserRoleFilter(userRoleFilter === "admin" ? "all" : "admin")}
              >
                <Text style={[styles.sheetStatValue, { color: "#9333EA" }]}>
                  {
                    adminUsers.filter((u) => {
                      const r = String(u.role || u.tipo || u.role_name || "").toLowerCase();
                      const isAdminId = Number(u.id_us) === 15;
                      return r.includes("admin") || isAdminId;
                    }).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Admins</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { marginTop: 0 }]}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar por nome ou e-mail..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
              />
              {userSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setUserSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {loadingSheet ? (
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <ActivityIndicator color="#10B981" size="large" />
                <Text style={{ marginTop: 12, color: "#94A3B8", fontWeight: "600" }}>
                  Carregando usuários...
                </Text>
              </View>
            ) : (
              <BottomSheetFlatList
                data={filteredAdminUsers}
                keyExtractor={(item: any) => item.id_us.toString()}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, marginTop: 15 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
                ListEmptyComponent={() => (
                  <View style={styles.proEmptyState}>
                    <Users size={40} color="#E2E8F0" />
                    <Text style={styles.emptyTxt}>Nenhum usuário encontrado.</Text>
                  </View>
                )}
                renderItem={({ item }: { item: any }) => {
                  const r = String(item.role || item.tipo || item.role_name || "").toLowerCase();
                  const isAdmin = r.includes("admin") || Number(item.id_us) === 15;
                  const isPJ =
                    r.includes("personal") ||
                    r.includes("trainer") ||
                    r.includes("pj") ||
                    (item.cref && String(item.cref).trim().length > 1) ||
                    [16, 19, 20, 21, 22].includes(Number(item.id_us));

                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => openUserDetail(item)}
                      onLongPress={() => {
                        const isMasterAdmin = item.email === "comercial.movtapp@gmail.com";
                        const isCurrentUser = item.id_us === Number(user?.id_us);

                        if (isMasterAdmin) {
                          Alert.alert(
                            "🛡️ Admin Master",
                            "Este usuário possui acesso vitalício e não pode ser alterado."
                          );
                          return;
                        }

                        if (isCurrentUser) return;

                        Alert.alert("Gestão de Privilégios", `Gerenciar acesso de ${item.nome}:`, [
                          { text: "Cancelar", style: "cancel" },
                          isAdmin
                            ? {
                                text: "Retirar Admin",
                                style: "destructive",
                                onPress: () => {
                                  Alert.alert(
                                    "⚠️ Revogar Acesso",
                                    `Retirar os poderes de Administrador de ${item.nome}?`,
                                    [
                                      { text: "Cancelar", style: "cancel" },
                                      {
                                        text: "Sim, Revogar",
                                        style: "destructive",
                                        onPress: () => changeUserRole(item.id_us, "client_pf"),
                                      },
                                    ]
                                  );
                                },
                              }
                            : {
                                text: "Promover a Admin",
                                style: "destructive",
                                onPress: () => changeUserRole(item.id_us, "admin"),
                              },
                        ]);
                      }}
                      style={styles.proUserCard}
                    >
                      <View style={styles.proUserMain}>
                        <View style={styles.proAvatarContainer}>
                          <Image
                            source={{
                              uri:
                                item.foto_url ||
                                "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop",
                            }}
                            style={styles.proAvatar}
                          />
                        </View>

                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={[styles.proName, { flexShrink: 1 }]} numberOfLines={1}>
                              {item.nome}
                            </Text>
                            {(isAdmin || isPJ) && (
                              <View
                                style={[
                                  styles.proBadge,
                                  {
                                    backgroundColor: isAdmin ? "#FAF5FF" : "#F0FDF4",
                                    borderColor: isAdmin ? "#E9D5FF" : "#DCFCE7",
                                    borderWidth: 1,
                                    paddingHorizontal: 8,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.proBadgeText,
                                    {
                                      color: isAdmin ? "#9333EA" : "#16A34A",
                                      fontSize: 10,
                                      fontWeight: "800",
                                    },
                                  ]}
                                >
                                  {isAdmin ? "ADMIN" : "PRO"}
                                </Text>
                              </View>
                            )}
                            <View
                              style={[
                                styles.proBadge,
                                {
                                  backgroundColor: item.ativo ? "#DCFCE7" : "#FEE2E2",
                                  marginTop: 0,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.dot,
                                  { backgroundColor: item.ativo ? "#10B981" : "#EF4444" },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.proBadgeText,
                                  { color: item.ativo ? "#106534" : "#991B1B" },
                                ]}
                              >
                                {item.ativo ? "Ativo" : "Bloq."}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.proEmail, { marginTop: 4 }]}>{item.email}</Text>
                        </View>

                        {item.id_us !== Number(user?.id_us) && (
                          <TouchableOpacity
                            style={styles.proActionBtn}
                            onPress={() => toggleUserStatus(item.id_us)}
                          >
                            {item.ativo ? (
                              <Shield size={20} color="#EF4444" />
                            ) : (
                              <CheckCircle size={20} color="#10B981" />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </BottomSheet>

        {/* ── SHEET: PLANOS ATIVOS ── */}
        <BottomSheet
          ref={activePlansSheetRef}
          index={-1}
          snapPoints={["100%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Planos Ativos</Text>
                <Text style={styles.sheetSubtitle}>Distribuição da base de usuários</Text>
              </View>
              <TouchableOpacity
                onPress={() => activePlansSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Stats: Plan Filters */}
            <View style={styles.sheetStatsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  activePlanFilter === "FREE" && {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#64748B",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setActivePlanFilter(activePlanFilter === "FREE" ? "all" : "FREE")}
              >
                <Text style={[styles.sheetStatValue, { color: "#64748B" }]}>
                  {
                    adminUsers.filter((u) => {
                      const plan = (u.plan || "").toLowerCase();
                      return (
                        !plan ||
                        plan === "free" ||
                        (!plan.includes("premium") &&
                          !plan.includes("familia") &&
                          !plan.includes("gold") &&
                          !plan.includes("family"))
                      );
                    }).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Free</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  activePlanFilter === "premium" && {
                    backgroundColor: "#EEF2FF",
                    borderColor: "#6366F1",
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  setActivePlanFilter(activePlanFilter === "premium" ? "all" : "premium")
                }
              >
                <Text style={[styles.sheetStatValue, { color: "#6366F1" }]}>
                  {
                    adminUsers.filter(
                      (u) =>
                        u.plan?.toLowerCase().includes("premium") ||
                        u.plan?.toLowerCase().includes("gold")
                    ).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Premium</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  activePlanFilter === "familia" && {
                    backgroundColor: "#ECFEFF",
                    borderColor: "#06B6D4",
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  setActivePlanFilter(activePlanFilter === "familia" ? "all" : "familia")
                }
              >
                <Text style={[styles.sheetStatValue, { color: "#06B6D4" }]}>
                  {
                    adminUsers.filter(
                      (u) =>
                        u.plan?.toLowerCase().includes("familia") ||
                        u.plan?.toLowerCase().includes("family")
                    ).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Família</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar por nome ou e-mail..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={activePlanSearchQuery}
                onChangeText={setActivePlanSearchQuery}
              />
              {activePlanSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setActivePlanSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {loadingSheet ? (
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <ActivityIndicator color="#10B981" size="large" />
                <Text style={{ marginTop: 12, color: "#94A3B8", fontWeight: "600" }}>
                  Carregando dados...
                </Text>
              </View>
            ) : (
              <BottomSheetFlatList
                data={filteredActivePlansUsers}
                keyExtractor={(item: any) => item.id_us.toString()}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, marginTop: 15 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
                ListEmptyComponent={() => (
                  <View style={styles.proEmptyState}>
                    <Users size={40} color="#E2E8F0" />
                    <Text style={styles.emptyTxt}>Nenhum usuário correspondente aos filtros.</Text>
                  </View>
                )}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.proUserCard}
                    activeOpacity={0.8}
                    onPress={() => openUserDetail(item)}
                  >
                    <View style={styles.proUserMain}>
                      <View style={styles.proAvatarContainer}>
                        <Image
                          source={{
                            uri:
                              item.foto_url ||
                              "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop",
                          }}
                          style={styles.proAvatar}
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.proName, { flexShrink: 1 }]} numberOfLines={1}>
                            {item.nome}
                          </Text>
                        </View>
                        <Text style={[styles.proEmail, { marginTop: 4 }]}>{item.email}</Text>

                        <View style={[styles.proBadgeRow, { marginTop: 8 }]}>
                          <View
                            style={[
                              styles.proBadge,
                              {
                                backgroundColor:
                                  item.plan && item.plan !== "FREE" ? "#EEF2FF" : "#F1F5F9",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.proBadgeText,
                                {
                                  color: item.plan && item.plan !== "FREE" ? "#6366F1" : "#64748B",
                                },
                              ]}
                            >
                              {item.plan || "FREE"}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.proBadge,
                              { backgroundColor: item.ativo ? "#DCFCE7" : "#FEE2E2" },
                            ]}
                          >
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: item.ativo ? "#10B981" : "#EF4444" },
                              ]}
                            />
                            <Text
                              style={[
                                styles.proBadgeText,
                                { color: item.ativo ? "#106534" : "#991B1B" },
                              ]}
                            >
                              {item.ativo ? "Ativo" : "Bloqueado"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ justifyContent: "center", paddingLeft: 10 }}>
                        <ChevronRight size={20} color="#CBD5E1" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </BottomSheet>

        {/* ── SHEET: ACADEMIAS ── */}
        <BottomSheet
          ref={gymsSheetRef}
          index={-1}
          snapPoints={["100%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <View style={styles.sheetContent}>
            <View style={[styles.sheetHeader, { marginBottom: 18 }]}>
              <View>
                <Text style={styles.sheetTitle}>Rede de Academias</Text>
                <Text style={styles.sheetSubtitle}>{adminGyms.length} unidades cadastradas</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[styles.sheetCloseBtn, { backgroundColor: "#BBF246" }]}
                  onPress={() => {
                    setGoogleSearchQuery("");
                    setGoogleResults([]);
                    setGymForm({});
                    createGymSheetRef.current?.expand();
                  }}
                >
                  <Plus size={20} color="#192126" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => gymsSheetRef.current?.close()}
                  style={styles.sheetCloseBtn}
                >
                  <X size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats: Network Insights */}
            <View style={[styles.sheetStatsRow, { marginBottom: 15 }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  gymListStatusFilter === "all" && {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#64748B",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setGymListStatusFilter("all")}
              >
                <Text style={[styles.sheetStatValue, { color: "#64748B" }]}>
                  {adminGyms.length}
                </Text>
                <Text style={styles.sheetStatLabel}>Todas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  gymListStatusFilter === "active" && {
                    backgroundColor: "#F0FDF4",
                    borderColor: "#16A34A",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setGymListStatusFilter("active")}
              >
                <Text style={[styles.sheetStatValue, { color: "#16A34A" }]}>
                  {adminGyms.filter((g) => g.ativo).length}
                </Text>
                <Text style={styles.sheetStatLabel}>Ativas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  gymListStatusFilter === "blocked" && {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#DC2626",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setGymListStatusFilter("blocked")}
              >
                <Text style={[styles.sheetStatValue, { color: "#DC2626" }]}>
                  {adminGyms.filter((g) => !g.ativo).length}
                </Text>
                <Text style={styles.sheetStatLabel}>Bloqueadas</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { marginBottom: 10 }]}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar unidade por nome ou cidade..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={gymListSearchQuery}
                onChangeText={setGymListSearchQuery}
              />
              {gymListSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setGymListSearchQuery("")}
                  style={{ marginRight: 15 }}
                >
                  <XCircle size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {loadingSheet ? (
              <ActivityIndicator color="#BBF246" style={{ marginTop: 40 }} />
            ) : (
              <BottomSheetFlatList
                data={filteredAdminGyms}
                keyExtractor={(item: any) => item.id_academia.toString()}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, marginTop: 5 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
                ListEmptyComponent={() => (
                  <View style={styles.proEmptyState}>
                    <Building2 size={40} color="#E2E8F0" />
                    <Text style={styles.emptyTxt}>Nenhuma academia encontrada.</Text>
                  </View>
                )}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.proUserCard}
                    activeOpacity={0.8}
                    onPress={() => openGymDetails(item)}
                    onLongPress={() => toggleGymStatus(item.id_academia, item.nome, item.ativo)}
                  >
                    <View style={styles.proUserMain}>
                      <View style={[styles.proAvatarContainer, { backgroundColor: "#F8FAFC" }]}>
                        <Building2 size={24} color="#64748B" />
                      </View>

                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.proName, { flexShrink: 1 }]} numberOfLines={1}>
                            {item.nome}
                          </Text>
                        </View>
                        <Text style={styles.proEmail} numberOfLines={1}>
                          {item.endereco_completo || item.endereco}
                        </Text>

                        <View style={[styles.proBadgeRow, { marginTop: 8 }]}>
                          <View
                            style={[
                              styles.proBadge,
                              { backgroundColor: item.ativo ? "#DCFCE7" : "#FEE2E2" },
                            ]}
                          >
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: item.ativo ? "#10B981" : "#EF4444" },
                              ]}
                            />
                            <Text
                              style={[
                                styles.proBadgeText,
                                { color: item.ativo ? "#106534" : "#991B1B" },
                              ]}
                            >
                              {item.ativo ? "Ativa" : "Bloqueada"}
                            </Text>
                          </View>
                          <View style={[styles.proBadge, { backgroundColor: "#EEF2FF" }]}>
                            <Users size={12} color="#6366F1" style={{ marginRight: 4 }} />
                            <Text style={[styles.proBadgeText, { color: "#6366F1" }]}>
                              {item.trainers_count || 0} Trainers
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ justifyContent: "center", paddingLeft: 10 }}>
                        <ChevronRight size={20} color="#CBD5E1" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </BottomSheet>

        {/* ── SHEET: CRIAR ACADEMIA (GOOGLE) ── */}
        <BottomSheet
          ref={createGymSheetRef}
          index={-1}
          snapPoints={["90%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nova Academia</Text>
              <TouchableOpacity onPress={() => createGymSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MapPin size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Pesquisar no Google Maps..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={googleSearchQuery}
                onChangeText={searchGoogleGyms}
              />
              {isSearchingGoogle && (
                <ActivityIndicator color="#10B981" style={{ marginRight: 15 }} />
              )}
            </View>

            <ScrollView style={{ marginTop: 15 }}>
              {gymForm.nome ? (
                <View style={styles.googleDetailCard}>
                  <View style={styles.googleHeader}>
                    <Map size={40} color="#10B981" />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.googleGymName}>{gymForm.nome}</Text>
                      <Text style={styles.googleGymAddr}>{gymForm.endereco_completo}</Text>
                    </View>
                  </View>

                  <View style={styles.googleStatsRow}>
                    <View style={styles.googleStat}>
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.googleStatTxt}>
                        {gymForm.rating} ({gymForm.user_ratings_total})
                      </Text>
                    </View>
                    {gymForm.telefone && (
                      <View style={styles.googleStat}>
                        <PhoneCall size={16} color="#64748B" />
                        <Text style={styles.googleStatTxt}>{gymForm.telefone}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.confirmSaveBtn}
                    onPress={saveNewGym}
                    disabled={loadingSheet}
                  >
                    {loadingSheet ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.confirmSaveBtnText}>Confirmar e Cadastrar</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setGymForm({})}>
                    <Text style={styles.cancelBtnText}>Mudar Academia</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                googleResults.map((place) => (
                  <TouchableOpacity
                    key={place.place_id}
                    style={styles.googleResultItem}
                    onPress={() => selectGoogleGym(place.place_id)}
                  >
                    <MapPin size={20} color="#94A3B8" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.googleResultTitle}>
                        {place.structured_formatting?.main_text}
                      </Text>
                      <Text style={styles.googleResultSubtitle}>
                        {place.structured_formatting?.secondary_text}
                      </Text>
                    </View>
                    <ArrowRight size={18} color="#E2E8F0" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: DETALHES DA ACADEMIA ── */}
        <BottomSheet
          ref={gymDetailSheetRef}
          index={-1}
          snapPoints={["90%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{selectedGym?.nome}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <View
                    style={[
                      styles.proBadge,
                      {
                        backgroundColor: selectedGym?.ativo ? "#DCFCE7" : "#FEE2E2",
                        paddingVertical: 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: selectedGym?.ativo ? "#10B981" : "#EF4444" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.proBadgeText,
                        { color: selectedGym?.ativo ? "#106534" : "#991B1B", fontSize: 9 },
                      ]}
                    >
                      {selectedGym?.ativo ? "OPERACIONAL" : "SUSPENSA"}
                    </Text>
                  </View>
                  {selectedGym?.rating > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#B45309" }}>
                        {selectedGym?.rating}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => gymDetailSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 20 }}>
              {/* Contact & Info Section */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: 20,
                  borderRadius: 24,
                  marginBottom: 25,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: "#64748B",
                    marginBottom: 15,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Info & Contato
                </Text>

                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MapPin size={18} color="#6366F1" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1E293B" }}>
                        Endereço
                      </Text>
                      <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                        {selectedGym?.endereco_completo}
                      </Text>
                    </View>
                  </View>

                  {(selectedGym?.telefone || selectedGym?.whatsapp) && (
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
                      {selectedGym?.telefone && (
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#fff",
                            height: 48,
                            borderRadius: 14,
                            gap: 8,
                            borderWidth: 1,
                            borderColor: "#E2E8F0",
                          }}
                          onPress={() => Linking.openURL(`tel:${selectedGym.telefone}`)}
                        >
                          <Phone size={16} color="#1E293B" />
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}>
                            Ligar
                          </Text>
                        </TouchableOpacity>
                      )}
                      {selectedGym?.whatsapp && (
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#DCFCE7",
                            height: 48,
                            borderRadius: 14,
                            gap: 8,
                          }}
                          onPress={() =>
                            Linking.openURL(
                              `https://wa.me/55${selectedGym.whatsapp.replace(/\D/g, "")}`
                            )
                          }
                        >
                          <MessageSquare size={16} color="#16A34A" />
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#16A34A" }}>
                            WhatsApp
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selectedGym?.ativo ? "#FEF2F2" : "#F0FDF4",
                      height: 48,
                      borderRadius: 14,
                      gap: 8,
                      marginTop: 10,
                    }}
                    onPress={() =>
                      toggleGymStatus(selectedGym.id_academia, selectedGym.nome, selectedGym.ativo)
                    }
                  >
                    <Shield size={16} color={selectedGym?.ativo ? "#DC2626" : "#16A34A"} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: selectedGym?.ativo ? "#DC2626" : "#16A34A",
                      }}
                    >
                      {selectedGym?.ativo ? "Bloquear Unidade" : "Ativar Unidade"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Professionals Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E293B" }}>
                    Profissionais
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>
                    {gymTrainers.length} vinculados
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addLinkBtn, { backgroundColor: "#BBF246" }]}
                  onPress={() => {
                    setTrainerSearchQuery("");
                    if (adminTrainers.length === 0) fetchAdminTrainers(true);
                    linkTrainerSheetRef.current?.expand();
                  }}
                >
                  <Plus size={16} color="#192126" />
                  <Text style={[styles.addLinkBtnText, { color: "#192126" }]}>Vincular</Text>
                </TouchableOpacity>
              </View>

              {/* Professionals List */}
              {loadingSheet ? (
                <ActivityIndicator color="#6366F1" style={{ marginTop: 30 }} />
              ) : (
                gymTrainers.map((trainer) => (
                  <View
                    key={trainer.id_us}
                    style={[styles.proUserCard, { marginBottom: 12, padding: 12 }]}
                  >
                    <View style={styles.proUserMain}>
                      <Image
                        source={{
                          uri:
                            trainer.foto_url ||
                            trainer.avatar_url ||
                            "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100",
                        }}
                        style={[styles.proAvatar, { width: 44, height: 44, borderRadius: 22 }]}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.proName, { fontSize: 14 }]}>{trainer.nome}</Text>
                        <Text style={[styles.proEmail, { fontSize: 12 }]}>{trainer.email}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => unlinkTrainer(trainer.id_us, trainer.nome)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: "#FEF2F2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Unlink size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {gymTrainers.length === 0 && !loadingSheet && (
                <View style={[styles.proEmptyState, { marginTop: 10 }]}>
                  <Users size={32} color="#E2E8F0" />
                  <Text style={[styles.emptyTxt, { fontSize: 13, marginTop: 8 }]}>
                    Nenhum profissional vinculado a esta unidade.
                  </Text>
                </View>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: VINCULAR PROFISSIONAL ── */}
        <BottomSheet
          ref={linkTrainerSheetRef}
          index={-1}
          snapPoints={["85%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Vincular Profissional</Text>
                <Text style={styles.sheetSubtitle}>
                  Adicione personais à unidade{"\n"}
                  {selectedGym?.nome}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => linkTrainerSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { marginTop: 20 }]}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar por nome ou e-mail..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={trainerSearchQuery}
                onChangeText={searchTrainersToLink}
              />
              {trainerSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => searchTrainersToLink("")}
                  style={{ marginRight: 15 }}
                >
                  <XCircle size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ marginTop: 15, paddingHorizontal: 5 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#64748B",
                  textTransform: "uppercase",
                }}
              >
                Profissionais Disponíveis ({trainersAvailableToLink.length})
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1, marginTop: 10 }}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              {trainersAvailableToLink.map((trainer) => (
                <TouchableOpacity
                  key={trainer.id_us}
                  style={[styles.proUserCard, { marginBottom: 10, padding: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => linkTrainer(trainer.id_us)}
                >
                  <View style={styles.proUserMain}>
                    <Image
                      source={{
                        uri:
                          trainer.foto_url ||
                          trainer.avatar_url ||
                          "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100",
                      }}
                      style={[styles.proAvatar, { width: 44, height: 44, borderRadius: 22 }]}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.proName, { fontSize: 14 }]}>{trainer.nome}</Text>
                      <Text style={[styles.proEmail, { fontSize: 12 }]}>{trainer.email}</Text>
                    </View>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: "#F0FDF4",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Link size={18} color="#16A34A" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {trainersAvailableToLink.length === 0 && (
                <View style={[styles.proEmptyState, { marginTop: 40 }]}>
                  <UserPlus size={40} color="#E2E8F0" />
                  <Text style={styles.emptyTxt}>Nenhum profissional disponível para vínculo.</Text>
                </View>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: GERENCIAR TREINADORES ── */}
        <BottomSheet
          ref={trainersSheetRef}
          index={-1}
          snapPoints={["100%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <View style={styles.sheetContent}>
            <View style={[styles.sheetHeader, { marginBottom: 18 }]}>
              <View>
                <Text style={styles.sheetTitle}>Gerenciar Personais</Text>
                <Text style={styles.sheetSubtitle}>
                  {adminTrainers.length} profissionais cadastrados
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => trainersSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Stats: Activity Filters */}
            <View style={[styles.sheetStatsRow, { marginBottom: 15 }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  trainerListStatusFilter === "all" && {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#64748B",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setTrainerListStatusFilter("all")}
              >
                <Text style={[styles.sheetStatValue, { color: "#64748B" }]}>
                  {adminTrainers.length}
                </Text>
                <Text style={styles.sheetStatLabel}>Todos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  trainerListStatusFilter === "active" && {
                    backgroundColor: "#F0FDF4",
                    borderColor: "#16A34A",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setTrainerListStatusFilter("active")}
              >
                <Text style={[styles.sheetStatValue, { color: "#16A34A" }]}>
                  {adminTrainers.filter((u) => u.ativo).length}
                </Text>
                <Text style={styles.sheetStatLabel}>Ativos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  trainerListStatusFilter === "blocked" && {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#DC2626",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setTrainerListStatusFilter("blocked")}
              >
                <Text style={[styles.sheetStatValue, { color: "#DC2626" }]}>
                  {adminTrainers.filter((u) => !u.ativo).length}
                </Text>
                <Text style={styles.sheetStatLabel}>Bloqueados</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { marginBottom: 10 }]}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar por nome ou e-mail..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={trainerListSearchQuery}
                onChangeText={setTrainerListSearchQuery}
              />
              {trainerListSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setTrainerListSearchQuery("")}
                  style={{ marginRight: 15 }}
                >
                  <XCircle size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {loadingSheet ? (
              <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />
            ) : (
              <BottomSheetFlatList
                data={filteredAdminTrainers}
                keyExtractor={(item: any) => item.id_us.toString()}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, marginTop: 5 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
                ListEmptyComponent={() => (
                  <View style={styles.proEmptyState}>
                    <Users size={40} color="#E2E8F0" />
                    <Text style={styles.emptyTxt}>Nenhum personal encontrado.</Text>
                  </View>
                )}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.proUserCard}
                    activeOpacity={0.8}
                    onPress={() => openUserDetail(item)}
                  >
                    <View style={styles.proUserMain}>
                      <View style={styles.proAvatarContainer}>
                        <Image
                          source={{
                            uri:
                              item.foto_url ||
                              item.avatar_url ||
                              "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop",
                          }}
                          style={styles.proAvatar}
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.proName, { flexShrink: 1 }]} numberOfLines={1}>
                            {item.nome}
                          </Text>
                          {String(item.role || item.tipo)
                            .toLowerCase()
                            .includes("admin") && <ShieldCheck size={14} color="#6366F1" />}
                        </View>
                        <Text style={styles.proEmail}>{item.email}</Text>

                        <View style={[styles.proBadgeRow, { marginTop: 8 }]}>
                          <View style={[styles.proBadge, { backgroundColor: "#F0FDF4" }]}>
                            <Text style={[styles.proBadgeText, { color: "#16A34A" }]}>
                              PERSONAL
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.proBadge,
                              { backgroundColor: item.ativo ? "#DCFCE7" : "#FEE2E2" },
                            ]}
                          >
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: item.ativo ? "#10B981" : "#EF4444" },
                              ]}
                            />
                            <Text
                              style={[
                                styles.proBadgeText,
                                { color: item.ativo ? "#106534" : "#991B1B" },
                              ]}
                            >
                              {item.ativo ? "Ativo" : "Bloqueado"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ justifyContent: "center", paddingLeft: 10 }}>
                        <ChevronRight size={20} color="#CBD5E1" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </BottomSheet>

        {/* ── SHEET: PLANOS EXPIRANDO ── */}
        <BottomSheet
          ref={expiringSheetRef}
          index={-1}
          snapPoints={["100%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <View style={[styles.sheetContent, { flex: 1, paddingBottom: 0 }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Controle de Renovação</Text>
                <Text style={styles.sheetSubtitle}>
                  {rawExpiringUsers.length} mensardes rastreados
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => expiringSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Stats: Plan Filters */}
            <View style={styles.sheetStatsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  expiringPlanFilter === "premium" && {
                    backgroundColor: "#EEF2FF",
                    borderColor: "#6366F1",
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  setExpiringPlanFilter(expiringPlanFilter === "premium" ? "all" : "premium")
                }
              >
                <Text style={[styles.sheetStatValue, { color: "#6366F1" }]}>
                  {
                    rawExpiringUsers.filter((u) => {
                      const plan = (u.plan || u.plano || "").toLowerCase();
                      return plan.includes("premium") || plan.includes("gold");
                    }).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Premium</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.sheetStatItem,
                  expiringPlanFilter === "familia" && {
                    backgroundColor: "#ECFEFF",
                    borderColor: "#06B6D4",
                    borderWidth: 2,
                  },
                ]}
                onPress={() =>
                  setExpiringPlanFilter(expiringPlanFilter === "familia" ? "all" : "familia")
                }
              >
                <Text style={[styles.sheetStatValue, { color: "#06B6D4" }]}>
                  {
                    rawExpiringUsers.filter((u) => {
                      const plan = (u.plan || u.plano || "").toLowerCase();
                      return plan.includes("familia") || plan.includes("family");
                    }).length
                  }
                </Text>
                <Text style={styles.sheetStatLabel}>Família</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar assinante por nome ou e-mail..."
                placeholderTextColor="#94A3B8"
                value={expiringSearchQuery}
                onChangeText={setExpiringSearchQuery}
              />
              {expiringSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setExpiringSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <BottomSheetFlatList
              data={filteredExpiringUsers}
              keyExtractor={(item: any) => (item.id_us || item.id).toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
              ListEmptyComponent={() =>
                !loadingSheet && (
                  <View style={[styles.proEmptyState, { marginTop: 80 }]}>
                    <Bell size={48} color="#E2E8F0" />
                    <Text style={styles.emptyTxt}>
                      Nenhuma renovação pendente para os próximos dias.
                    </Text>
                  </View>
                )
              }
              renderItem={({ item }: { item: any }) => {
                const planType = (item.plano || item.plan || item.nome_plano || "").toLowerCase();
                const isPremium = planType.includes("premium") || planType.includes("gold");
                const isFamilia = planType.includes("familia") || planType.includes("family");

                // --- LÓGICA DE CÁLCULO DE DATA ---
                const rawActivation = item.created_at || item.activated_at || item.data_ativacao;
                let displayExpiry =
                  item.vencimento || item.validade || item.expires_at || item.data_expiracao;

                if ((!displayExpiry || displayExpiry === "Em análise") && rawActivation) {
                  try {
                    const actDate = new Date(rawActivation);
                    // Adiciona 1 mês por padrão para planos mensais
                    actDate.setMonth(actDate.getMonth() + 1);
                    displayExpiry = actDate.toLocaleDateString("pt-BR");
                  } catch (e) {
                    displayExpiry = "Em análise";
                  }
                }

                // Cálculo de dias restantes (aproximado)
                let daysLeft = 30;
                let progress = 0.5;
                if (displayExpiry && displayExpiry.includes("/")) {
                  const [d, m, y] = displayExpiry.split("/").map(Number);
                  const expiryObj = new Date(y, m - 1, d);
                  const diffTime = expiryObj.getTime() - new Date().getTime();
                  daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  // ProgressBar logic (assumindo ciclo de 30 dias)
                  progress = Math.max(0, Math.min(1, (30 - daysLeft) / 30));
                }

                const isCritical = daysLeft <= 7 && daysLeft >= 0;
                const isExpired = daysLeft < 0;

                const displayDays = isExpired ? 0 : daysLeft;
                const semTextTitle = isExpired ? "#475569" : isCritical ? "#EF4444" : "#1E293B";
                const semTextLabel = isExpired ? "#94A3B8" : isCritical ? "#EF4444" : "#64748B";

                // --- DIAGNÓSTICO PARA VALIDAÇÃO ---
                const rawStart =
                  item.created_at || item.activated_at || item.data_ativacao || "Não informado";
                const rawEnd =
                  item.vencimento ||
                  item.validade ||
                  item.expires_at ||
                  item.data_expiracao ||
                  "Nulo no DB";

                return (
                  <View
                    style={[
                      styles.compactRowCard,
                      isCritical && { borderColor: "#FEE2E2", backgroundColor: "#FFFBFA" },
                      isExpired && { borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
                    ]}
                  >
                    <View style={styles.compactRowMain}>
                      <Image
                        source={{
                          uri:
                            item.foto_url ||
                            item.avatar_url ||
                            "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100",
                        }}
                        style={[styles.compactAvatar, isExpired && { opacity: 0.6 }]}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text
                            style={[styles.compactName, isExpired && { color: "#475569" }]}
                            numberOfLines={1}
                          >
                            {item.nome}
                          </Text>
                          <View
                            style={[
                              styles.compactPlanBadge,
                              {
                                backgroundColor: isExpired
                                  ? "#E2E8F0"
                                  : isPremium
                                    ? "#F3E8FF"
                                    : "#E0F2FE",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.compactPlanText,
                                {
                                  color: isExpired ? "#64748B" : isPremium ? "#9333EA" : "#0284C7",
                                },
                              ]}
                            >
                              {isPremium ? "PREMIUM" : "FAMÍLIA"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.compactDatesRow}>
                          <Text style={styles.compactDateLabel}>
                            Início:{" "}
                            <Text style={styles.compactDateValue}>
                              {rawStart.split("T")[0].split("-").reverse().slice(0, 2).join("/")}
                            </Text>
                          </Text>
                          <Text style={styles.compactDateDot}> • </Text>
                          <Text style={styles.compactDateLabel}>
                            Renov.:{" "}
                            <Text
                              style={[
                                styles.compactDateValue,
                                isCritical && { color: "#EF4444" },
                                isExpired && { color: "#64748B" },
                              ]}
                            >
                              {displayExpiry.split("/").slice(0, 2).join("/")}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.compactDaysBox,
                          {
                            borderLeftColor: isExpired
                              ? "#CBD5E1"
                              : isCritical
                                ? "#FEE2E2"
                                : "#F1F5F9",
                          },
                        ]}
                      >
                        <Text style={[styles.compactDaysNumber, { color: semTextTitle }]}>
                          {displayDays}
                        </Text>
                        <Text style={[styles.compactDaysLabel, { color: semTextLabel }]}>
                          {isExpired ? "VENCIDO" : "DIAS"}
                        </Text>
                      </View>
                    </View>

                    {/* Linha de progresso ultra-fina no rodapé do card */}
                    <View style={styles.compactProgressBg}>
                      <View
                        style={[
                          styles.compactProgressFill,
                          {
                            width: `${(1 - progress) * 100}%`,
                            backgroundColor: isExpired
                              ? "#94A3B8"
                              : isCritical
                                ? "#EF4444"
                                : "#E2E8F0",
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </BottomSheet>

        {/* ── SHEET: GESTÃO DE PLANOS ── */}
        <BottomSheet
          ref={plansSheetRef}
          index={-1}
          snapPoints={["100%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <View style={[styles.sheetContent, { flex: 1, paddingBottom: 0 }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Catálogo Estratégico</Text>
                <Text style={styles.sheetSubtitle}>
                  {adminPlans.length} Modelos de cobrança ativos
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => plansSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <BottomSheetFlatList
              data={adminPlans}
              keyExtractor={(item: any) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 120,
                paddingTop: 10,
              }}
              ListEmptyComponent={() =>
                !loadingSheet && (
                  <View style={[styles.proEmptyState, { marginTop: 80 }]}>
                    <CreditCard size={48} color="#E2E8F0" />
                    <Text style={styles.emptyTxt}>Nenhum plano disponível.</Text>
                  </View>
                )
              }
              renderItem={({ item }: { item: any }) => {
                const planName = item.name.toLowerCase();
                const isPremium =
                  planName.includes("premium") ||
                  planName.includes("gold") ||
                  planName.includes("vip");
                const isFamilia =
                  planName.includes("familia") ||
                  planName.includes("family") ||
                  planName.includes("combo");

                let accentColor = "#64748B"; // Default
                if (isPremium) accentColor = "#6366F1";
                if (isFamilia) accentColor = "#06B6D4";

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.premiumPlanCard,
                      { borderLeftColor: accentColor, borderLeftWidth: 4 },
                    ]}
                    onPress={() => openEditPlan(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.stripePlanRow}>
                      <View style={styles.stripePlanInfo}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={styles.premiumPlanName}>{item.name}</Text>
                          {isPremium && (
                            <View style={[styles.proBadge, { backgroundColor: "#EEF2FF" }]}>
                              <Star size={10} color="#6366F1" fill="#6366F1" />
                              <Text
                                style={[styles.proBadgeText, { color: "#6366F1", marginLeft: 4 }]}
                              >
                                Popular
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.premiumPlanPrice, { color: accentColor }]}>
                          {formatCurrency(item.price)}
                          <Text style={styles.premiumPlanInterval}>
                            {" "}
                            / {item.interval === "month" ? "mês" : "ano"}
                          </Text>
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.premiumDeleteBtn}
                        onPress={() => deletePlan(item.id, item.name)}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.premiumFeatureSummary}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Layers size={14} color="#94A3B8" />
                        <Text style={styles.premiumFeatureText}>
                          {
                            (Array.isArray(item.features)
                              ? item.features
                              : JSON.parse(item.features || "[]")
                            ).length
                          }{" "}
                          vantagens exclusivas
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#CBD5E1" />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Premium FAB for Creation */}
            <View style={[styles.premiumFabContainer, { bottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.premiumFAB}
                onPress={() => openEditPlan()}
                activeOpacity={0.9}
              >
                <LinearGradient colors={["#1E293B", "#0F172A"]} style={styles.premiumFABGradient}>
                  <Plus size={24} color="#fff" />
                  <Text style={styles.premiumFABText}>Novo Modelo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        <BottomSheet
          ref={editPlanSheetRef}
          index={-1}
          snapPoints={["95%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={[styles.sheetContent, { flex: 1 }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{editingPlan ? "Editar Plano" : "Novo Plano"}</Text>
                <Text style={styles.sheetSubtitle}>Configure os detalhes do produto</Text>
              </View>
              <TouchableOpacity
                onPress={() => editPlanSheetRef.current?.close()}
                style={styles.sheetCloseBtn}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ marginTop: 20 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
              <View style={styles.proFormGroup}>
                <Text style={styles.stripeLabel}>NOME DO PRODUTO</Text>
                <TextInput
                  style={styles.stripeInput}
                  value={planForm.name}
                  onChangeText={(val) => setPlanForm((f) => ({ ...f, name: val }))}
                  placeholder="Ex: Plano Gold"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={[styles.proFormGroup, { flex: 1 }]}>
                  <Text style={styles.stripeLabel}>PREÇO (R$)</Text>
                  <TextInput
                    style={styles.stripeInput}
                    value={planForm.price}
                    onChangeText={(val) => setPlanForm((f) => ({ ...f, price: val }))}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.proFormGroup, { flex: 1 }]}>
                  <Text style={styles.stripeLabel}>INTERVALO</Text>
                  <View style={styles.stripeIntervalRow}>
                    <TouchableOpacity
                      style={[
                        styles.stripeIntervalBtn,
                        planForm.interval === "month" && styles.stripeIntervalBtnActive,
                      ]}
                      onPress={() => setPlanForm((f) => ({ ...f, interval: "month" }))}
                    >
                      <Text
                        style={[
                          styles.stripeIntervalText,
                          planForm.interval === "month" && styles.stripeIntervalTextActive,
                        ]}
                      >
                        Mês
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.stripeIntervalBtn,
                        planForm.interval === "year" && styles.stripeIntervalBtnActive,
                      ]}
                      onPress={() => setPlanForm((f) => ({ ...f, interval: "year" }))}
                    >
                      <Text
                        style={[
                          styles.stripeIntervalText,
                          planForm.interval === "year" && styles.stripeIntervalTextActive,
                        ]}
                      >
                        Ano
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.proFormGroup}>
                <Text style={styles.stripeLabel}>DESCRIÇÃO</Text>
                <TextInput
                  style={[styles.stripeInput, { height: 80, textAlignVertical: "top" }]}
                  value={planForm.description}
                  onChangeText={(val) => setPlanForm((f) => ({ ...f, description: val }))}
                  placeholder="Breve descrição do plano..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              <View style={styles.proFormGroup}>
                <Text style={styles.stripeLabel}>BENEFÍCIOS E VANTAGENS</Text>
                <View style={styles.stripeFeatureInputRow}>
                  <TextInput
                    style={[styles.stripeInput, { flex: 1, marginTop: 0 }]}
                    value={newFeature}
                    onChangeText={setNewFeature}
                    placeholder="Adicionar benefício..."
                    placeholderTextColor="#94A3B8"
                    onSubmitEditing={addFeature}
                  />
                  <TouchableOpacity style={styles.stripeAddFeatureBtn} onPress={addFeature}>
                    <Plus size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 12, gap: 8 }}>
                  {planForm.features.map((feat, idx) => (
                    <View key={idx} style={styles.stripeFeatureItem}>
                      <Check size={14} color="#10B981" />
                      <Text style={styles.stripeFeatureText}>{feat}</Text>
                      <TouchableOpacity onPress={() => removeFeature(idx)}>
                        <X size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.stripeSaveBtn}
                onPress={savePlanEdits}
                disabled={loadingSheet}
              >
                {loadingSheet ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.stripeSaveBtnText}>
                    {editingPlan ? "Atualizar Plano" : "Criar Plano no Stripe"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        <BottomSheet
          ref={userDetailSheetRef}
          index={-1}
          snapPoints={["75%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            {selectedUserDetail && (
              <View style={{ flex: 1 }}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Perfil do Usuário</Text>
                    <Text style={styles.sheetSubtitle}>Visão detalhada do membro</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => userDetailSheetRef.current?.close()}
                    style={styles.sheetCloseBtn}
                  >
                    <X size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  {/* Perfil Principal */}
                  <View style={{ alignItems: "center", marginTop: 30, marginBottom: 24 }}>
                    <View
                      style={{
                        padding: 4,
                        borderRadius: 60,
                        borderWidth: 2,
                        borderColor: "#BBF246",
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            selectedUserDetail.foto_url ||
                            "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop",
                        }}
                        style={{ width: 110, height: 110, borderRadius: 55 }}
                      />
                    </View>
                    <Text
                      style={{ fontSize: 24, fontWeight: "800", color: "#1E293B", marginTop: 16 }}
                    >
                      {selectedUserDetail.nome}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
                      {selectedUserDetail.email}
                    </Text>
                  </View>

                  {/* Cards de Status */}
                  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#F8FAFC",
                        padding: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#94A3B8",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        Plano Atual
                      </Text>
                      <View
                        style={{
                          alignSelf: "flex-start",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor:
                            selectedUserDetail.plan && selectedUserDetail.plan !== "FREE"
                              ? "#EEF2FF"
                              : "#F1F5F9",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              selectedUserDetail.plan && selectedUserDetail.plan !== "FREE"
                                ? "#6366F1"
                                : "#64748B",
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          {selectedUserDetail.plan || "FREE"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#F8FAFC",
                        padding: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#94A3B8",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        Status de Conta
                      </Text>
                      <View
                        style={{
                          alignSelf: "flex-start",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: selectedUserDetail.ativo ? "#DCFCE7" : "#FEE2E2",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: selectedUserDetail.ativo ? "#10B981" : "#EF4444",
                          }}
                        />
                        <Text
                          style={{
                            color: selectedUserDetail.ativo ? "#106534" : "#991B1B",
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          {selectedUserDetail.ativo ? "Ativo" : "Bloqueado"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Detalhes Técnicos */}
                  <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: "#1E293B",
                        marginBottom: 16,
                      }}
                    >
                      Informações Gerais
                    </Text>

                    <View style={{ gap: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#F8FAFC",
                          padding: 16,
                          borderRadius: 16,
                        }}
                      >
                        <Mail size={18} color="#64748B" />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontSize: 10, color: "#94A3B8", fontWeight: "700" }}>
                            E-MAIL
                          </Text>
                          <Text style={{ fontSize: 14, color: "#1E293B", fontWeight: "600" }}>
                            {selectedUserDetail.email}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#F8FAFC",
                          padding: 16,
                          borderRadius: 16,
                        }}
                      >
                        <Calendar size={18} color="#64748B" />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontSize: 10, color: "#94A3B8", fontWeight: "700" }}>
                            MEMBRO DESDE
                          </Text>
                          <Text style={{ fontSize: 14, color: "#1E293B", fontWeight: "600" }}>
                            {selectedUserDetail.created_at
                              ? new Date(selectedUserDetail.created_at).toLocaleDateString("pt-BR")
                              : "N/A"}
                          </Text>
                        </View>
                      </View>

                      {selectedUserDetail.cref && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F8FAFC",
                            padding: 16,
                            borderRadius: 16,
                          }}
                        >
                          <Shield size={18} color="#64748B" />
                          <View style={{ marginLeft: 12 }}>
                            <Text style={{ fontSize: 10, color: "#94A3B8", fontWeight: "700" }}>
                              REGISTRO PROFISSIONAL (CREF)
                            </Text>
                            <Text style={{ fontSize: 14, color: "#1E293B", fontWeight: "600" }}>
                              {selectedUserDetail.cref}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Ações Rápidas */}
                  <View
                    style={{ marginTop: 30, paddingHorizontal: 20, flexDirection: "row", gap: 12 }}
                  >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#192126",
                        height: 56,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => changeUserPlan(selectedUserDetail)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Gerenciar Plano</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: "#F1F5F9",
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => toggleUserStatus(selectedUserDetail.id_us)}
                    >
                      {selectedUserDetail.ativo ? (
                        <XCircle size={22} color="#EF4444" />
                      ) : (
                        <CheckCircle size={22} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: DETALHE DE CHURN ── */}
        <BottomSheet
          ref={churnDetailSheetRef}
          index={-1}
          snapPoints={["70%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Análise de Churn</Text>
              <TouchableOpacity onPress={() => churnDetailSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 20 }}>
              <View style={styles.dbAuditBox}>
                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: "#1E293B", marginBottom: 10 }}
                >
                  Motivos de Cancelamento
                </Text>
                {data?.churnBreakdown?.length ? (
                  data.churnBreakdown.map((item, i) => (
                    <View key={i} style={styles.dbAuditRow}>
                      <Text style={styles.dbAuditLabel}>{item.label}</Text>
                      <Text style={styles.dbAuditValue}>{item.value}</Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: 20 }}
                  >
                    Dados de motivos indisponíveis para este período.
                  </Text>
                )}
              </View>
              <View
                style={{ marginTop: 20, padding: 15, backgroundColor: "#F8FAFC", borderRadius: 20 }}
              >
                <Text style={{ fontSize: 12, color: "#64748B", lineHeight: 18 }}>
                  * A taxa de churn está 1.2% menor que o mês anterior. Recomendamos campanhas de
                  {'retenção para o grupo "Preço / Renovação".'}
                </Text>
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: DETALHE DE LTV ── */}
        <BottomSheet
          ref={ltvDetailSheetRef}
          index={-1}
          snapPoints={["60%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Métrica de LTV</Text>
              <TouchableOpacity onPress={() => ltvDetailSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 20, gap: 15 }}>
              <View
                style={{
                  padding: 20,
                  backgroundColor: "#F0FDF4",
                  borderRadius: 24,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#16A34A",
                    textTransform: "uppercase",
                  }}
                >
                  LTV Projetado Médio
                </Text>
                <Text style={{ fontSize: 32, fontWeight: "900", color: "#16A34A", marginTop: 5 }}>
                  {formatCurrency(data?.ltv?.value || 0)}
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#1E293B" }}>
                  Breakdown por Plano
                </Text>
                {data?.ltvBreakdown?.length ? (
                  data.ltvBreakdown.map((p, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        padding: 12,
                        backgroundColor: "#F8FAFC",
                        borderRadius: 14,
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: "#475569" }}>{p.plan}</Text>
                      <Text style={{ fontWeight: "800", color: "#1E293B" }}>
                        {formatCurrency(p.val)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: 20 }}
                  >
                    Detalhamento por plano ainda não calculado.
                  </Text>
                )}
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: MIX DE RECEITA ── */}
        <BottomSheet
          ref={revenueMixSheetRef}
          index={-1}
          snapPoints={["80%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Mix de Receita</Text>
              <TouchableOpacity onPress={() => revenueMixSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <BottomSheetFlatList
              data={
                data?.planDistribution || [
                  { label: "Premium", count: 45, color: "#6366F1" },
                  { label: "Ouro", count: 30, color: "#F59E0B" },
                  { label: "Basic", count: 25, color: "#94A3B8" },
                ]
              }
              keyExtractor={(item: any, i: number) => i.toString()}
              style={{ marginTop: 20 }}
              renderItem={({ item }: { item: any }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 15,
                    padding: 16,
                    backgroundColor: "#F8FAFC",
                    borderRadius: 20,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#1E293B" }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748B" }}>
                      {item.count}% da receita total
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#CBD5E1" />
                </View>
              )}
            />
          </BottomSheetView>
        </BottomSheet>

        {/* ── SHEET: AUDITORIA DE UNIDADES ── */}
        <BottomSheet
          ref={unitAuditSheetRef}
          index={-1}
          snapPoints={["90%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Performance de Unidades</Text>
              <TouchableOpacity onPress={() => unitAuditSheetRef.current?.close()}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  marginBottom: 15,
                }}
              >
                Ranking de Faturamento
              </Text>
              {data?.topUnits?.length ? (
                data.topUnits.map((gym, i) => (
                  <View
                    key={i}
                    style={{
                      padding: 16,
                      backgroundColor: "#fff",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#F1F5F9",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: "800", color: "#1E293B" }}>
                          {gym.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#64748B" }}>
                          {gym.members} membros ativos
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: "#1E293B" }}>
                          {formatCurrency(gym.rev)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: gym.grow.startsWith("+") ? "#10B981" : "#EF4444",
                          }}
                        >
                          {gym.grow}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: 20 }}>
                  Nenhuma unidade encontrada.
                </Text>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* ── GESTÃO DE COMUNIDADES (componente dedicado) ── */}
        <CommunityManagementSheet
          ref={adminCommSheetRef}
          onClose={() => {
            api
              .get("/comunidades")
              .then((r) => {
                const list = r.data.data || r.data;
                setAdminCommunitiesCount(Array.isArray(list) ? list.length : 0);
              })
              .catch(() => {});
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// ─── Styles matching AdminDashboard ──────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterActiveDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },

  tabBar: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  activeTabText: { color: "#1E293B" },

  scrollContent: { paddingBottom: 40 },

  // KPI
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 10,
  },
  kpiCard: {
    width: (Dimensions.get("window").width - 52) / 2,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiValue: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  kpiGrowRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  kpiGrowText: { fontSize: 11, fontWeight: "700", marginLeft: 2 },
  kpiLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginTop: 2 },

  // Sections
  sectionHeader: { paddingHorizontal: 20, marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  sectionSubtitle: { fontSize: 12, color: "#94A3B8", fontWeight: "500", marginTop: 2 },
  revenueValue: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  growthText: { fontSize: 11, fontWeight: "700", marginTop: 2 },

  chartCardCustom: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },

  // Cards row
  row: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginTop: 14 },
  halfCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  cardSubtitle: { fontSize: 11, color: "#94A3B8", fontWeight: "500", marginTop: 2 },

  perfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  perfBadgeText: { fontSize: 10, fontWeight: "800", color: "#166534" },
  perfMetric: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  perfValue: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  perfLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },

  // Churn/Retention Card
  churnCardInternal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  churnHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  churnIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  churnTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  churnSub: { fontSize: 11, color: "#94A3B8", fontWeight: "500", marginTop: 2 },
  churnRate: { fontSize: 22, fontWeight: "900" },
  churnCount: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  churnBarTrack: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  churnBarFill: { height: 8, borderRadius: 4 },

  // Operations
  operationSection: { paddingHorizontal: 20, marginTop: 28 },
  statusList: { marginTop: 12, gap: 10 },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
  },
  statusIndicator: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusLabel: { fontSize: 14, color: "#1E293B", fontWeight: "700" },
  churnCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  statusValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusValue: { fontSize: 14, fontWeight: "800", color: "#64748B" },

  // Bottom Sheet
  sheetContent: { flex: 1, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },

  pendingCard: { backgroundColor: "#F8FAFC", borderRadius: 20, padding: 16, marginBottom: 12 },
  pendingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E2E8F0" },
  clientName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  clientMeta: { fontSize: 12, color: "#64748B", fontWeight: "500" },

  actionBtns: { flexDirection: "row", gap: 10 },
  refuseBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  refuseTxt: { color: "#EF4444", fontWeight: "700", fontSize: 12 },
  approveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#192126",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  approveTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  emptyTxt: { textAlign: "center", marginTop: 40, color: "#94A3B8", fontWeight: "600" },

  // New Sheet Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  revenueTotalCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#1E293B",
  },
  revenueTotalLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 4,
  },
  revenueTotalValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
  },
  revenueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  revenueItemLeft: {
    flex: 1,
  },
  revenueItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  revenueItemMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  revenueItemValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#10B981",
  },
  sheetFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
  },
  resetBtn: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
  },
  resetBtnText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  applyBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  applyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", zIndex: 1 },
  filterSection: { marginBottom: 20 },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterOptionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterOptionActive: { backgroundColor: "#10B98110", borderColor: "#10B981" },
  filterOptionText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterOptionTextActive: { color: "#10B981" },
  pendingAvatar: { width: 44, height: 44, borderRadius: 22 },
  pendingName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  pendingDetail: { fontSize: 12, color: "#64748B" },
  actionBtnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Pro Admin Sheet Styles
  sheetSubtitle: { fontSize: 13, color: "#94A3B8", fontWeight: "600", marginTop: 2 },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetStatsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  sheetStatItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sheetStatValue: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  sheetStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 2,
    textTransform: "uppercase",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    marginTop: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1E293B" },

  proUserCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  proUserMain: { flexDirection: "row", alignItems: "center" },
  proAvatarContainer: { position: "relative" },
  proAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#E2E8F0" },
  proName: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  proEmail: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  proBadgeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  proBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  dot: { width: 4, height: 4, borderRadius: 2 },
  proActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  proEmptyState: { alignItems: "center", marginTop: 60, gap: 12 },

  proFilterRow: { flexDirection: "row", gap: 8, marginTop: 16, paddingHorizontal: 4 },
  proFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "transparent",
  },
  proFilterChipActive: { backgroundColor: "#fff", borderColor: "#10B981" },
  proFilterText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  proFilterTextActive: { color: "#10B981" },

  inputLabel: { fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 8, marginLeft: 4 },
  formInput: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  savePlanBtn: {
    backgroundColor: "#10B981",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  savePlanBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  addLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addLinkBtnText: { fontSize: 13, fontWeight: "700", color: "#10B981" },
  trainerLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  trainerLinkAvatar: { width: 44, height: 44, borderRadius: 22 },
  trainerLinkName: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  trainerLinkEmail: { fontSize: 11, color: "#94A3B8" },
  unlinkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },

  addGymHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  googleResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  googleResultTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  googleResultSubtitle: { fontSize: 11, color: "#64748B", marginTop: 2 },
  googleDetailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  googleHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  googleGymName: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  googleGymAddr: { fontSize: 13, color: "#64748B", marginTop: 4 },
  googleStatsRow: { flexDirection: "row", gap: 15, marginBottom: 25 },
  googleStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  googleStatTxt: { fontSize: 12, fontWeight: "700", color: "#475569" },
  confirmSaveBtn: {
    backgroundColor: "#10B981",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSaveBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  cancelBtn: { alignItems: "center", marginTop: 15 },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: "#94A3B8" },

  // Stripe Style Management
  addPlanHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  stripePlanCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  stripePlanRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stripePlanInfo: { flex: 1 },
  stripePlanName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  stripePlanPrice: { fontSize: 24, fontWeight: "900", color: "#1E293B", marginTop: 4 },
  stripePlanInterval: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
  stripeActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  stripeFeaturePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  stripeFeatureCount: { fontSize: 12, fontWeight: "700", color: "#6366F1" },

  proFormGroup: { marginBottom: 20 },
  stripeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stripeInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  stripeIntervalRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    height: 52,
  },
  stripeIntervalBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  stripeIntervalBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stripeIntervalText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  stripeIntervalTextActive: { color: "#6366F1" },

  stripeFeatureInputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  stripeAddFeatureBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  stripeFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  stripeFeatureText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#475569" },
  stripeSaveBtn: {
    backgroundColor: "#1E293B",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  stripeSaveBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  // Ultra-Premium Plan Styles
  premiumPlanCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 3,
  },
  premiumPlanName: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  premiumPlanPrice: { fontSize: 28, fontWeight: "900", marginTop: 6 },
  premiumPlanInterval: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
  premiumDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumFeatureSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  premiumFeatureText: { fontSize: 13, fontWeight: "700", color: "#64748B" },

  premiumFabContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  premiumFAB: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumFABGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  premiumFABText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Expiring User Special Styles
  expiringUserCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  expiringAvatar: { width: 44, height: 44, borderRadius: 22 },
  expiringName: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  expiringDetail: { fontSize: 12, color: "#64748B", marginTop: 2 },
  planTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  planTypeBadgeText: { fontSize: 9, fontWeight: "900" },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countdownText: { fontSize: 10, fontWeight: "800", color: "#EF4444" },
  notifyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Ultra-Premium Renewal Management
  premiumExpiringCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  criticalCard: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFBFA",
  },
  alertDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  expiryInfoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  expiryDateText: { fontWeight: "800", color: "#1E293B", fontSize: 13 },
  renewalProgressContainer: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  renewalProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  daysLeftText: { fontSize: 11, fontWeight: "800", marginBottom: 4, textTransform: "uppercase" },
  quickActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Audit Styles
  dbAuditBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  dbAuditRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dbAuditLabel: { fontSize: 9, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" },
  dbAuditValue: { fontSize: 10, fontWeight: "800", color: "#475569" },

  // Clean Renewal Styles
  cleanRenewalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F8FAFC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cleanRenewalRow: { flexDirection: "row", alignItems: "center" },
  cleanAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: "#F1F5F9" },
  cleanNameText: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  cleanPlanLabel: { fontSize: 13, color: "#64748B", marginTop: 2 },
  cleanStatusText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cleanTimelineContainer: { marginTop: 16 },
  cleanTimelineInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cleanDateText: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  cleanProgressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  cleanProgressBarFill: { height: "100%", borderRadius: 3 },

  // Compact Renewal Row Styles
  compactRowCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F8FAFC",
    overflow: "hidden",
  },
  compactRowMain: { flexDirection: "row", padding: 12, alignItems: "center" },
  compactAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F1F5F9" },
  compactName: { fontSize: 14, fontWeight: "700", color: "#1E293B", flexShrink: 1 },
  compactPlanBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  compactPlanText: { fontSize: 9, fontWeight: "800" },
  compactDatesRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  compactDateLabel: { fontSize: 11, color: "#94A3B8" },
  compactDateValue: { fontWeight: "700", color: "#475569" },
  compactDateDot: { fontSize: 10, color: "#CBD5E1", marginHorizontal: 4 },
  compactDaysBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#F1F5F9",
    marginLeft: 12,
    minWidth: 46,
  },
  compactDaysNumber: { fontSize: 18, fontWeight: "800", lineHeight: 20 },
  compactDaysLabel: { fontSize: 8, fontWeight: "700" },
  compactProgressBg: { height: 2, backgroundColor: "#F8FAFC", width: "100%" },
  compactProgressFill: { height: "100%" },

  // ── Community Management Styles ───────────────────────────────────────────────
  commCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BBF246",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  commCreateBtnTxt: { color: "#1E293B", fontWeight: "700", fontSize: 14 },
  commSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    marginBottom: 14,
    gap: 8,
  },
  commSearchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1E293B" },
  commItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  commItemImageWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#FDF2F8",
    justifyContent: "center",
    alignItems: "center",
  },
  commItemImage: { width: "100%", height: "100%" },
  commItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDF2F8",
  },
  commItemTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginBottom: 6 },
  commItemBadges: { flexDirection: "row", gap: 6 },
  commBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  commBadgeTxt: { fontSize: 10, fontWeight: "700" },
  commItemActions: { flexDirection: "row", gap: 8, marginLeft: 8 },
  commIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  commIconBtnRed: { backgroundColor: "#FEF2F2" },
  // Form styles
  commMediaArea: {
    width: "100%",
    height: 170,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    marginBottom: 18,
  },
  commRemoveImageBtn: {
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
  commMediaPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  commMediaPlaceholderTxt: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  commFormGroup: { marginBottom: 16 },
  commLabel: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8 },
  commInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  commChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  commChipActive: { backgroundColor: "#BBF246", borderColor: "#BBF246" },
  commChipTxt: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  commChipTxtActive: { color: "#1E293B", fontWeight: "700" },
  commSaveBtn: {
    backgroundColor: "#BBF246",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  commSaveBtnTxt: { color: "#1E293B", fontSize: 16, fontWeight: "800" },
  // Modal
  commModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  commModalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
  },
  commModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commModalTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  commModalSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 20 },
  commModalInput: {
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
  commModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  commModalCancelTxt: { color: "#64748B", fontSize: 15, fontWeight: "700" },
  commModalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#BBF246",
  },
  commModalSaveTxt: { color: "#1E293B", fontSize: 15, fontWeight: "700" },
});

export default AdminDashboardScreen;
