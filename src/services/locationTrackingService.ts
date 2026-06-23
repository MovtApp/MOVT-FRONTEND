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
import {
  haversineMeters,
  kalmanInit,
  kalmanUpdate,
  kalmanQForSpeed,
  KALMAN_Q,
  MAX_SPEED_MS,
  type KalmanState,
} from "../utils/workout/geo";

export const LOCATION_TASK = "movt-location-tracking";
const STORAGE_KEY = "@MOVT:active_tracking_session";

// ─── Parâmetros de rastreamento (qualidade Strava/Uber) ─────────────────────────
// Acurácia máxima aceita (m) para um fix ENTRAR na rota. Antes o corte era 15 m e
// descartava metade dos fixes em ambiente urbano → buracos no traçado. Agora
// aceitamos até 50 m e deixamos o Kalman ponderar os ruidosos pela acurácia.
const MAX_ACCURACY_M = 50;
// Acurácia assumida quando o device não reporta (m).
const DEFAULT_ACCURACY_M = 20;
// Deslocamento mínimo (m) entre pontos JÁ filtrados para contar distância/registrar.
// Escala com a acurácia do fix (max(MIN_SEGMENT_M, accuracy·FACTOR)) para não somar
// a "deriva" do GPS parado.
const MIN_SEGMENT_M = 2;
const SEGMENT_ACCURACY_FACTOR = 0.5;
// Acima de MAX_SPEED_MS·este fator entre fixes = salto impossível → descarta.
const OUTLIER_SPEED_FACTOR = 1.5;

export type WorkoutKind = "Ciclismo" | "Corrida";
export type LatLng = { latitude: number; longitude: number; timestamp?: number; accuracy?: number };
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
  lastPoint: LatLng | null; // último fix aceito (âncora por-fix, p/ velocidade)
  lastRegPoint: LatLng | null; // último ponto REGISTRADO na rota (âncora de distância)
  lastFixTs: number; // domínio location.timestamp (p/ deltaSeconds)
  lastSplitKm: number;
  lastLocation: LatLng | null;
  // Estado do filtro de Kalman (suavização do traçado). Serializável → sobrevive
  // à persistência/rehidratação. null até o primeiro fix válido.
  kf: KalmanState | null;
}

let session: Session | null = null;
let hydrated = false;
let lastPersistTs = 0;

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
// Pipeline estilo Strava/Uber:
//   raw → [aceita por acurácia] → [rejeita outlier por velocidade] → [Kalman]
//       → ponto filtrado → [gate de distância proporcional à acurácia] → rota.
function processFix(loc: Location.LocationObject) {
  if (!session || !session.active) return;

  const { latitude, longitude, speed, accuracy } = loc.coords;
  const ts = loc.timestamp || Date.now(); // domínio do device (p/ deltaSeconds)

  // Sempre atualiza a última localização conhecida (marcador do mapa), mesmo
  // que o fix seja impreciso — é só a posição "ao vivo", não entra na rota.
  // Carimba o timestamp para a UI medir a cadência real e animar a câmera por
  // esse intervalo (acompanhamento contínuo, sem "gap morto").
  session.lastLocation = { latitude, longitude, timestamp: ts };

  // Acurácia efetiva (assume um valor quando o device não reporta).
  const acc = typeof accuracy === "number" && accuracy > 0 ? accuracy : DEFAULT_ACCURACY_M;

  // Fix ruidoso demais: não entra no traçado (mas já moveu o marcador acima).
  if (acc > MAX_ACCURACY_M) return;

  // Velocidade medida deste fix (m/s), usada para a rejeição de outlier E para o
  // Q adaptativo do Kalman. Começa da última conhecida; refina com o salto cru.
  let measuredSpeedMs = session.currentSpeedMs;

  // Rejeição de outlier ("teleporte" do GPS): se o salto desde a última posição
  // filtrada implica uma velocidade impossível para a modalidade, descarta —
  // a menos que o fix seja muito preciso (aí é movimento real, mesmo rápido).
  if (session.kf) {
    const dtRaw = (ts - session.kf.ts) / 1000;
    if (dtRaw > 0) {
      const rawDist = haversineMeters(session.kf.lat, session.kf.lng, latitude, longitude);
      const rawSpeed = rawDist / dtRaw;
      if (rawSpeed > MAX_SPEED_MS[session.type] * OUTLIER_SPEED_FACTOR && acc > 10) return;
      measuredSpeedMs = rawSpeed;
    }
  }

  // Suavização Kalman com Q ADAPTATIVO à velocidade: rápido → confia mais no GPS
  // (não corta curva nem fica atrás); lento → suaviza mais. O resultado (fLat/fLng)
  // é a posição "limpa" que entra no traçado e na distância.
  const adaptiveQ = kalmanQForSpeed(KALMAN_Q[session.type], measuredSpeedMs);
  session.kf = session.kf
    ? kalmanUpdate(session.kf, latitude, longitude, acc, ts, adaptiveQ)
    : kalmanInit(latitude, longitude, acc, ts);
  const fLat = session.kf.lat;
  const fLng = session.kf.lng;

  // Velocidade ao vivo: medida fix-a-fix (âncora lastPoint, sempre atualizada),
  // para responder na hora mesmo entre pontos registrados.
  const prevPoint = session.lastPoint;
  const prevFixTs = session.lastFixTs;
  let fixSegmentM = 0;
  let deltaSeconds = 0;
  if (prevPoint && prevFixTs) {
    fixSegmentM = haversineMeters(prevPoint.latitude, prevPoint.longitude, fLat, fLng);
    deltaSeconds = (ts - prevFixTs) / 1000;
  }
  session.currentSpeedMs = deriveSpeedMs(speed, fixSegmentM, deltaSeconds);
  session.lastPoint = { latitude: fLat, longitude: fLng };
  session.lastFixTs = ts;

  // Primeiro fix válido: marca o início da rota.
  if (!session.lastRegPoint) {
    session.lastRegPoint = { latitude: fLat, longitude: fLng };
    session.route = [{ latitude: fLat, longitude: fLng, timestamp: ts, accuracy: acc }];
    return;
  }

  // Pausado: não acumula distância. A âncora registrada NÃO se move, para que ao
  // retomar o primeiro segmento seja medido a partir de onde parou (sem "salto").
  if (session.isPaused) return;

  // Distância/rota: medida contra a última âncora REGISTRADA, com gate
  // proporcional à acurácia → mata a deriva do GPS parado sem perder a forma.
  const regSegmentM = haversineMeters(
    session.lastRegPoint.latitude,
    session.lastRegPoint.longitude,
    fLat,
    fLng
  );
  const distThreshold = Math.max(MIN_SEGMENT_M, acc * SEGMENT_ACCURACY_FACTOR);
  if (regSegmentM > distThreshold) {
    session.distanceKm += regSegmentM / 1000;
    session.route.push({ latitude: fLat, longitude: fLng, timestamp: ts, accuracy: acc });
    session.lastRegPoint = { latitude: fLat, longitude: fLng };

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
    // 500 ms (era 1000): pede fixes na taxa máxima que o GPS entrega, para o
    // acompanhamento da câmera não "pular" em alta velocidade. distanceInterval
    // baixo garante updates densos quando há deslocamento.
    timeInterval: 500,
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
    lastRegPoint: null,
    lastFixTs: 0,
    lastSplitKm: 0,
    lastLocation: null,
    kf: null,
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
