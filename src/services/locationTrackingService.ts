/**
 * locationTrackingService — rastreamento de treino resiliente ao repouso da tela.
 *
 * PROBLEMA QUE RESOLVE
 * Antes, a tela de Corrida/Ciclismo contava o tempo com um `setInterval` (thread
 * JS) e acumulava distância no callback de `Location.watchPositionAsync`
 * (foreground). Quando a tela apagava, o Android suspendia a thread JS (Doze) e
 * o cronômetro/distância congelavam.
 *
 * COMO RESOLVE (2 camadas)
 *  1. TEMPO por relógio de parede: o tempo decorrido é derivado de timestamps
 *     (`Date.now() - startTs - pausas`), não de "ticks". Mesmo que o JS durma, ao
 *     acordar o valor está correto.
 *  2. GPS em BACKGROUND real: usa `Location.startLocationUpdatesAsync` +
 *     `TaskManager` (task headless) com o foreground service do expo-location.
 *     Os fixes chegam mesmo com a tela apagada; o processamento (filtro de
 *     acurácia, distância, splits) roda aqui, fora do componente.
 *
 * A sessão é persistida em AsyncStorage para sobreviver a um restart do processo
 * (caso o SO mate e religue o app para entregar uma localização headless).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { deriveSpeedMs, speedToPace, formatDuration } from "../utils/workout/performance";

export const LOCATION_TASK = "movt-location-tracking";
const STORAGE_KEY = "@MOVT:active_tracking_session";

// ─── Parâmetros de rastreamento (espelham os antigos da CyclingScreen) ──────────
// Acurácia mínima aceitável (m). Fixes piores são descartados.
const MIN_ACCURACY_M = 15;
// Deslocamento mínimo (m) entre fixes para registrar um ponto.
const MIN_SEGMENT_M = 1.5;

export type WorkoutKind = "Ciclismo" | "Corrida";
export type LatLng = { latitude: number; longitude: number };
export type Split = { km: number; time: string; pace: string };

/** Vista serializável do estado de rastreamento para a UI. */
export interface TrackingSnapshot {
  active: boolean;
  type: WorkoutKind;
  elapsedSec: number;
  distanceKm: number;
  route: LatLng[];
  splits: Split[];
  currentSpeedMs: number;
  isPaused: boolean;
  lastLocation: LatLng | null;
}

/** Estado interno mutável da sessão (também o que é persistido). */
interface Session {
  active: boolean;
  type: WorkoutKind;
  startTs: number;
  // Contabilidade de pausa para o tempo por relógio de parede.
  pausedAccumMs: number;
  pauseStartedTs: number | null;
  isPaused: boolean; // pausa manual
  // Acumulação geográfica.
  distanceKm: number;
  route: LatLng[];
  splits: Split[];
  currentSpeedMs: number;
  lastPoint: LatLng | null;
  lastFixTs: number; // domínio location.timestamp (p/ deltaSeconds)
  lastSplitKm: number;
  lastLocation: LatLng | null;
}

let session: Session | null = null;
let hydrated = false;
let lastPersistTs = 0;

// ─── Haversine (km) ─────────────────────────────────────────────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Tempo decorrido (relógio de parede menos pausas) ───────────────────────────
function currentElapsedMs(): number {
  if (!session || !session.active) return 0;
  const now = Date.now();
  const liveHalt = session.isPaused && session.pauseStartedTs ? now - session.pauseStartedTs : 0;
  return Math.max(0, now - session.startTs - session.pausedAccumMs - liveHalt);
}

// ─── Transição de pausa (mantém pausedAccumMs coerente) ─────────────────────────
// Deve ser chamada ANTES de virar a flag: lê o estado de pausa atual.
function applyHaltTransition(nextPaused: boolean) {
  if (!session) return;
  const wasPaused = session.isPaused;
  if (nextPaused && !wasPaused) {
    session.pauseStartedTs = Date.now();
  } else if (!nextPaused && wasPaused) {
    if (session.pauseStartedTs) session.pausedAccumMs += Date.now() - session.pauseStartedTs;
    session.pauseStartedTs = null;
  }
}

function pauseManual() {
  if (!session) return;
  applyHaltTransition(true);
  session.isPaused = true;
  session.currentSpeedMs = 0;
}

function resumeAll() {
  if (!session) return;
  applyHaltTransition(false);
  session.isPaused = false;
}

// ─── Núcleo: processa um fix de GPS ─────────────────────────────────────────────
function processFix(loc: Location.LocationObject) {
  if (!session || !session.active) return;

  const { latitude, longitude, speed, accuracy } = loc.coords;
  const ts = loc.timestamp || Date.now(); // domínio do device (p/ deltaSeconds)

  // Sempre atualiza a última localização conhecida (marcador do mapa), mesmo
  // que o fix seja impreciso.
  session.lastLocation = { latitude, longitude };

  // Descarta fixes imprecisos para não poluir distância/velocidade.
  if (typeof accuracy === "number" && accuracy > MIN_ACCURACY_M) return;

  const prevPoint = session.lastPoint;
  const prevFixTs = session.lastFixTs;
  let segmentM = 0;
  let deltaSeconds = 0;
  if (prevPoint && prevFixTs) {
    segmentM =
      calculateDistance(prevPoint.latitude, prevPoint.longitude, latitude, longitude) * 1000;
    deltaSeconds = (ts - prevFixTs) / 1000;
  }

  session.currentSpeedMs = deriveSpeedMs(speed, segmentM, deltaSeconds);

  session.lastFixTs = ts;

  // Primeiro fix válido: marca o início da rota.
  if (!prevPoint) {
    session.lastPoint = { latitude, longitude };
    session.route = [{ latitude, longitude }];
    return;
  }

  // Pausado: não acumula distância; só move a âncora para não gerar "salto".
  if (session.isPaused) {
    session.lastPoint = { latitude, longitude };
    return;
  }

  // Acumula distância filtrando o ruído de GPS.
  if (segmentM > MIN_SEGMENT_M) {
    session.distanceKm += segmentM / 1000;
    session.route.push({ latitude, longitude });

    const totalKm = session.distanceKm;
    if (Math.floor(totalKm) > session.lastSplitKm) {
      const km = Math.floor(totalKm);
      session.lastSplitKm = km;
      const elapsed = Math.floor(currentElapsedMs() / 1000);
      session.splits.push({
        km,
        time: formatDuration(elapsed),
        pace: elapsed > 0 ? speedToPace((totalKm * 1000) / elapsed) : "--:--",
      });
    }
  }

  session.lastPoint = { latitude, longitude };
}

// ─── Persistência (best-effort, throttled) ──────────────────────────────────────
async function persist(force = false) {
  if (!session) return;
  const now = Date.now();
  if (!force && now - lastPersistTs < 5000) return;
  lastPersistTs = now;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignora: persistência é só para recuperação de crash
  }
}

async function ensureHydrated() {
  if (session || hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Session;
      if (parsed?.active) session = parsed;
    }
  } catch {
    // ignora
  }
}

// ─── Pub/Sub para a UI ──────────────────────────────────────────────────────────
type Listener = (s: TrackingSnapshot) => void;
const listeners = new Set<Listener>();

function emptySnapshot(): TrackingSnapshot {
  return {
    active: false,
    type: "Corrida",
    elapsedSec: 0,
    distanceKm: 0,
    route: [],
    splits: [],
    currentSpeedMs: 0,
    isPaused: false,
    lastLocation: null,
  };
}

export function getSnapshot(): TrackingSnapshot {
  if (!session) return emptySnapshot();
  return {
    active: session.active,
    type: session.type,
    elapsedSec: Math.floor(currentElapsedMs() / 1000),
    distanceKm: session.distanceKm,
    route: session.route.slice(),
    splits: session.splits.slice(),
    currentSpeedMs: session.currentSpeedMs,
    isPaused: session.isPaused,
    lastLocation: session.lastLocation,
  };
}

function notify() {
  const snap = getSnapshot();
  listeners.forEach((l) => {
    try {
      l(snap);
    } catch {
      // um listener com erro não derruba os outros
    }
  });
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isActive(): boolean {
  return !!session?.active;
}

// ─── Opções de location updates (compartilhadas start/resume) ───────────────────
function buildOptions(type: WorkoutKind): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 1,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "MOVT — Treino em andamento",
      notificationBody: `Acompanhando sua atividade de ${type.toLowerCase()} em tempo real`,
      notificationColor: "#BBF246",
      killServiceOnDestroy: false,
    },
  };
}

// ─── API pública ────────────────────────────────────────────────────────────────

export interface StartResult {
  ok: boolean;
  error?: "foreground-denied";
}

/** Inicia uma nova sessão de rastreamento. */
export async function startTracking(type: WorkoutKind): Promise<StartResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return { ok: false, error: "foreground-denied" };
  // Background é best-effort: se negado, o foreground service ainda rastreia com
  // a tela ligada; pedimos mesmo assim para cobrir o caso de tela apagada.
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch {
    // alguns devices/ROMs lançam aqui; seguimos com o que houver
  }

  const now = Date.now();
  session = {
    active: true,
    type,
    startTs: now,
    pausedAccumMs: 0,
    pauseStartedTs: null,
    isPaused: false,
    distanceKm: 0,
    route: [],
    splits: [],
    currentSpeedMs: 0,
    lastPoint: null,
    lastFixTs: 0,
    lastSplitKm: 0,
    lastLocation: null,
  };
  hydrated = true; // sessão fresca; não rehidratar por cima
  await persist(true);

  // Evita task duplicada de uma sessão anterior mal encerrada.
  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (already) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK, buildOptions(type));
  notify();
  return { ok: true };
}

/** Alterna pausa manual / retomada. */
export function togglePause() {
  if (!session?.active) return;
  if (session.isPaused) {
    resumeAll();
  } else {
    pauseManual();
  }
  persist(true);
  notify();
}

/**
 * Refresh periódico chamado pela tela (1x/s enquanto focada) para manter o
 * relógio na tela em dia. O tempo é derivado do relógio de parede no serviço;
 * o tick só dispara um notify para a UI repintar.
 */
export function tick() {
  if (!session?.active) return;
  notify();
}

/** Encerra a sessão e retorna o snapshot final (para salvar o treino). */
export async function stopTracking(): Promise<TrackingSnapshot> {
  const finalSnap = getSnapshot();
  if (session) session.active = false;
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    // ignora
  }
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
  session = null;
  notify();
  return finalSnap;
}

/**
 * Rehidrata uma sessão ativa após restart do JS (ex.: o SO reabriu o app para
 * entregar localização). Garante que as location updates estejam de fato
 * rodando. Idempotente. Chamada no mount da tela e na inicialização do app.
 */
export async function resumeIfActive() {
  if (session) {
    notify();
    return;
  }
  await ensureHydrated();
  // Re-widening: o TS estreitou `session` para null no `return` acima e não sabe
  // que ensureHydrated() pode tê-lo populado de forma assíncrona.
  const s = session as Session | null;
  if (s?.active) {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (!started) {
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, buildOptions(s.type));
      } catch {
        // ignora
      }
    }
    notify();
  }
}

// ─── Definição da task headless (registrada no import do módulo) ─────────────────
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("[locationTracking] task error:", error.message);
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locations || locations.length === 0) return;

  // Cold start headless: o SO pode religar o app sem a sessão em memória.
  await ensureHydrated();
  if (!session?.active) return;

  for (const loc of locations) processFix(loc);
  await persist();
  notify();
});
