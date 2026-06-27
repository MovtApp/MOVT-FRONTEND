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
import { snapRoute } from "./mapMatchingService";

export const LOCATION_TASK = "movt-location-tracking";
const STORAGE_KEY = "@MOVT:active_tracking_session";

// ─── Parâmetros de rastreamento (qualidade Strava/Uber) ─────────────────────────
// Acurácia máxima aceita (m) para um fix ENTRAR na rota. 15 m descartava metade dos
// fixes urbanos (buracos); 50 m deixava jitter demais entrar (zig-zag). 35 m é o
// meio-termo: o Kalman pondera os ruidosos pela acurácia, e o filtro de "ré"
// (processFix) remove os vai-e-volta restantes. Tunável.
const MAX_ACCURACY_M = 35;
// Acurácia assumida quando o device não reporta (m).
const DEFAULT_ACCURACY_M = 20;
// Deslocamento mínimo (m) entre pontos JÁ filtrados para contar distância/registrar.
// Escala com a acurácia do fix (max(MIN_SEGMENT_M, accuracy·FACTOR)) para não somar
// a "deriva" do GPS parado.
const MIN_SEGMENT_M = 2;
const SEGMENT_ACCURACY_FACTOR = 0.5;
// Acima de MAX_SPEED_MS·este fator entre fixes = salto impossível → descarta.
const OUTLIER_SPEED_FACTOR = 1.5;

// ─── Map-matching ao vivo (snap-to-roads via backend/Mapbox) ────────────────────
// Encaixa o traçado nas ruas reais durante o treino. Throttled: roda no máximo a
// cada SNAP_INTERVAL_MS e só quando há pelo menos SNAP_MIN_NEW_POINTS pontos novos
// desde o último snap — para não estourar requisições nem latência.
const SNAP_INTERVAL_MS = 12000;
const SNAP_MIN_NEW_POINTS = 8;

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
  // Rota encaixada nas ruas (map-matching). Vazia até o 1º snap bem-sucedido; a
  // UI desenha esta quando existir e cai na `route` crua como fallback.
  snappedRoute: LatLng[];
  splits: Split[];
  currentSpeedMs: number;
  /** Maior velocidade instantânea registrada na sessão (m/s). */
  maxSpeedMs: number;
  /** Ganho de elevação acumulado na sessão (metros de subida). */
  elevationGainM: number;
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
  // Traçado encaixado nas ruas (preenchido pelo snap ao vivo).
  snappedRoute: LatLng[];
  // Controle de throttle do snap ao vivo.
  lastSnapTs: number;
  lastSnapAtLen: number;
  splits: Split[];
  currentSpeedMs: number;
  maxSpeedMs: number; // pico de velocidade instantânea (m/s)
  elevationGainM: number; // ganho de elevação acumulado (m)
  lastAltitude: number | null; // referência de altitude p/ acumular subida (histerese)
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
// Garante UM snap em voo por vez (a task de localização dispara em cada lote).
let snapInProgress = false;

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
  // Pico de velocidade: maior instantânea válida (não pausado, dentro do teto da
  // modalidade — o gate de outlier por velocidade já rodou acima).
  if (!session.isPaused && session.currentSpeedMs <= MAX_SPEED_MS[session.type]) {
    session.maxSpeedMs = Math.max(session.maxSpeedMs, session.currentSpeedMs);
  }
  // Ganho de elevação: acumula subida com histerese de 1 m (filtra ruído de
  // altitude do GPS). Altitude pode vir null em alguns devices.
  const alt = loc.coords.altitude;
  if (!session.isPaused && typeof alt === "number" && isFinite(alt)) {
    if (session.lastAltitude === null) {
      session.lastAltitude = alt;
    } else {
      const d = alt - session.lastAltitude;
      if (d > 1) {
        session.elevationGainM += d;
        session.lastAltitude = alt;
      } else if (d < -1) {
        session.lastAltitude = alt;
      }
    }
  }
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
    // Filtro de "ré"/spike: descarta o ponto se ele inverte bruscamente a direção
    // do último segmento (cosseno < -0.5, ~>120°) com avanço curto (< 8 m) — padrão
    // típico do jitter de GPS parado/lento (vai-e-volta). U-turns reais (segmento
    // longo) passam. Não move a âncora nem soma distância.
    const r = session.route;
    if (r.length >= 2) {
      const prev = r[r.length - 2];
      const last = r[r.length - 1];
      const mPerDegLat = 111320;
      const mPerDegLng = 111320 * Math.cos((last.latitude * Math.PI) / 180);
      const v1x = (last.longitude - prev.longitude) * mPerDegLng;
      const v1y = (last.latitude - prev.latitude) * mPerDegLat;
      const v2x = (fLng - last.longitude) * mPerDegLng;
      const v2y = (fLat - last.latitude) * mPerDegLat;
      const m1 = Math.hypot(v1x, v1y);
      const m2 = Math.hypot(v2x, v2y);
      if (m1 > 0 && m2 > 0) {
        const cos = (v1x * v2x + v1y * v2y) / (m1 * m2);
        if (cos < -0.5 && m2 < 8) return;
      }
    }

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

// ─── Map-matching ao vivo ────────────────────────────────────────────────────────
// Encaixa a rota crua atual nas ruas (via backend/Mapbox) e atualiza snappedRoute.
// Throttled e não-bloqueante: a task de localização chama a cada lote, mas só
// dispara de fato a cada SNAP_INTERVAL_MS / SNAP_MIN_NEW_POINTS. Em falha/offline
// o snapRoute devolve null e mantemos o último traçado encaixado (não regride).
async function maybeSnapLive() {
  if (!session?.active || session.isPaused) return;
  if (snapInProgress) return;

  const routeLen = session.route.length;
  if (routeLen < 4) return;

  const now = Date.now();
  const newPoints = routeLen - session.lastSnapAtLen;
  // Já temos um traçado e ainda há poucos pontos novos: espera acumular.
  if (session.snappedRoute.length > 0 && newPoints < SNAP_MIN_NEW_POINTS) return;
  if (now - session.lastSnapTs < SNAP_INTERVAL_MS) return;

  snapInProgress = true;
  session.lastSnapTs = now;
  session.lastSnapAtLen = routeLen;
  try {
    const snapshot = session.route.slice(); // congela a entrada deste snap
    const result = await snapRoute(snapshot, session.type);
    if (session?.active && result && result.snapped.length >= 2) {
      session.snappedRoute = result.snapped;
      notify();
    }
  } catch {
    // mantém o snappedRoute anterior
  } finally {
    snapInProgress = false;
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
      if (parsed?.active) {
        // Backfill de campos novos para sessões persistidas antes do map-matching.
        if (!Array.isArray(parsed.snappedRoute)) parsed.snappedRoute = [];
        if (typeof parsed.lastSnapTs !== "number") parsed.lastSnapTs = 0;
        if (typeof parsed.lastSnapAtLen !== "number") parsed.lastSnapAtLen = 0;
        if (typeof parsed.maxSpeedMs !== "number") parsed.maxSpeedMs = 0;
        if (typeof parsed.elevationGainM !== "number") parsed.elevationGainM = 0;
        if (typeof parsed.lastAltitude !== "number") parsed.lastAltitude = null;
        session = parsed;
      }
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
    snappedRoute: [],
    splits: [],
    currentSpeedMs: 0,
    maxSpeedMs: 0,
    elevationGainM: 0,
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
    snappedRoute: session.snappedRoute.slice(),
    splits: session.splits.slice(),
    currentSpeedMs: session.currentSpeedMs,
    maxSpeedMs: session.maxSpeedMs,
    elevationGainM: session.elevationGainM,
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

/**
 * Hidrata (se preciso) e informa se há uma sessão de treino ativa persistida,
 * devolvendo o tipo para a UI restaurar a aba/tela certa. Diferente de
 * `isActive` (síncrono, devolve false antes da rehidratação), este aguarda o
 * AsyncStorage — usado no relaunch para decidir se navegamos de volta ao treino
 * (ex.: o SO matou o processo durante uma corrida com a tela apagada).
 */
export async function hasActiveSession(): Promise<{ active: boolean; type?: WorkoutKind }> {
  if (session?.active) return { active: true, type: session.type };
  await ensureHydrated();
  const s = session as Session | null;
  if (s?.active) return { active: true, type: s.type };
  return { active: false };
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
    snappedRoute: [],
    lastSnapTs: 0,
    lastSnapAtLen: 0,
    splits: [],
    currentSpeedMs: 0,
    maxSpeedMs: 0,
    elevationGainM: 0,
    lastAltitude: null,
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

  // Passe final de alta qualidade: snap da rota inteira (best-effort). Se a rede
  // falhar, mantém o traçado encaixado que já tínhamos do snap ao vivo.
  if (session && session.route.length >= 2) {
    try {
      const result = await snapRoute(session.route.slice(), session.type);
      if (result && result.snapped.length >= 2) finalSnap.snappedRoute = result.snapped;
    } catch {
      // mantém finalSnap.snappedRoute (snap ao vivo)
    }
  }

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
  // Map-matching ao vivo (não-bloqueante, throttled internamente).
  maybeSnapLive();
});
