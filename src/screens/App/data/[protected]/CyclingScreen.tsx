import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { withPremiumGate } from "@components/withPremiumGate";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Tracker from "../../../../services/locationTrackingService";
import type { TrackingSnapshot } from "../../../../services/locationTrackingService";

import {
  Bike,
  Timer,
  Navigation,
  Mountain,
  Zap,
  ChevronRight,
  TrendingUp,
  Heart,
  Droplets,
  Flame,
  Play,
  Pause,
  Square,
  Share2,
  Trophy,
  Trash2,
  History,
  ChevronLeft,
  Maximize2,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import {
  speedToPace,
  formatDuration,
  estimateCalories,
} from "../../../../utils/workout/performance";
import {
  WorkoutRecord,
  WorkoutType,
  PersonalRecords,
  getWorkouts,
  saveWorkout,
  checkRecords,
  deleteWorkout,
  computeRecords,
} from "../../../../services/workoutHistoryService";

// Os parâmetros de rastreamento (acurácia, segmento mínimo, etc.) e o cálculo
// de distância agora vivem em locationTrackingService.ts, que processa os fixes
// de GPS em background — sobrevivendo ao repouso da tela.

// ─── Error Boundary ────────────────────────────────────────────────────────────

interface EBState {
  hasError: boolean;
  error: Error | null;
}
class DataErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[CyclingScreen] Crash interceptado:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#FEF2F2",
            margin: 12,
            borderRadius: 16,
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#DC2626", marginBottom: 10 }}>
            ⚠️ Erro no Módulo de Performance
          </Text>
          <Text style={{ fontSize: 12, color: "#7F1D1D", textAlign: "center", marginBottom: 10 }}>
            {this.state.error?.message || "Erro de renderização desconhecido."}
          </Text>
          <Text style={{ fontSize: 10, color: "#991B1B", textAlign: "center" }}>
            {this.state.error?.stack?.slice(0, 300)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const { width, height } = Dimensions.get("window");

type LatLng = { latitude: number; longitude: number };

/**
 * Calcula a região que enquadra toda a rota (vista de cima ampla, estilo Strava).
 * Acha o bounding box dos pontos e adiciona uma folga, garantindo um delta mínimo
 * para rotas muito curtas. Retorna null se não houver pontos.
 */
function regionForRoute(route: LatLng[], paddingRatio = 0.3) {
  if (!route || route.length === 0) return null;
  let minLat = route[0].latitude;
  let maxLat = route[0].latitude;
  let minLng = route[0].longitude;
  let maxLng = route[0].longitude;
  for (const p of route) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * (1 + paddingRatio), 0.0025),
    longitudeDelta: Math.max((maxLng - minLng) * (1 + paddingRatio), 0.0025),
  };
}

/** Marcadores de início (verde) e fim (escuro), estilo Strava. */
const RouteEndpoints: React.FC<{ route: LatLng[] }> = ({ route }) => {
  if (route.length < 2) return null;
  const start = route[0];
  const end = route[route.length - 1];
  return (
    <>
      <Marker coordinate={start} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View style={hs.startMarker} />
      </Marker>
      <Marker coordinate={end} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View style={hs.endMarker} />
      </Marker>
    </>
  );
};

// ─── Sheet: Lista de Histórico ──────────────────────────────────────────────

interface HistoryListProps {
  workouts: WorkoutRecord[];
  type: WorkoutType;
  records: PersonalRecords;
  onSelect: (w: WorkoutRecord) => void;
  onClose: () => void;
  formatDate: (iso: string) => string;
}

const HistoryList: React.FC<HistoryListProps> = ({
  workouts,
  type,
  records,
  onSelect,
  onClose,
  formatDate,
}) => {
  const accent = type === "Ciclismo" ? "#3B82F6" : "#10B981";

  // Marca quais registros são recorde para exibir o troféu.
  const isRecord = (w: WorkoutRecord) =>
    (records.longestDistanceKm > 0 && w.distanceKm === records.longestDistanceKm) ||
    (records.longestDurationSec > 0 && w.durationSec === records.longestDurationSec) ||
    (records.mostKcal > 0 && w.kcal === records.mostKcal);

  return (
    <View style={hs.container}>
      <View style={hs.header}>
        <Text style={hs.title}>Histórico · {type}</Text>
        <TouchableOpacity onPress={onClose} style={hs.closeBtn}>
          <Text style={hs.closeBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      {/* Recordes pessoais */}
      <View style={hs.recordsRow}>
        <View style={hs.recordCard}>
          <Trophy size={16} color="#F59E0B" />
          <Text style={hs.recordValue}>
            {records.longestDistanceKm > 0
              ? `${records.longestDistanceKm.toFixed(2).replace(".", ",")}`
              : "--"}
          </Text>
          <Text style={hs.recordLabel}>maior km</Text>
        </View>
        <View style={hs.recordCard}>
          <Trophy size={16} color="#F59E0B" />
          <Text style={hs.recordValue}>
            {records.longestDurationSec > 0 ? formatDuration(records.longestDurationSec) : "--"}
          </Text>
          <Text style={hs.recordLabel}>maior tempo</Text>
        </View>
        <View style={hs.recordCard}>
          <Trophy size={16} color="#F59E0B" />
          <Text style={hs.recordValue}>
            {records.bestPaceSecPerKm ? speedToPace(1000 / records.bestPaceSecPerKm) : "--"}
          </Text>
          <Text style={hs.recordLabel}>melhor pace</Text>
        </View>
      </View>

      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
      >
        {workouts.length === 0 ? (
          <View style={hs.empty}>
            <History size={40} color="#CBD5E1" />
            <Text style={hs.emptyTitle}>Nenhum treino ainda</Text>
            <Text style={hs.emptyText}>
              Finalize uma atividade de {type.toLowerCase()} para vê-la aqui.
            </Text>
          </View>
        ) : (
          workouts.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={hs.item}
              activeOpacity={0.8}
              onPress={() => onSelect(w)}
            >
              <View style={[hs.itemAccent, { backgroundColor: accent }]} />
              <View style={{ flex: 1 }}>
                <View style={hs.itemTopRow}>
                  <Text style={hs.itemDate}>{formatDate(w.date)}</Text>
                  {isRecord(w) && <Trophy size={14} color="#F59E0B" />}
                </View>
                <View style={hs.itemStats}>
                  <Text style={hs.itemMain}>{w.distanceKm.toFixed(2).replace(".", ",")} km</Text>
                  <Text style={hs.itemSub}>{formatDuration(w.durationSec)}</Text>
                  <Text style={hs.itemSub}>
                    {type === "Ciclismo" ? `${w.avgSpeedKmh} km/h` : `${w.avgPace} /km`}
                  </Text>
                  <Text style={hs.itemSub}>{w.kcal} kcal</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}
      </BottomSheetScrollView>
    </View>
  );
};

// ─── Sheet: Detalhe do treino ───────────────────────────────────────────────

interface WorkoutDetailProps {
  workout: WorkoutRecord;
  records: PersonalRecords;
  onBack: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}

const WorkoutDetail: React.FC<WorkoutDetailProps> = ({
  workout,
  records,
  onBack,
  onDelete,
  formatDate,
}) => {
  const accent = workout.type === "Ciclismo" ? "#3B82F6" : "#10B981";

  const safeRoute = workout.route.filter(
    (p) =>
      p &&
      typeof p.latitude === "number" &&
      isFinite(p.latitude) &&
      typeof p.longitude === "number" &&
      isFinite(p.longitude)
  );

  // Diferença vs. recorde da modalidade (para a comparação).
  const distDelta = workout.distanceKm - records.longestDistanceKm;

  // Região que enquadra a rota inteira (vista de cima).
  const fitRegion = regionForRoute(safeRoute);
  const hasRoute = safeRoute.length > 1 && fitRegion;

  // Tela cheia interativa do mapa.
  const [mapFull, setMapFull] = useState(false);
  const fullMapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const fitFullMap = () => {
    if (safeRoute.length < 2) return;
    fullMapRef.current?.fitToCoordinates(safeRoute, {
      edgePadding: { top: 80, right: 60, bottom: 120, left: 60 },
      animated: false,
    });
  };

  return (
    <View style={hs.container}>
      <View style={hs.header}>
        <TouchableOpacity onPress={onBack} style={hs.backBtn}>
          <ChevronLeft size={20} color="#1E293B" />
          <Text style={hs.backBtnText}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={hs.deleteBtn}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={hs.detailTitle}>{workout.type}</Text>
        <Text style={hs.detailDate}>{formatDate(workout.date)}</Text>

        {hasRoute ? (
          <TouchableOpacity
            style={hs.detailMap}
            activeOpacity={0.9}
            onPress={() => setMapFull(true)}
          >
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
              initialRegion={fitRegion!}
            >
              <Polyline
                coordinates={safeRoute}
                strokeColor={accent}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
              <RouteEndpoints route={safeRoute} />
            </MapView>
            {/* Botão de expandir (estilo Strava) */}
            <View style={hs.expandBadge}>
              <Maximize2 size={16} color="#1E293B" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={hs.noRouteBox}>
            <Navigation size={22} color="#94A3B8" />
            <Text style={hs.noRouteText}>Sem rota registrada para este treino</Text>
          </View>
        )}

        <View style={hs.detailGrid}>
          <View style={hs.detailCard}>
            <Text style={hs.detailValue}>{workout.distanceKm.toFixed(2).replace(".", ",")}</Text>
            <Text style={hs.detailLabel}>km</Text>
          </View>
          <View style={hs.detailCard}>
            <Text style={hs.detailValue}>{formatDuration(workout.durationSec)}</Text>
            <Text style={hs.detailLabel}>tempo</Text>
          </View>
          <View style={hs.detailCard}>
            <Text style={hs.detailValue}>
              {workout.type === "Ciclismo" ? workout.avgSpeedKmh : workout.avgPace}
            </Text>
            <Text style={hs.detailLabel}>
              {workout.type === "Ciclismo" ? "km/h méd" : "pace méd"}
            </Text>
          </View>
          <View style={hs.detailCard}>
            <Text style={hs.detailValue}>{workout.kcal}</Text>
            <Text style={hs.detailLabel}>kcal</Text>
          </View>
        </View>

        {/* Comparação com o recorde */}
        {records.longestDistanceKm > 0 && (
          <View style={hs.compareBox}>
            <Text style={hs.compareTitle}>Comparado ao seu recorde</Text>
            <Text style={hs.compareText}>
              {distDelta >= 0
                ? `🏆 Esta é sua maior distância em ${workout.type.toLowerCase()}!`
                : `Faltaram ${Math.abs(distDelta).toFixed(2).replace(".", ",")} km para bater seu recorde de ${records.longestDistanceKm.toFixed(2).replace(".", ",")} km.`}
            </Text>
          </View>
        )}

        {/* Splits */}
        {workout.splits.length > 0 && (
          <View style={hs.splitsBox}>
            <Text style={hs.splitsTitle}>Parciais (por km)</Text>
            <View style={hs.splitHead}>
              <Text style={hs.splitHeadText}>KM</Text>
              <Text style={hs.splitHeadText}>TEMPO</Text>
              <Text style={hs.splitHeadText}>PACE</Text>
            </View>
            {workout.splits.map((s) => (
              <View key={s.km} style={hs.splitRow}>
                <Text style={hs.splitNum}>{s.km}</Text>
                <Text style={hs.splitVal}>{s.time}</Text>
                <Text style={hs.splitVal}>{s.pace}</Text>
              </View>
            ))}
          </View>
        )}
      </BottomSheetScrollView>

      {/* ─── Mapa em tela cheia (interativo, estilo Strava) ───────────────── */}
      <Modal
        visible={mapFull}
        animationType="slide"
        onRequestClose={() => setMapFull(false)}
        statusBarTranslucent
      >
        <View style={hs.fullContainer}>
          {hasRoute && (
            <MapView
              ref={fullMapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              initialRegion={fitRegion!}
              onMapReady={fitFullMap}
              showsCompass={false}
              toolbarEnabled={false}
            >
              <Polyline
                coordinates={safeRoute}
                strokeColor={accent}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
              <RouteEndpoints route={safeRoute} />
            </MapView>
          )}

          {/* Botão fechar */}
          <TouchableOpacity
            style={hs.fullCloseBtn}
            onPress={() => setMapFull(false)}
            activeOpacity={0.8}
          >
            <X size={24} color="#1E293B" />
          </TouchableOpacity>

          {/* Overlay com os números do treino — acima dos botões nativos (safe area) */}
          <View style={[hs.fullStatsBar, { bottom: Math.max(insets.bottom, 12) + 18 }]}>
            <View style={hs.fullStat}>
              <Text style={hs.fullStatValue}>
                {workout.distanceKm.toFixed(2).replace(".", ",")}
              </Text>
              <Text style={hs.fullStatLabel}>km</Text>
            </View>
            <View style={hs.fullStatDivider} />
            <View style={hs.fullStat}>
              <Text style={hs.fullStatValue}>{formatDuration(workout.durationSec)}</Text>
              <Text style={hs.fullStatLabel}>tempo</Text>
            </View>
            <View style={hs.fullStatDivider} />
            <View style={hs.fullStat}>
              <Text style={hs.fullStatValue}>
                {workout.type === "Ciclismo" ? workout.avgSpeedKmh : workout.avgPace}
              </Text>
              <Text style={hs.fullStatLabel}>{workout.type === "Ciclismo" ? "km/h" : "pace"}</Text>
            </View>
            <View style={hs.fullStatDivider} />
            <View style={hs.fullStat}>
              <Text style={hs.fullStatValue}>{workout.kcal}</Text>
              <Text style={hs.fullStatLabel}>kcal</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const CyclingScreen: React.FC = () => {
  const navRoute = useRoute<any>();
  const routeDate = (() => {
    try {
      const d = navRoute.params?.date ? new Date(navRoute.params.date) : new Date();
      return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) {
      return new Date();
    }
  })();
  const dateStr = `${routeDate.getFullYear()}-${String(routeDate.getMonth() + 1).padStart(2, "0")}-${String(routeDate.getDate()).padStart(2, "0")}`;

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      routeDate.getDate() === today.getDate() &&
      routeDate.getMonth() === today.getMonth() &&
      routeDate.getFullYear() === today.getFullYear()
    );
  }, [routeDate]);

  const [activeTab, setActiveTab] = useState<"Ciclismo" | "Corrida" | "Maratona">("Ciclismo");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "92%"], []);

  // Estado de rastreamento: agora vem do serviço de tracking em background, que
  // sobrevive ao repouso da tela (tempo por relógio de parede + GPS via
  // foreground service). A tela apenas reflete o snapshot e dispara ações.
  const [snap, setSnap] = useState<TrackingSnapshot>(() => Tracker.getSnapshot());
  const [initialCenter, setInitialCenter] = useState<LatLng | null>(null);

  const isTracking = snap.active;
  const isPaused = snap.isPaused;
  const seconds = snap.elapsedSec;
  const distance = snap.distanceKm;
  const route = snap.route;
  const currentSpeedMs = snap.currentSpeedMs;

  // Histórico de treinos
  const [history, setHistory] = useState<WorkoutRecord[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(null);

  const loadHistory = useCallback(async () => {
    const list = await getWorkouts();
    setHistory(list);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Assina o serviço e re-hidrata uma sessão que tenha sobrevivido a um restart
  // do JS (ex.: o SO reabriu o app para entregar localização em background).
  useEffect(() => {
    const unsub = Tracker.subscribe(setSnap);
    Tracker.resumeIfActive();
    return unsub;
  }, []);

  // Enquanto o treino está ativo e a tela focada, um "tick" de 1s mantém o
  // relógio na tela em dia. NÃO é a fonte da verdade do tempo (isso é o relógio
  // de parede no serviço) — é só refresh.
  useEffect(() => {
    if (!isTracking) return;
    const id = setInterval(() => Tracker.tick(), 1000);
    return () => clearInterval(id);
  }, [isTracking]);

  // Centraliza o mapa na última posição conhecida ao abrir (rápido), antes mesmo
  // de iniciar o rastreamento.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const last = await Location.getLastKnownPositionAsync({});
        if (mounted && last) {
          setInitialCenter({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          });
        }
      } catch {
        // sem localização inicial: o mapa usa a região padrão
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const startTracking = async () => {
    const res = await Tracker.startTracking(activeTab === "Ciclismo" ? "Ciclismo" : "Corrida");
    if (!res.ok) {
      Alert.alert("Permissão negada", "Precisamos de acesso ao GPS para o MOVT Performance.");
    }
  };

  const togglePause = () => Tracker.togglePause();

  const finalizeAndSave = async () => {
    const final = await Tracker.stopTracking();
    const finalDistance = final.distanceKm;
    const finalSeconds = final.elapsedSec;

    // Não salva "treinos vazios" (parou logo após iniciar, sem deslocamento).
    if (finalDistance < 0.05 || finalSeconds < 5) {
      Alert.alert("Treino muito curto", "Não há dados suficientes para salvar este treino.");
      return;
    }

    try {
      const saved = await saveWorkout({
        type: activeTab === "Ciclismo" ? "Ciclismo" : "Corrida",
        durationSec: finalSeconds,
        distanceKm: finalDistance,
        kcal: estimateCalories(finalDistance),
        route: final.route,
        splits: final.splits,
      });

      await loadHistory();

      const broken = await checkRecords(saved);
      if (broken.length > 0) {
        Alert.alert(
          "🏆 Novo recorde!",
          `Você superou:\n\n${broken.map((b) => `• ${b.label}`).join("\n")}`,
          [{ text: "Incrível!", style: "default" }]
        );
      }

      // Abre o histórico já no treino recém-salvo.
      setSelectedWorkout(saved);
      handleOpenHistory();
    } catch (e) {
      console.error("[CyclingScreen] Falha ao salvar treino:", e);
      Alert.alert("Erro", "Não foi possível salvar o treino. Tente novamente.");
    }
  };

  const stopTracking = () => {
    Alert.alert("Finalizar Treino", "Deseja salvar este treino no seu histórico?", [
      { text: "Continuar", style: "cancel" },
      {
        text: "Finalizar e Salvar",
        style: "destructive",
        onPress: () => {
          finalizeAndSave();
        },
      },
    ]);
  };

  const handleDeleteWorkout = (id: string) => {
    Alert.alert("Excluir treino", "Tem certeza que deseja remover este treino do histórico?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deleteWorkout(id);
          await loadHistory();
          setSelectedWorkout(null);
        },
      },
    ]);
  };

  // Nota: NÃO encerramos o rastreamento ao desmontar a tela. O treino continua
  // rodando no serviço em background (foreground service), e a UI é restaurada
  // via subscribe/resumeIfActive ao voltar. Só "Finalizar" encerra a sessão.

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleOpenHistory = () => setIsHistoryOpen(true);
  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setSelectedWorkout(null);
  };

  // Recordes da modalidade atualmente listada (para destacar 🏆 no histórico).
  const historyType = activeTab === "Ciclismo" ? "Ciclismo" : "Corrida";
  const filteredHistory = useMemo(
    () => history.filter((w) => w.type === historyType),
    [history, historyType]
  );
  const records = useMemo(() => computeRecords(history, historyType), [history, historyType]);

  const formatWorkoutDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const safeCurrentSpeedMs =
    isFinite(currentSpeedMs) && !isNaN(currentSpeedMs) ? currentSpeedMs : 0;
  const currentSpeedKmh = (safeCurrentSpeedMs * 3.6).toFixed(1);
  const currentPace = speedToPace(safeCurrentSpeedMs);
  const safeDistance = isFinite(distance) && !isNaN(distance) ? distance : 0;
  const estimatedKcal = estimateCalories(safeDistance).toFixed(0);

  const safeRoute = useMemo(() => {
    return route.filter(
      (p: { latitude: number; longitude: number }) =>
        p &&
        typeof p.latitude === "number" &&
        !isNaN(p.latitude) &&
        isFinite(p.latitude) &&
        typeof p.longitude === "number" &&
        !isNaN(p.longitude) &&
        isFinite(p.longitude)
    );
  }, [route]);

  // Posição "ao vivo": último fix do treino em andamento, ou a posição conhecida
  // ao abrir a tela (antes de iniciar).
  const liveLatLng = snap.lastLocation || initialCenter;
  const hasValidLocation = useMemo(() => {
    return (
      !!liveLatLng &&
      typeof liveLatLng.latitude === "number" &&
      !isNaN(liveLatLng.latitude) &&
      isFinite(liveLatLng.latitude) &&
      typeof liveLatLng.longitude === "number" &&
      !isNaN(liveLatLng.longitude) &&
      isFinite(liveLatLng.longitude)
    );
  }, [liveLatLng]);

  return (
    <DataErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <BackButton to={{ name: "DataScreen" }} />
          <Text style={styles.headerTitle}>MOVT Performance</Text>
          <TouchableOpacity onPress={handleOpenHistory} style={styles.infoBtn}>
            <History size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabSelector}>
            {["Ciclismo", "Corrida"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={[
                  styles.tab,
                  activeTab === tab && {
                    backgroundColor: activeTab === "Ciclismo" ? "#3B82F6" : "#10B981",
                  },
                ]}
                disabled={isTracking}
              >
                <Text style={[styles.tabText, activeTab === tab && { color: "#FFF" }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={
                hasValidLocation && liveLatLng
                  ? {
                      latitude: liveLatLng.latitude,
                      longitude: liveLatLng.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }
                  : {
                      latitude: -23.5555,
                      longitude: -46.6383,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }
              }
            >
              {safeRoute.length > 1 && (
                <Polyline
                  coordinates={safeRoute}
                  strokeColor={activeTab === "Ciclismo" ? "#3B82F6" : "#10B981"}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {hasValidLocation && liveLatLng && (
                <Marker
                  coordinate={{
                    latitude: liveLatLng.latitude,
                    longitude: liveLatLng.longitude,
                  }}
                >
                  <View
                    style={[
                      styles.currentLocationMarker,
                      { backgroundColor: activeTab === "Ciclismo" ? "#3B82F6" : "#10B981" },
                    ]}
                  />
                </Marker>
              )}
            </MapView>

            <View style={styles.hudOverlay}>
              <View style={styles.hudGrid}>
                <View style={styles.hudCard}>
                  <Navigation size={16} color="#3B82F6" />
                  <View style={styles.hudCardValueContainer}>
                    <Text style={styles.hudCardValue}>{distance.toFixed(2)}</Text>
                    <Text style={styles.hudCardUnit}>km</Text>
                  </View>
                </View>
                <View style={styles.hudCard}>
                  <Timer size={16} color="#10B981" />
                  <View style={styles.hudCardValueContainer}>
                    <Text style={styles.hudCardValue}>{formatDuration(seconds)}</Text>
                    <Text style={styles.hudCardUnit}>tempo</Text>
                  </View>
                </View>
                <View style={styles.hudCard}>
                  <Zap size={16} color="#EF4444" />
                  <View style={styles.hudCardValueContainer}>
                    <Text style={styles.hudCardValue}>
                      {activeTab === "Ciclismo" ? currentSpeedKmh : currentPace}
                    </Text>
                    <Text style={styles.hudCardUnit}>
                      {activeTab === "Ciclismo" ? "km/h" : "pace/km"}
                    </Text>
                  </View>
                </View>
                <View style={styles.hudCard}>
                  <Flame size={16} color="#F97316" />
                  <View style={styles.hudCardValueContainer}>
                    <Text style={styles.hudCardValue}>{estimatedKcal}</Text>
                    <Text style={styles.hudCardUnit}>kcal</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.controlContainer}>
            {isToday ? (
              !isTracking ? (
                <TouchableOpacity
                  style={[styles.mainButton, { backgroundColor: "#BBF246" }]}
                  onPress={startTracking}
                  activeOpacity={0.8}
                >
                  <Play size={24} color="#000" fill="#000" />
                  <Text style={styles.mainButtonText}>INICIAR {activeTab.toUpperCase()}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.activeControls}>
                  <TouchableOpacity style={[styles.roundButton]} onPress={togglePause}>
                    {isPaused ? (
                      <Play size={24} color="#000" fill="#000" />
                    ) : (
                      <Pause size={24} color="#000" fill="#000" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stopButton, { backgroundColor: "#EF4444" }]}
                    onPress={stopTracking}
                  >
                    <Square size={24} color="#FFF" fill="#FFF" />
                    <Text style={styles.stopButtonText}>FINALIZAR</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View
                style={{
                  padding: 18,
                  alignItems: "center",
                  backgroundColor: "#F8FAFC",
                  borderRadius: 16,
                  width: "100%",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text
                  style={{ color: "#64748B", fontSize: 14, fontWeight: "600", textAlign: "center" }}
                >
                  Rastreamento indisponível para dias passados
                </Text>
              </View>
            )}
          </View>

          <View style={styles.insightContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tendências de Esforço</Text>
            </View>

            <TouchableOpacity
              style={styles.mainInsightCard}
              activeOpacity={0.85}
              onPress={handleOpenHistory}
            >
              <LinearGradient colors={["#F8FAFC", "#F1F5F9"]} style={styles.insightGradient}>
                <View style={styles.insightLeft}>
                  <View style={styles.insightIconCircle}>
                    <History size={24} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.insightLabel}>Histórico de treinos</Text>
                    <Text style={styles.insightValue}>
                      {filteredHistory.length > 0
                        ? `${filteredHistory.length} ${historyType.toLowerCase()}${filteredHistory.length > 1 ? "s" : ""} registrada${filteredHistory.length > 1 ? "s" : ""}`
                        : "Compare suas atividades e bata recordes"}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#3B82F6" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.smallStatCard}>
                <Heart size={20} color="#EF4444" />
                <Text style={styles.smallStatLabel}>BPM Médio</Text>
                <Text style={styles.smallStatValue}>--</Text>
              </View>
              <View style={styles.smallStatCard}>
                <Flame size={20} color="#F97316" />
                <Text style={styles.smallStatLabel}>Calorias</Text>
                <Text style={styles.smallStatValue}>{estimatedKcal}</Text>
              </View>
              <View style={styles.smallStatCard}>
                <Droplets size={20} color="#3B82F6" />
                <Text style={styles.smallStatLabel}>Hidratação</Text>
                <Text style={styles.smallStatValue}>0L</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Esconde a barra de navegação de dados enquanto o histórico está aberto,
            para que ela não fique por cima do sheet (zIndex alto). */}
        {!isHistoryOpen && <DataPillNavigator currentScreen="CyclingScreen" />}

        {/* ─── Sheet de Histórico ───────────────────────────────────────── */}
        {/* Montado só quando aberto (padrão do projeto), evitando que o sheet
            anime para aberto no mount da tela. */}
        {isHistoryOpen && (
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.bsBackground}
            onClose={handleCloseHistory}
          >
            <BottomSheetView style={{ flex: 1 }}>
              {selectedWorkout ? (
                <WorkoutDetail
                  workout={selectedWorkout}
                  records={computeRecords(history, selectedWorkout.type)}
                  onBack={() => setSelectedWorkout(null)}
                  onDelete={() => handleDeleteWorkout(selectedWorkout.id)}
                  formatDate={formatWorkoutDate}
                />
              ) : (
                <HistoryList
                  workouts={filteredHistory}
                  type={historyType}
                  records={records}
                  onSelect={(w) => {
                    setSelectedWorkout(w);
                    // Abre o sheet por completo para caber o detalhe e habilitar o
                    // scroll vertical (o scroll do conteúdo só atua no snap do topo).
                    bottomSheetRef.current?.snapToIndex(1);
                  }}
                  onClose={handleCloseHistory}
                  formatDate={formatWorkoutDate}
                />
              )}
            </BottomSheetView>
          </BottomSheet>
        )}
      </SafeAreaView>
    </DataErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B", letterSpacing: -0.5 },
  tabsContainer: { paddingHorizontal: 20, paddingBottom: 15 },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 2,
    width: "100%",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 18 },
  tabText: { fontSize: 14, fontWeight: "800", color: "#64748B" },
  activeTab: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoBtn: { padding: 8 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  mapContainer: {
    height: height * 0.4,
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: "hidden",
    marginTop: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  map: { ...StyleSheet.absoluteFillObject },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#FFF",
    elevation: 4,
  },
  hudOverlay: { position: "absolute", bottom: 15, left: 15, right: 15 },
  hudGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hudCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hudCardValueContainer: { flex: 1 },
  hudCardValue: { fontSize: 18, fontWeight: "900", color: "#000", letterSpacing: -0.5 },
  hudCardUnit: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: -2,
  },
  controlContainer: { paddingHorizontal: 20, marginTop: 25 },
  mainButton: {
    flexDirection: "row",
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mainButtonText: { fontSize: 18, fontWeight: "900", color: "#000" },
  activeControls: { flexDirection: "row", gap: 15 },
  roundButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  stopButton: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stopButtonText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
  insightContainer: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  mainInsightCard: { borderRadius: 24, overflow: "hidden", marginBottom: 20 },
  insightGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  insightLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  insightIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  insightLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", color: "#3B82F6" },
  insightValue: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12 },
  smallStatCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  smallStatLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
  },
  smallStatValue: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginTop: 4 },
  bsBackground: { backgroundColor: "#FFFFFF", borderRadius: 32 },
  bsContainer: { flex: 1, padding: 24 },
  bsHeader: { flexDirection: "row", alignItems: "center", gap: 15, marginBottom: 30 },
  bsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bsTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  bsSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  bsSection: { marginBottom: 25 },
  bsSectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 15 },
  splitsTable: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  splitRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  splitHeaderText: { fontSize: 10, fontWeight: "900", color: "#94A3B8" },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  splitNum: { fontSize: 14, fontWeight: "900", color: "#1E293B" },
  splitValue: { fontSize: 14, fontWeight: "700", color: "#475569" },
  bsCloseBtn: {
    backgroundColor: "#1E293B",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  bsCloseBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});

// Estilos do sheet de histórico/detalhe
const hs = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "900", color: "#1E293B", letterSpacing: -0.5 },
  closeBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  closeBtnText: { fontSize: 14, fontWeight: "800", color: "#64748B" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  backBtnText: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  deleteBtn: { padding: 8 },

  recordsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  recordCard: {
    flex: 1,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 2,
  },
  recordValue: { fontSize: 15, fontWeight: "900", color: "#92400E" },
  recordLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },

  empty: { alignItems: "center", paddingTop: 50, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#475569" },
  emptyText: { fontSize: 13, color: "#94A3B8", textAlign: "center", paddingHorizontal: 30 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemAccent: { width: 4, alignSelf: "stretch", borderRadius: 4 },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemDate: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  itemStats: { flexDirection: "row", alignItems: "baseline", gap: 12, flexWrap: "wrap" },
  itemMain: { fontSize: 17, fontWeight: "900", color: "#1E293B" },
  itemSub: { fontSize: 13, fontWeight: "700", color: "#64748B" },

  detailTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  detailDate: { fontSize: 13, fontWeight: "700", color: "#94A3B8", marginTop: 2, marginBottom: 16 },
  detailMap: {
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 18,
  },
  expandBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  startMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  endMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  noRouteBox: {
    height: 120,
    borderRadius: 24,
    marginBottom: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noRouteText: { fontSize: 13, fontWeight: "600", color: "#94A3B8" },
  fullContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fullStatsBar: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  fullStat: { alignItems: "center", flex: 1 },
  fullStatValue: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  fullStatLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginTop: 2,
  },
  fullStatDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  detailCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailValue: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  detailLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginTop: 2,
  },
  compareBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  compareTitle: { fontSize: 12, fontWeight: "900", color: "#166534", textTransform: "uppercase" },
  compareText: { fontSize: 14, fontWeight: "600", color: "#15803D", marginTop: 6 },
  splitsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  splitsTitle: { fontSize: 14, fontWeight: "900", color: "#1E293B", marginBottom: 12 },
  splitHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  splitHeadText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    flex: 1,
    textAlign: "center",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  splitNum: { fontSize: 14, fontWeight: "900", color: "#1E293B", flex: 1, textAlign: "center" },
  splitVal: { fontSize: 14, fontWeight: "700", color: "#475569", flex: 1, textAlign: "center" },
});

export default withPremiumGate(
  CyclingScreen,
  "dadosAvancados",
  "Ciclismo",
  "O rastreamento de ciclismo por GPS é exclusivo dos planos Premium e Família.",
  { name: "DataScreen" }
);
