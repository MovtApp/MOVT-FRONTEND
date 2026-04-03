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
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../../@types/routes";
import { useAuth } from "../../../../hooks/useAuth";
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
} from "lucide-react-native";
import { CartesianChart, Line, Area, useChartPressState, PolarChart, Pie } from "victory-native";
import { LinearGradient as SkiaGradient, vec, Circle } from "@shopify/react-native-skia";
import BackButton from "../../../../components/BackButton";
import { api } from "../../../../services/api";
import * as ImagePicker from "expo-image-picker";

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
}

// ─── Component ────────────────────────────────────────────────────────────────

const PersonalDashboard: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const { state, isActive } = useChartPressState({ x: "", y: { total: 0 } });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"day" | "month" | "year">("month");
  const [data, setData] = useState<DashboardData | null>(null);

  // Estados de Filtro
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tempStatus, setTempStatus] = useState<string>("all");

  // Bottom Sheets
  const filterSheetRef = React.useRef<BottomSheet>(null);
  const appointmentsSheetRef = React.useRef<BottomSheet>(null);
  const revenueSheetRef = React.useRef<BottomSheet>(null);
  const approvalsSheetRef = React.useRef<BottomSheet>(null);
  const clientsSheetRef = React.useRef<BottomSheet>(null);
  const performanceSheetRef = React.useRef<BottomSheet>(null);
  const historySheetRef = React.useRef<BottomSheet>(null);
  const evaluationSheetRef = React.useRef<BottomSheet>(null);
  const reviewsSheetRef = React.useRef<BottomSheet>(null);
  const paymentsSheetRef = React.useRef<BottomSheet>(null);

  const [selectedClient, setSelectedClient] = useState<PersonalClient | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form de Avaliação
  const [notaIntensidade, setNotaIntensidade] = useState(3);
  const [comentarioTecnico, setComentarioTecnico] = useState("");
  const [notaAluno, setNotaAluno] = useState(5);

  const fetchData = useCallback(async (tab: string = "month", status: string = "all") => {
    try {
      const response = await api.get(`/personal/dashboard-stats`, {
        params: { tab, status },
      });
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar Dashboard Personal:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab, filterStatus);
  }, [fetchData, activeTab, filterStatus]);

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
      const response = await api.get(`/personal/clients/${client.id_us}/history`);
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
          approvalsSheetRef.current?.close();
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

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: "appointments",
        label: "Agendamentos",
        value: data?.kpis?.totalMonth ?? 0,
        percent: 12,
        color: "#6366F1",
      },
      {
        id: "revenue",
        label: "Faturamento",
        value: formatCurrency(data?.kpis?.revenue ?? 0),
        percent: 8,
        color: "#10B981",
      },
      {
        id: "clients",
        label: "Clientes Ativos",
        value: data?.kpis?.clients ?? 0,
        percent: 5,
        color: "#8B5CF6",
      },
      {
        id: "pending",
        label: "Pendentes",
        value: data?.kpis?.pending ?? 0,
        percent: -2,
        color: "#F59E0B",
      },
    ];
  }, [data]);

  const renderKPI = (item: any) => {
    const Icon =
      item.label === "Agendamentos"
        ? Calendar
        : item.label === "Faturamento"
          ? TrendingUp
          : item.label === "Clientes Ativos"
            ? Users
            : Bell;

    const isPositive = item.percent >= 0;

    return (
      <TouchableOpacity
        key={item.label}
        style={styles.kpiCard}
        activeOpacity={0.7}
        onPress={() => {
          if (item.id === "appointments") appointmentsSheetRef.current?.expand();
          if (item.id === "revenue") revenueSheetRef.current?.expand();
          if (item.id === "clients") clientsSheetRef.current?.expand();
          if (item.id === "pending") approvalsSheetRef.current?.expand();
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
        <Text style={styles.kpiValue}>{item.value}</Text>
        <Text style={styles.kpiLabel}>{item.label}</Text>
        <View style={styles.kpiGrowRow}>
          {isPositive ? (
            <ArrowUpRight size={12} color="#10B981" />
          ) : (
            <ArrowDownRight size={12} color="#EF4444" />
          )}
          <Text style={[styles.kpiGrowText, { color: isPositive ? "#10B981" : "#EF4444" }]}>
            {item.percent >= 0 ? `+${item.percent}%` : `${item.percent}%`}
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
            <Text style={styles.headerTitle}>
              {data?.trainer?.nome || user?.name || "Painel Personal"}
            </Text>
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
          <View style={styles.kpiGrid}>{kpis.map(renderKPI)}</View>

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
                <Text style={styles.sectionTitle}>Faturamento Estimado</Text>
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
                const MOCK_CHART = [
                  { label: "Dom", total: 0 },
                  { label: "Seg", total: 0 },
                  { label: "Ter", total: 1 },
                  { label: "Qua", total: 0 },
                  { label: "Qui", total: 2 },
                  { label: "Sex", total: 1 },
                  { label: "Sáb", total: 0 },
                ];
                const chartData =
                  data?.chartData && data.chartData.length > 0 ? data.chartData : MOCK_CHART;

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

          {/* ── DISTRIBUIÇÃO E CONVERSÃO ── */}
          <View style={styles.row}>
            {/* Mix de Status (Session Status) */}
            <TouchableOpacity
              style={[styles.halfCard, { flex: 1.3 }]}
              activeOpacity={0.7}
              onPress={() => appointmentsSheetRef.current?.expand()}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View>
                  <Text style={styles.cardTitle}>Status Sessões</Text>
                  <Text style={styles.cardSubtitle}>
                    {data?.kpis?.totalMonth ?? 0} totais no período
                  </Text>
                </View>
              </View>

              <View style={{ height: 140, marginTop: 12 }}>
                <PolarChartAny
                  data={
                    data && data.statusDistribution.length > 0
                      ? data.statusDistribution
                      : [{ label: "Vazio", count: 1, color: "#F1F5F9" }]
                  }
                  labelKey="label"
                  valueKey="count"
                  colorKey="color"
                >
                  <Pie.Chart innerRadius={25} />
                </PolarChartAny>
              </View>

              {/* Compact Legend mapping like Admin Mix de Planos */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginTop: 12,
                  paddingHorizontal: 4,
                }}
              >
                {data && data.statusDistribution.length > 0 ? (
                  data.statusDistribution.slice(0, 3).map((item, idx) => {
                    const totalCount = data.statusDistribution.reduce(
                      (acc, curr) => acc + curr.count,
                      0
                    );
                    const percent = Math.round((item.count / totalCount) * 100);
                    return (
                      <View key={idx} style={{ alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: item.color, width: 6, height: 6 },
                            ]}
                          />
                          <Text style={{ fontSize: 10, fontWeight: "800", color: "#1E293B" }}>
                            {percent}%
                          </Text>
                        </View>
                        <Text
                          style={{ fontSize: 8, color: "#94A3B8", fontWeight: "600", marginTop: 1 }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: "#F1F5F9", width: 6, height: 6 },
                          ]}
                        />
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#1E293B" }}>
                          0%
                        </Text>
                      </View>
                      <Text
                        style={{ fontSize: 8, color: "#94A3B8", fontWeight: "600", marginTop: 1 }}
                      >
                        Sessões
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Performance */}
            <TouchableOpacity
              style={styles.halfCard}
              activeOpacity={0.7}
              onPress={() => performanceSheetRef.current?.expand()}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View>
                  <Text style={styles.cardTitle}>Performance</Text>
                  <Text style={styles.cardSubtitle}>Taxa de Aprovação</Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate("ExpectationReality" as any);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Activity size={16} color="#1E293B" />
                </TouchableOpacity>
              </View>

              <View style={{ height: 140, marginTop: 12 }}>
                <PolarChartAny
                  data={[
                    {
                      label: "Aprovado",
                      count: performanceData.rate,
                      color: performanceData.color,
                    },
                    { label: "Resto", count: 100 - performanceData.rate, color: "#F1F5F9" },
                  ]}
                  colorKey="color"
                  valueKey="count"
                  labelKey="label"
                >
                  <Pie.Chart innerRadius={25} />
                </PolarChartAny>
              </View>

              <View
                style={{ flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 12 }}
              >
                <View style={{ alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: performanceData.color, width: 6, height: 6 },
                      ]}
                    />
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#1E293B" }}>
                      {performanceData.rate}%
                    </Text>
                  </View>
                  <Text style={{ fontSize: 8, color: "#94A3B8", fontWeight: "600", marginTop: 1 }}>
                    Aprovados
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: "#F1F5F9", width: 6, height: 6 },
                      ]}
                    />
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#1E293B" }}>
                      {100 - performanceData.rate}%
                    </Text>
                  </View>
                  <Text style={{ fontSize: 8, color: "#94A3B8", fontWeight: "600", marginTop: 1 }}>
                    Outros
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── RETENÇÃO CARD ── */}
          <View style={styles.churnCard}>
            <LinearGradient
              colors={["#10B98110", "transparent"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.churnHeader}>
              <View style={[styles.churnIconBox, { backgroundColor: "#10B98118" }]}>
                <Users size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.churnTitle}>Taxa de Retenção</Text>
                <Text style={styles.churnSub}>Fidelidade dos clientes no período</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.churnRate, { color: "#10B981" }]}>
                  {data?.retention?.rate || 0}%
                </Text>
                <Text style={styles.churnCount}>
                  {(data?.retention?.rate || 0) >= 80
                    ? "Excelente"
                    : (data?.retention?.rate || 0) >= 50
                      ? "Bom"
                      : "Melhorar"}
                </Text>
              </View>
            </View>
            <View style={styles.churnBarTrack}>
              <View
                style={[
                  styles.churnBarFill,
                  { width: `${data?.retention?.rate || 0}%`, backgroundColor: "#10B981" },
                ]}
              />
            </View>
          </View>

          {/* ── OPERAÇÕES ── */}
          <View style={styles.operationSection}>
            <Text style={styles.sectionTitle}>Operações</Text>
            <View style={styles.statusList}>
              <TouchableOpacity
                style={styles.statusItem}
                onPress={() => approvalsSheetRef.current?.expand()}
              >
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={styles.statusLabel}>Aprovações pendentes</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>{data?.kpis?.pending ?? 0}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusItem}
                onPress={() => clientsSheetRef.current?.expand()}
              >
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
                  <Text style={styles.statusLabel}>Minha base de clientes</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>{data?.kpis?.clients || 0}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusItem}
                onPress={() => reviewsSheetRef.current?.expand()}
              >
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#6366F1" }]} />
                  <Text style={styles.statusLabel}>Avaliações</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>{data?.reviews?.length || 0}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusItem}
                onPress={() => paymentsSheetRef.current?.expand()}
              >
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: "#192126" }]} />
                  <Text style={styles.statusLabel}>Comprovantes</Text>
                </View>
                <View style={styles.statusValueRow}>
                  <Text style={styles.statusValue}>{data?.receiptHistory?.length || 0}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 100 }} />
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
              {data?.appointments.map((item) => (
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
              {data?.appointments.length === 0 && (
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
                .filter((a) => a.status === "confirmado" || a.status === "concluido")
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
              {data?.pending.map((item) => (
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
              {data?.pending.length === 0 && (
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
              {data?.clients.map((item) => (
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
              {data?.clients.length === 0 && (
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
                    {data?.statusDistribution.find((d) => d.label.toLowerCase() === "confirmado")
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
                              styles.statusDot,
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
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, color: "#1E293B", fontWeight: "700" },
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
});

export default PersonalDashboard;
