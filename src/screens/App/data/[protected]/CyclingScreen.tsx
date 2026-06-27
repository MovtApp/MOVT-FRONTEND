import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
  Animated,
  Share,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, type Camera } from "react-native-maps";
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
  Crosshair,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Reanimated, { Easing as REasing, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
import { simplifyRoute } from "../../../../utils/workout/geo";
import { snapRoute } from "../../../../services/mapMatchingService";
import { generateWorkoutCard, shareImageFile } from "../../../../services/shareWorkoutService";
import { toastInfo, toastError, notifyApiError } from "../../../../utils/notify";
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

// ─── Zoom adaptativo à velocidade (estilo Uber: afasta ao acelerar) ──────────────
// Velocidade de referência onde a câmera fica no zoom mais "largo" (~16 m/s ≈ 58 km/h).
const SPEED_FOR_WIDE_MS = 16;

/** Zoom (nível Google/Android) em função da velocidade: perto parado, largo rápido. */
function zoomForSpeed(speedMs: number): number {
  const v = isFinite(speedMs) && speedMs > 0 ? speedMs : 0;
  return 17 - (Math.min(v, SPEED_FOR_WIDE_MS) / SPEED_FOR_WIDE_MS) * 2; // 17 → 15
}

/** Altitude (metros, usada no iOS) em função da velocidade: baixa parado, alta rápido. */
function altitudeForSpeed(speedMs: number): number {
  const v = isFinite(speedMs) && speedMs > 0 ? speedMs : 0;
  return 800 + (Math.min(v, SPEED_FOR_WIDE_MS) / SPEED_FOR_WIDE_MS) * 1700; // 800 → 2500
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

  // Re-snap do histórico: treinos salvos com `routeSnapped` vazio (ex.: o snap
  // falhava por falta de token) tentam o map-matching de novo ao abrir o detalhe.
  // Apenas para exibição (não persiste); se falhar, mantém a rota crua.
  const [snappedOverride, setSnappedOverride] = useState<LatLng[] | null>(null);
  useEffect(() => {
    setSnappedOverride(null);
    if (Array.isArray(workout.routeSnapped) && workout.routeSnapped.length > 1) return;
    const raw = (Array.isArray(workout.route) ? workout.route : []).filter(
      (p) =>
        p &&
        typeof p.latitude === "number" &&
        isFinite(p.latitude) &&
        typeof p.longitude === "number" &&
        isFinite(p.longitude)
    );
    if (raw.length < 2) return;
    let alive = true;
    snapRoute(raw, workout.type).then((r) => {
      if (alive && r && r.snapped.length > 1) setSnappedOverride(r.snapped);
    });
    return () => {
      alive = false;
    };
  }, [workout.id, workout.routeSnapped, workout.route, workout.type]);

  // Prefere a rota encaixada nas ruas (map-matching salvo → re-snap → crua).
  // Simplifica (Douglas-Peucker) para renderizar liso e leve, sem perder a forma.
  const safeRoute = useMemo(() => {
    const source =
      Array.isArray(workout.routeSnapped) && workout.routeSnapped.length > 1
        ? workout.routeSnapped
        : snappedOverride && snappedOverride.length > 1
          ? snappedOverride
          : workout.route;
    const cleaned = source.filter(
      (p) =>
        p &&
        typeof p.latitude === "number" &&
        isFinite(p.latitude) &&
        typeof p.longitude === "number" &&
        isFinite(p.longitude)
    );
    return simplifyRoute(cleaned, 4);
  }, [workout.routeSnapped, workout.route, snappedOverride]);

  // Diferença vs. recorde da modalidade (para a comparação).
  const distDelta = workout.distanceKm - records.longestDistanceKm;

  // Região que enquadra a rota inteira (vista de cima).
  const fitRegion = regionForRoute(safeRoute);
  const hasRoute = safeRoute.length > 1 && fitRegion;

  // Estatísticas derivadas (painel detalhado) a partir das parciais e dos totais.
  const extraStats = useMemo(() => {
    const splitSecs = workout.splits
      .map((s) => {
        const [m, ss] = String(s.pace).split(":").map((n) => parseInt(n, 10));
        return (m || 0) * 60 + (ss || 0);
      })
      .filter((n) => isFinite(n) && n > 0);
    const fmtPace = (sec: number) =>
      sec > 0 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : "--";
    const best = splitSecs.length ? Math.min(...splitSecs) : 0;
    const worst = splitSecs.length ? Math.max(...splitSecs) : 0;
    return {
      hasSplits: splitSecs.length > 0,
      bestKm: fmtPace(best),
      worstKm: fmtPace(worst),
      timePerKm:
        workout.distanceKm > 0
          ? formatDuration(Math.round(workout.durationSec / workout.distanceKm))
          : "--",
      kcalPerKm:
        workout.distanceKm > 0 ? `${Math.round(workout.kcal / workout.distanceKm)}` : "--",
      kcalPerMin:
        workout.durationSec > 0
          ? (workout.kcal / (workout.durationSec / 60)).toFixed(1)
          : "--",
    };
  }, [workout]);

  // Linhas do painel "Estatísticas" (ícone · rótulo · valor).
  const statRows = useMemo(() => {
    const isCycling = workout.type === "Ciclismo";
    const rows: { icon: any; label: string; value: string }[] = [
      {
        icon: TrendingUp,
        label: isCycling ? "Vel. média" : "Ritmo médio",
        value: isCycling ? `${workout.avgSpeedKmh} km/h` : `${workout.avgPace} /km`,
      },
      {
        icon: Timer,
        label: "Tempo médio / km",
        value: extraStats.timePerKm !== "--" ? `${extraStats.timePerKm} /km` : "--",
      },
    ];
    if (extraStats.hasSplits) {
      rows.push(
        { icon: Trophy, label: "Melhor km", value: `${extraStats.bestKm} /km` },
        { icon: Navigation, label: "Km mais lento", value: `${extraStats.worstKm} /km` }
      );
    }
    rows.push(
      {
        icon: Flame,
        label: "Calorias / km",
        value: extraStats.kcalPerKm !== "--" ? `${extraStats.kcalPerKm} kcal` : "--",
      },
      {
        icon: Zap,
        label: "Calorias / min",
        value: extraStats.kcalPerMin !== "--" ? `${extraStats.kcalPerMin} kcal` : "--",
      }
    );
    return rows;
  }, [workout, extraStats]);

  // Tela cheia interativa do mapa.
  const [mapFull, setMapFull] = useState(false);
  const fullMapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  // ─── Compartilhar (card estilo Strava gerado no backend) ─────────────────────
  // Fluxo: gerar a imagem no backend → mostrar no preview → confirmar e abrir o
  // menu nativo de compartilhamento.
  const [sharing, setSharing] = useState(false); // gerando a imagem
  const [previewUri, setPreviewUri] = useState<string | null>(null); // imagem no preview
  const [sharingNow, setSharingNow] = useState(false); // abrindo o menu de compartilhar

  const handleShare = async () => {
    if (sharing) return;
    if (safeRoute.length < 2) {
      toastError("Sem rota para compartilhar", "Este treino não tem trajeto registrado.");
      return;
    }
    setSharing(true);
    toastInfo("Gerando imagem do treino…");
    try {
      const uri = await generateWorkoutCard({
        route: safeRoute,
        type: workout.type,
        title: workout.type,
        subtitle: formatDate(workout.date),
        stats: [
          { label: "km", value: workout.distanceKm.toFixed(2).replace(".", ",") },
          { label: "tempo", value: formatDuration(workout.durationSec) },
          workout.type === "Ciclismo"
            ? { label: "km/h", value: String(workout.avgSpeedKmh) }
            : { label: "pace", value: workout.avgPace },
          { label: "kcal", value: String(workout.kcal) },
        ],
      });
      setPreviewUri(uri);
    } catch (e) {
      notifyApiError(e, "Não foi possível gerar a imagem do treino.");
    } finally {
      setSharing(false);
    }
  };

  const confirmShare = async () => {
    if (!previewUri || sharingNow) return;
    setSharingNow(true);
    try {
      await shareImageFile(previewUri);
    } catch (e) {
      notifyApiError(e, "Não foi possível compartilhar a imagem.");
    } finally {
      setSharingNow(false);
    }
  };

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
        <View style={hs.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={hs.shareBtn}
            disabled={sharing}
            activeOpacity={0.8}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Share2 size={18} color={accent} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={hs.deleteBtn}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
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

            {/* Estatísticas principais sobre o mapa (estilo Strava) */}
            <LinearGradient
              colors={["transparent", "rgba(2,6,23,0.88)"]}
              style={hs.mapStatsScrim}
              pointerEvents="none"
            >
              <View style={hs.mapStatsRow}>
                <View style={hs.mapStat}>
                  <Text style={hs.mapStatValue}>
                    {workout.distanceKm.toFixed(2).replace(".", ",")}
                  </Text>
                  <Text style={hs.mapStatLabel}>km</Text>
                </View>
                <View style={hs.mapStatDivider} />
                <View style={hs.mapStat}>
                  <Text style={hs.mapStatValue}>{formatDuration(workout.durationSec)}</Text>
                  <Text style={hs.mapStatLabel}>tempo</Text>
                </View>
                <View style={hs.mapStatDivider} />
                <View style={hs.mapStat}>
                  <Text style={hs.mapStatValue}>
                    {workout.type === "Ciclismo" ? workout.avgSpeedKmh : workout.avgPace}
                  </Text>
                  <Text style={hs.mapStatLabel}>
                    {workout.type === "Ciclismo" ? "km/h" : "pace"}
                  </Text>
                </View>
                <View style={hs.mapStatDivider} />
                <View style={hs.mapStat}>
                  <Text style={hs.mapStatValue}>{workout.kcal}</Text>
                  <Text style={hs.mapStatLabel}>kcal</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Botão de expandir (estilo Strava) */}
            <View style={hs.expandBadge}>
              <Maximize2 size={16} color="#1E293B" />
            </View>
          </TouchableOpacity>
        ) : (
          <>
            <View style={hs.noRouteBox}>
              <Navigation size={22} color="#94A3B8" />
              <Text style={hs.noRouteText}>Sem rota registrada para este treino</Text>
            </View>
            {/* Sem mapa para sobrepor: mostra os números principais aqui. */}
            <View style={hs.detailGrid}>
              <View style={hs.detailCard}>
                <Text style={hs.detailValue}>
                  {workout.distanceKm.toFixed(2).replace(".", ",")}
                </Text>
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
          </>
        )}

        {/* Painel de estatísticas detalhadas */}
        <View style={hs.statsBox}>
          <Text style={hs.statsTitle}>Estatísticas</Text>
          {statRows.map((r, i) => {
            const Icon = r.icon;
            return (
              <View key={r.label}>
                {i > 0 && <View style={hs.statRowDivider} />}
                <View style={hs.statRow}>
                  <View style={hs.statRowLeft}>
                    <Icon size={18} color={accent} />
                    <Text style={hs.statRowLabel}>{r.label}</Text>
                  </View>
                  <Text style={hs.statRowValue}>{r.value}</Text>
                </View>
              </View>
            );
          })}
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

      {/* ─── Preview da imagem antes de compartilhar ───────────────────────── */}
      <Modal
        visible={!!previewUri}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewUri(null)}
        statusBarTranslucent
      >
        <View style={hs.previewBackdrop}>
          <View style={[hs.previewSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={hs.previewHeader}>
              <Text style={hs.previewTitle}>Pré-visualização</Text>
              <TouchableOpacity onPress={() => setPreviewUri(null)} style={hs.previewClose}>
                <X size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {previewUri && (
              <Image
                source={{ uri: previewUri }}
                style={hs.previewImage}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              style={[hs.previewShareBtn, { backgroundColor: accent }]}
              onPress={confirmShare}
              disabled={sharingNow}
              activeOpacity={0.85}
            >
              {sharingNow ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Share2 size={20} color="#FFFFFF" />
                  <Text style={hs.previewShareText}>Compartilhar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Tela de pausa: estatísticas da corrida em andamento ─────────────────────

// Transições "subir + fade" da tela de espera (reanimated, controle exato do
// deslocamento). Entrada: sobe 40px + fade-in; saída: desce 30px + fade-out.
const pausedEntering = () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 40 }] },
    animations: {
      opacity: withTiming(1, { duration: 320, easing: REasing.out(REasing.cubic) }),
      transform: [{ translateY: withTiming(0, { duration: 320, easing: REasing.out(REasing.cubic) }) }],
    },
  };
};
const pausedExiting = () => {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: 220, easing: REasing.in(REasing.cubic) }),
      transform: [{ translateY: withTiming(30, { duration: 220, easing: REasing.in(REasing.cubic) }) }],
    },
  };
};
// Fade rápido ao trocar de categoria de métrica (swipe ou botão).
const fadeRows = () => {
  "worklet";
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withTiming(1, { duration: 180 }) },
  };
};

interface PausedStatsProps {
  type: WorkoutType;
  distanceKm: number;
  seconds: number;
  currentSpeedMs: number;
  maxSpeedMs: number;
  elevationGainM: number;
  splits: TrackingSnapshot["splits"];
  route: LatLng[];
  mapRef: React.RefObject<MapView | null>;
  onResume: () => void;
  onStop: () => void;
  onClose: () => void;
}

const PausedStats: React.FC<PausedStatsProps> = ({
  type,
  distanceKm,
  seconds,
  currentSpeedMs,
  maxSpeedMs,
  elevationGainM,
  splits,
  route,
  mapRef,
  onResume,
  onStop,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const isCycling = type === "Ciclismo";
  // Verde padrão do projeto (lime de marca) — fundo sólido vivo da tela de espera.
  const GREEN = "#BBF246";
  const GREEN_TEXT = "#365314"; // verde escuro, legível como texto sobre o lime vivo

  // Médias derivadas de distância ÷ tempo (m/s).
  const avgMs = seconds > 0 ? (distanceKm * 1000) / seconds : 0;
  const avgValue = isCycling ? (avgMs * 3.6).toFixed(1) : speedToPace(avgMs);
  const curValue = isCycling
    ? (currentSpeedMs * 3.6).toFixed(1)
    : speedToPace(currentSpeedMs);
  const unitLabel = isCycling ? "km/h" : "pace";
  const kcalNum = estimateCalories(distanceKm);
  const kcal = kcalNum.toFixed(0);

  // ─── Métricas da lista (por categoria/aba) ──────────────────────────────────
  const [statTab, setStatTab] = useState<"ritmo" | "velocidade" | "tempo" | "esforco">("ritmo");

  // Helpers de formatação.
  const fmtPace = (sec: number) =>
    sec > 0 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} /km` : "--";
  const kmhFromPace = (sec: number) => (sec > 0 ? `${((1000 / sec) * 3.6).toFixed(1)} km/h` : "--");

  // Pace (segundos) de cada parcial.
  const splitSecs = splits
    .map((s) => {
      const [m, ss] = String(s.pace).split(":").map((n) => parseInt(n, 10));
      return (m || 0) * 60 + (ss || 0);
    })
    .filter((n) => isFinite(n) && n > 0);
  const bestSec = splitSecs.length ? Math.min(...splitSecs) : 0;
  const worstSec = splitSecs.length ? Math.max(...splitSecs) : 0;
  const lastSec = splitSecs.length ? splitSecs[splitSecs.length - 1] : 0;

  // Configuração das abas e suas linhas (ícone · rótulo · valor).
  const STAT_TABS: { key: typeof statTab; label: string }[] = [
    { key: "ritmo", label: "Ritmo" },
    { key: "velocidade", label: "Velocidade" },
    { key: "tempo", label: "Tempo & Distância" },
    { key: "esforco", label: "Esforço" },
  ];
  const statRows: Record<typeof statTab, { icon: any; label: string; value: string }[]> = {
    ritmo: [
      { icon: TrendingUp, label: "Ritmo médio", value: speedToPace(avgMs) === "--:--" ? "--" : `${speedToPace(avgMs)} /km` },
      { icon: Zap, label: "Ritmo atual", value: speedToPace(currentSpeedMs) === "--:--" ? "--" : `${speedToPace(currentSpeedMs)} /km` },
      { icon: Trophy, label: "Melhor km", value: fmtPace(bestSec) },
      { icon: Timer, label: "Km mais lento", value: fmtPace(worstSec) },
      { icon: Navigation, label: "Último km", value: fmtPace(lastSec) },
    ],
    velocidade: [
      { icon: TrendingUp, label: "Vel. média", value: avgMs > 0 ? `${(avgMs * 3.6).toFixed(1)} km/h` : "--" },
      { icon: Zap, label: "Vel. atual", value: `${(currentSpeedMs * 3.6).toFixed(1)} km/h` },
      { icon: Mountain, label: "Pico de velocidade", value: maxSpeedMs > 0 ? `${(maxSpeedMs * 3.6).toFixed(1)} km/h` : "--" },
      { icon: Navigation, label: "Vel. último km", value: kmhFromPace(lastSec) },
    ],
    tempo: [
      { icon: Navigation, label: "Distância total", value: `${distanceKm.toFixed(2).replace(".", ",")} km` },
      { icon: Timer, label: "Tempo", value: formatDuration(seconds) },
      { icon: TrendingUp, label: "Tempo médio/km", value: distanceKm > 0 ? `${formatDuration(Math.round(seconds / distanceKm))} /km` : "--" },
      { icon: Trophy, label: "Parciais completas", value: `${splits.length}` },
    ],
    esforco: [
      { icon: Flame, label: "Calorias", value: `${kcal} kcal` },
      { icon: TrendingUp, label: "Calorias / km", value: distanceKm > 0 ? `${(kcalNum / distanceKm).toFixed(0)} kcal` : "--" },
      { icon: Timer, label: "Calorias / min", value: seconds > 0 ? `${(kcalNum / (seconds / 60)).toFixed(1)} kcal` : "--" },
      { icon: Mountain, label: "Ganho de elevação", value: `${Math.round(elevationGainM)} m` },
    ],
  };

  // Arrastar para o lado troca de categoria (esquerda = próxima, direita = anterior).
  // Circular: do último volta para o primeiro e do primeiro para o último.
  const changeTab = (dir: number) => {
    setStatTab((cur) => {
      const order = STAT_TABS.map((t) => t.key);
      const i = order.indexOf(cur);
      const next = (i + dir + order.length) % order.length;
      return order[next];
    });
  };
  const swipeTabs = Gesture.Pan()
    .activeOffsetX([-20, 20]) // só ativa no movimento horizontal
    .failOffsetY([-15, 15]) // deixa o scroll vertical ganhar nos arrastes verticais
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX <= -40) changeTab(1);
      else if (e.translationX >= 40) changeTab(-1);
    });

  // Barras do mini-gráfico de "ritmo por km": parcial mais rápida = barra mais alta.
  const paceBars = (() => {
    const secs = splits
      .map((s) => {
        const [m, ss] = String(s.pace).split(":").map((n) => parseInt(n, 10));
        return (m || 0) * 60 + (ss || 0);
      })
      .filter((n) => isFinite(n) && n > 0)
      .slice(-7);
    if (secs.length < 2) return [] as number[];
    const max = Math.max(...secs);
    const min = Math.min(...secs);
    return secs.map((s) => (max === min ? 0.6 : ((max - s) / (max - min)) * 0.7 + 0.3));
  })();

  const hasRoute = route.length > 1;
  const fitRegion = hasRoute ? regionForRoute(route) : null;
  const fitMap = () => {
    if (route.length < 2) return;
    mapRef.current?.fitToCoordinates(route, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: false,
    });
  };

  // Compartilha um resumo da corrida pelo menu nativo do sistema.
  const shareSummary = async () => {
    const emoji = isCycling ? "🚴" : "🏃";
    const avgLine = isCycling ? `${avgValue} km/h méd` : `${avgValue} /km méd`;
    try {
      await Share.share({
        message:
          `${emoji} ${type} no MOVT\n` +
          `📍 ${distanceKm.toFixed(2).replace(".", ",")} km\n` +
          `⏱️ ${formatDuration(seconds)}\n` +
          `⚡ ${avgLine}\n` +
          `🔥 ${kcal} kcal`,
      });
    } catch {
      // usuário cancelou ou compartilhamento indisponível — silencioso
    }
  };

  return (
    <Reanimated.View style={ps.overlay} entering={pausedEntering} exiting={pausedExiting}>
      {/* Fundo verde sólido (lime de marca) sobre o mapa — cor viva 100%. */}
      <View style={ps.scrim} pointerEvents="none" />

      {/* Header */}
      <View style={[ps.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={ps.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <X size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={ps.headerCenter}>
          <Text style={ps.headerTitle}>PAUSADO</Text>
          <Text style={[ps.headerSub, { color: GREEN_TEXT }]}>{type.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={ps.closeBtn} onPress={shareSummary} activeOpacity={0.8}>
          <Share2 size={20} color="#1A2E05" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={ps.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bento grid — mosaico assimétrico */}
        <View style={ps.bentoRow}>
          <View style={[ps.tile, ps.tileFlex]}>
            <Text style={ps.tileHeroValue}>{distanceKm.toFixed(2)}</Text>
            <Text style={ps.tileLabel}>quilômetros</Text>
          </View>
          <View style={[ps.tile, ps.tileFlex]}>
            <Text style={ps.tileValue}>{formatDuration(seconds)}</Text>
            <Text style={ps.tileLabel}>tempo</Text>
          </View>
        </View>

        <View style={ps.bentoRow}>
          <View style={[ps.tile, ps.tilePace]}>
            <Text style={ps.tileValue}>{avgValue}</Text>
            <Text style={ps.tileLabel}>{unitLabel} méd</Text>
            <View style={ps.tileDivider} />
            <Text style={ps.tileSubValue}>
              {curValue}
              <Text style={ps.tileSubUnit}> atual</Text>
            </Text>
          </View>
          <View style={[ps.tile, ps.tileWide]}>
            <View style={ps.tileWideTop}>
              <Text style={ps.tileValue}>{kcal}</Text>
              <Text style={ps.tileLabel}>kcal</Text>
            </View>
            <View style={ps.chart}>
              {paceBars.length > 0
                ? paceBars.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        ps.bar,
                        {
                          height: `${Math.round(h * 100)}%`,
                          backgroundColor: i === paceBars.length - 1 ? GREEN : "#1A2E05",
                        },
                      ]}
                    />
                  ))
                : [0.4, 0.6, 0.5, 0.7, 0.55].map((h, i) => (
                    <View key={i} style={[ps.bar, ps.barEmpty, { height: `${h * 100}%` }]} />
                  ))}
            </View>
            <Text style={ps.chartLabel}>ritmo por km</Text>
          </View>
        </View>

        {/* Mini-mapa da rota até agora */}
        {hasRoute && fitRegion ? (
          <View style={ps.mapBox}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
              initialRegion={fitRegion}
              onMapReady={fitMap}
            >
              <Polyline
                coordinates={route}
                strokeColor={GREEN}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
              <RouteEndpoints route={route} />
            </MapView>
          </View>
        ) : (
          <View style={ps.noRouteBox}>
            <Navigation size={22} color="#94A3B8" />
            <Text style={ps.noRouteText}>Ainda sem rota suficiente para o mapa</Text>
          </View>
        )}

        {/* Lista de estatísticas com abas por categoria de métrica */}
        <View style={ps.statList}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={ps.tabBar}
          >
            {STAT_TABS.map((t) => {
              const active = statTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setStatTab(t.key)}
                  style={[ps.tabBtn, active && ps.tabBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[ps.tabBtnText, active && ps.tabBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <GestureDetector gesture={swipeTabs}>
            <View>
              <Reanimated.View key={statTab} entering={fadeRows}>
                {statRows[statTab].map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <View key={r.label}>
                      {i > 0 && <View style={ps.statRowDivider} />}
                      <View style={ps.statRow}>
                        <View style={ps.statRowLeft}>
                          <Icon size={18} color="#65A30D" />
                          <Text style={ps.statRowLabel}>{r.label}</Text>
                        </View>
                        <Text style={ps.statRowValue}>{r.value}</Text>
                      </View>
                    </View>
                  );
                })}
              </Reanimated.View>
            </View>
          </GestureDetector>
        </View>

        {/* Parciais por km */}
        {splits.length > 0 && (
          <View style={ps.splitsBox}>
            <Text style={ps.splitsTitle}>Parciais (por km)</Text>
            <View style={ps.splitHead}>
              <Text style={ps.splitHeadText}>KM</Text>
              <Text style={ps.splitHeadText}>TEMPO</Text>
              <Text style={ps.splitHeadText}>PACE</Text>
            </View>
            {splits.map((s) => (
              <View key={s.km} style={ps.splitRow}>
                <Text style={ps.splitNum}>{s.km}</Text>
                <Text style={ps.splitVal}>{s.time}</Text>
                <Text style={ps.splitVal}>{s.pace}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer fixo: Retomar + Encerrar */}
      <View style={[ps.footer, { paddingBottom: (insets.bottom || 16) + 10 }]}>
        <TouchableOpacity style={ps.resumeBtn} onPress={onResume} activeOpacity={0.85}>
          <Play size={22} color="#fff" fill="#fff" />
          <Text style={ps.resumeText}>RETOMAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ps.stopBtn} onPress={onStop} activeOpacity={0.85}>
          <Square size={20} color="#EF4444" fill="#EF4444" />
          <Text style={ps.stopText}>ENCERRAR</Text>
        </TouchableOpacity>
      </View>
    </Reanimated.View>
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
  const liveMapRef = useRef<MapView>(null);
  // Timestamp (relógio local) do último reposicionamento da câmera — usado para
  // animar pela cadência real dos fixes (acompanhamento contínuo, sem gap morto).
  const lastFollowTsRef = useRef<number>(0);
  const insets = useSafeAreaInsets();

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

  // Quando uma sessão ativa é restaurada (relaunch após o SO matar o processo, ou
  // ao voltar pra tela), alinha a aba à modalidade real do treino em andamento —
  // para a UI abrir na corrida/ciclismo correto, não no default.
  useEffect(() => {
    if (snap.active && (snap.type === "Ciclismo" || snap.type === "Corrida")) {
      setActiveTab((prev) => (prev === snap.type ? prev : snap.type));
    }
  }, [snap.active, snap.type]);

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

  // Antes de iniciar o treino: centraliza na última posição conhecida assim que
  // ela é carregada (o `initialRegion` só vale no primeiro paint).
  useEffect(() => {
    if (snap.lastLocation) return; // já há posição ao vivo; o efeito abaixo cuida
    if (
      initialCenter &&
      typeof initialCenter.latitude === "number" &&
      isFinite(initialCenter.latitude)
    ) {
      liveMapRef.current?.animateCamera(
        { center: { latitude: initialCenter.latitude, longitude: initialCenter.longitude } },
        { duration: 500 }
      );
    }
  }, [initialCenter, snap.lastLocation]);

  // Câmera "estilo Uber": segue a posição ao vivo SEM zerar o pan do usuário
  // (animateCamera incremental, não a prop `region` controlada).
  // - Acompanhamento contínuo: a animação dura ~o intervalo real entre fixes, então
  //   a câmera ainda está em movimento quando o próximo fix chega → sem trepidação,
  //   independentemente da velocidade.
  // - Zoom adaptativo: durante o treino, afasta conforme a velocidade sobe.
  useEffect(() => {
    const t = snap.lastLocation;
    if (
      !t ||
      typeof t.latitude !== "number" ||
      !isFinite(t.latitude) ||
      typeof t.longitude !== "number" ||
      !isFinite(t.longitude)
    ) {
      return;
    }

    const now = Date.now();
    const dt = lastFollowTsRef.current ? now - lastFollowTsRef.current : 1000;
    lastFollowTsRef.current = now;
    // Anima pela cadência observada (clampada), para não ficar nem brusco nem lento.
    const duration = Math.min(1200, Math.max(300, dt));

    const camera: Partial<Camera> = {
      center: { latitude: t.latitude, longitude: t.longitude },
    };
    // Só dirige o zoom durante o treino ativo; fora dele, respeita o zoom do usuário.
    if (isTracking) {
      const v = snap.currentSpeedMs || 0;
      camera.zoom = zoomForSpeed(v); // Android
      camera.altitude = altitudeForSpeed(v); // iOS
    }

    liveMapRef.current?.animateCamera(camera, { duration });
  }, [snap.lastLocation]);

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
        routeSnapped: final.snappedRoute,
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

  const isValidLatLng = (p: { latitude: number; longitude: number }) =>
    p &&
    typeof p.latitude === "number" &&
    !isNaN(p.latitude) &&
    isFinite(p.latitude) &&
    typeof p.longitude === "number" &&
    !isNaN(p.longitude) &&
    isFinite(p.longitude);

  const safeRoute = useMemo(() => route.filter(isValidLatLng), [route]);

  // Traçado encaixado nas ruas (map-matching ao vivo). Quando existe, é o que
  // desenhamos no mapa; senão, cai na rota crua suavizada.
  const safeSnappedRoute = useMemo(
    () => (snap.snappedRoute || []).filter(isValidLatLng),
    [snap.snappedRoute]
  );
  const displayRoute = safeSnappedRoute.length > 1 ? safeSnappedRoute : safeRoute;

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

  // ─── Modo imersivo (treino ativo): contagem 3-2-1, pulso "Pausado", recentrar ──
  const [countdown, setCountdown] = useState<number | null>(null);
  const pausePulse = useRef(new Animated.Value(1)).current;

  // INICIAR dispara uma contagem 3-2-1 antes de começar o rastreamento de fato.
  const beginCountdown = () => setCountdown(3);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      startTracking();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Pulso do badge "Pausado" (opacidade indo e voltando enquanto pausado).
  useEffect(() => {
    if (isTracking && isPaused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pausePulse, { toValue: 0.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pausePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pausePulse.setValue(1);
  }, [isTracking, isPaused, pausePulse]);

  // ─── Tela de pausa (modal full-screen com estatísticas da corrida) ──────────
  const [pausedStatsOpen, setPausedStatsOpen] = useState(false);
  const pausedMapRef = useRef<MapView>(null);

  // PAUSAR (no painel imersivo): pausa o tracking e abre a tela de estatísticas.
  // Quando já está pausado, o botão vira RETOMAR e só retoma (sem reabrir o modal).
  const handleImmPause = () => {
    Tracker.togglePause();
    if (!isPaused) setPausedStatsOpen(true);
  };
  const resumeFromStats = () => {
    Tracker.togglePause();
    setPausedStatsOpen(false);
  };

  // Recentraliza a câmera na posição atual do usuário.
  const recenter = () => {
    if (hasValidLocation && liveLatLng) {
      liveMapRef.current?.animateCamera(
        { center: { latitude: liveLatLng.latitude, longitude: liveLatLng.longitude } },
        { duration: 500 }
      );
    }
  };

  return (
    <DataErrorBoundary>
      {isTracking && isToday ? (
        // ─── Tela cheia de treino ativo (estilo Strava) ───────────────────────
        <View style={styles.immersive}>
          <MapView
            ref={liveMapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            showsUserLocation
            showsMyLocationButton={false}
            initialRegion={
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
            {displayRoute.length > 1 && (
              <Polyline
                coordinates={displayRoute}
                strokeColor={activeTab === "Ciclismo" ? "#3B82F6" : "#10B981"}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>

          {/* Topo: minimizar (treino segue) + modalidade + badge Pausado */}
          <SafeAreaView edges={["top"]} style={styles.immTopSafe} pointerEvents="box-none">
            <View style={styles.immTopRow}>
              <BackButton to={{ name: "DataScreen" }} />
              <View style={styles.immModalityPill}>
                <Text style={styles.immModalityText}>{activeTab.toUpperCase()}</Text>
              </View>
              {isPaused ? (
                <Animated.View style={[styles.immPausedBadge, { opacity: pausePulse }]}>
                  <Pause size={12} color="#fff" fill="#fff" />
                  <Text style={styles.immPausedText}>PAUSADO</Text>
                </Animated.View>
              ) : (
                <View style={{ width: 92 }} />
              )}
            </View>
          </SafeAreaView>

          {/* Painel inferior: recentralizar + cartão flutuante (stats + controles) */}
          <View
            style={[styles.immBottom, { paddingBottom: (insets.bottom || 16) + 12 }]}
            pointerEvents="box-none"
          >
            {/* Recentralizar (acima do cartão, à direita) */}
            <TouchableOpacity style={styles.immRecenter} onPress={recenter} activeOpacity={0.85}>
              <Crosshair size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.immCard}>
              <View style={styles.immStats}>
                <View style={styles.immStat}>
                  <Text style={styles.immStatValue}>{distance.toFixed(2)}</Text>
                  <Text style={styles.immStatLabel}>km</Text>
                </View>
                <View style={styles.immStatDivider} />
                <View style={styles.immStat}>
                  <Text style={styles.immStatValue}>{formatDuration(seconds)}</Text>
                  <Text style={styles.immStatLabel}>tempo</Text>
                </View>
                <View style={styles.immStatDivider} />
                <View style={styles.immStat}>
                  <Text style={styles.immStatValue}>
                    {activeTab === "Ciclismo" ? currentSpeedKmh : currentPace}
                  </Text>
                  <Text style={styles.immStatLabel}>
                    {activeTab === "Ciclismo" ? "km/h" : "pace"}
                  </Text>
                </View>
                <View style={styles.immStatDivider} />
                <View style={styles.immStat}>
                  <Text style={styles.immStatValue}>{estimatedKcal}</Text>
                  <Text style={styles.immStatLabel}>kcal</Text>
                </View>
              </View>

              <View style={styles.immControls}>
                <TouchableOpacity
                  style={styles.immPauseBtn}
                  onPress={handleImmPause}
                  activeOpacity={0.85}
                >
                  {isPaused ? (
                    <Play size={22} color="#fff" fill="#fff" />
                  ) : (
                    <Pause size={22} color="#fff" fill="#fff" />
                  )}
                  <Text style={styles.immPauseText}>{isPaused ? "RETOMAR" : "PAUSAR"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.immStopBtn}
                  onPress={stopTracking}
                  activeOpacity={0.85}
                >
                  <Square size={20} color="#fff" fill="#fff" />
                  <Text style={styles.immStopText}>ENCERRAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ─── Tela de pausa: estatísticas da corrida (overlay de vidro sobre
              o mapa, na mesma árvore para o mapa aparecer desfocado por trás) ─── */}
          {pausedStatsOpen && (
            <PausedStats
              type={activeTab === "Ciclismo" ? "Ciclismo" : "Corrida"}
              distanceKm={safeDistance}
              seconds={seconds}
              currentSpeedMs={safeCurrentSpeedMs}
              maxSpeedMs={snap.maxSpeedMs || 0}
              elevationGainM={snap.elevationGainM || 0}
              splits={snap.splits}
              route={displayRoute}
              mapRef={pausedMapRef}
              onResume={resumeFromStats}
              onStop={stopTracking}
              onClose={() => setPausedStatsOpen(false)}
            />
          )}
        </View>
      ) : (
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
              ref={liveMapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              showsUserLocation
              showsMyLocationButton={false}
              followsUserLocation={false}
              initialRegion={
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
              {displayRoute.length > 1 && (
                <Polyline
                  coordinates={displayRoute}
                  strokeColor={activeTab === "Ciclismo" ? "#3B82F6" : "#10B981"}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
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
                  onPress={beginCountdown}
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
      )}

      {/* Contagem regressiva 3-2-1 ao iniciar (overlay sobre a tela normal). */}
      {countdown !== null && (
        <View style={styles.countdownOverlay} pointerEvents="none">
          <Text style={styles.countdownLabel}>PREPARAR</Text>
          <Text style={styles.countdownNum}>{countdown}</Text>
        </View>
      )}
    </DataErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },

  // ─── Modo imersivo (treino ativo): mapa full + overlays em vidro escuro ────────
  immersive: { flex: 1, backgroundColor: "#0B0F12" },

  // Topo flutuante (safe area): voltar · modalidade · badge pausado
  immTopSafe: { position: "absolute", top: 0, left: 0, right: 0 },
  immTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 8,
  },
  immModalityPill: {
    backgroundColor: "rgba(25,33,38,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  immModalityText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1,
  },
  immPausedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 92,
    backgroundColor: "rgba(239,68,68,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  immPausedText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Botão recentralizar (acima do cartão, à direita)
  immRecenter: {
    alignSelf: "flex-end",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(25,33,38,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginRight: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Base: container posicionado por safe area + cartão flutuante
  immBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  immCard: {
    backgroundColor: "#BBF246",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#1A2E05",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  immStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  immStat: { alignItems: "center", flex: 1 },
  immStatValue: {
    color: "#1A2E05",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  immStatLabel: {
    color: "#3F6212",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 2,
  },
  immStatDivider: { width: 1, height: 28, backgroundColor: "rgba(26,46,5,0.18)" },
  immControls: { flexDirection: "row", gap: 12, marginTop: 16 },
  immPauseBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#192126",
  },
  immPauseText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  immStopBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
  },
  immStopText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  // Contagem regressiva 3-2-1 ao iniciar (overlay full-screen)
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,15,18,0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  countdownLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 12,
  },
  countdownNum: {
    color: "#FFFFFF",
    fontSize: 120,
    fontWeight: "900",
    letterSpacing: -2,
  },

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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  shareBtn: { padding: 8, minWidth: 34, alignItems: "center", justifyContent: "center" },

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
  mapStatsScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 14,
    justifyContent: "flex-end",
  },
  mapStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  mapStat: { alignItems: "center", flex: 1 },
  mapStatValue: { fontSize: 19, fontWeight: "900", color: "#FFFFFF" },
  mapStatLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    marginTop: 2,
  },
  mapStatDivider: { width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.25)" },
  statsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 18,
  },
  statsTitle: { fontSize: 14, fontWeight: "900", color: "#1E293B", marginBottom: 4 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  statRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statRowLabel: { fontSize: 14, fontWeight: "600", color: "#475569" },
  statRowValue: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  statRowDivider: { height: 1, backgroundColor: "#EEF2F6" },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.75)",
    justifyContent: "flex-end",
  },
  previewSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  previewTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  previewClose: { padding: 4 },
  previewImage: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 20,
    backgroundColor: "#0B1220",
    marginBottom: 16,
  },
  previewShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 16,
  },
  previewShareText: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
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

// Estilos da tela de pausa — vidro simulado (frosted claro) sobre o mapa, com as
// informações centralizadas sobre fundo verde sólido (lime de marca), cor viva 100%.
const ps = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, backgroundColor: "#BBF246" },
  // Fundo verde sólido (lime de marca), cobre o mapa por completo — cor viva 100%.
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "#BBF246" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#1A2E05", fontSize: 15, fontWeight: "900", letterSpacing: 3 },
  headerSub: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 2 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, alignItems: "stretch" },

  // ─── Bento grid ──────────────────────────────────────────────────────────
  bentoRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  tile: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    shadowColor: "#1A2E05",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  tileFlex: { flex: 1, justifyContent: "center" },
  tilePace: { flex: 1 },
  tileWide: { flex: 1.4 },
  tileHeroValue: { color: "#1A2E05", fontSize: 44, fontWeight: "900", letterSpacing: -2, lineHeight: 48 },
  tileValue: { color: "#1A2E05", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  tileLabel: {
    color: "#65A30D",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tileDivider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 10 },
  tileSubValue: { color: "#475569", fontSize: 15, fontWeight: "800" },
  tileSubUnit: { color: "#94A3B8", fontSize: 11, fontWeight: "700" },
  tileWideTop: { marginBottom: 10 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 5, height: 40 },
  bar: { flex: 1, borderRadius: 4, minHeight: 4 },
  barEmpty: { backgroundColor: "#E2E8F0" },
  chartLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },

  mapBox: {
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  noRouteBox: {
    height: 110,
    borderRadius: 24,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noRouteText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },

  statList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
    marginBottom: 14,
    shadowColor: "#1A2E05",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  tabBar: { gap: 8, paddingBottom: 12, paddingRight: 4 },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  tabBtnActive: { backgroundColor: "#BBF246" },
  tabBtnText: { fontSize: 12, fontWeight: "800", color: "#64748B", letterSpacing: 0.3 },
  tabBtnTextActive: { color: "#1A2E05" },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  statRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statRowLabel: { color: "#475569", fontSize: 14, fontWeight: "700" },
  statRowValue: { color: "#1A2E05", fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  statRowDivider: { height: 1, backgroundColor: "#EEF2F6" },

  splitsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
  },
  splitsTitle: { color: "#1E293B", fontSize: 14, fontWeight: "900", marginBottom: 12 },
  splitHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100,116,139,0.2)",
  },
  splitHeadText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100,116,139,0.12)",
  },
  splitNum: { color: "#1E293B", fontSize: 14, fontWeight: "900", flex: 1, textAlign: "center" },
  splitVal: { color: "#475569", fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center" },

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#BBF246",
  },
  resumeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#192126",
  },
  resumeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  stopBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  stopText: { color: "#EF4444", fontWeight: "800", fontSize: 15 },
});

// Ciclismo (GPS) é livre para todos os planos (coleta + análise). Só Expectativa
// × Realidade permanece Premium — ver planLimits.ts / ADR-0013.
export default CyclingScreen;
