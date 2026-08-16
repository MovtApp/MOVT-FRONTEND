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
import { AppState, Platform, type AppStateStatus } from "react-native";
import * as Sentry from "@sentry/react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import {
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
  updateWorkoutNotification,
} from "./movtService";
import {
  startWorkoutActivity,
  updateWorkoutActivity,
  endWorkoutActivity,
  type LiveActivityData,
} from "./liveActivityService";
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

// ─── Diagnóstico (camada 4) ─────────────────────────────────────────────────────
// Contador de fixes processados na sessão + timestamp do último lote, para
// detectar em campo (Sentry) se o GPS para de entregar com a tela apagada.
let fixCount = 0;
let lastBatchTs = 0;
// Breadcrumb de lote no máximo a cada 30 s para não inundar o Sentry.
const BATCH_BREADCRUMB_MS = 30000;

// ─── Watchdog de silêncio do GPS (camada 5: recuperação, estilo Strava) ──────────
// PROBLEMA: em ROMs agressivas (MIUI/Xiaomi, Huawei, Oppo…), o SO mata/congela o
// foreground service da localização com a tela apagada. Ao voltar, a `task` do
// expo-location foi DESMONTADA e não volta a receber fixes sozinha — o percurso
// "para no meio e não volta mais" (exatamente o sintoma reportado). O watchdog
// mede o tempo desde o último fix REALMENTE processado (relógio de parede) e,
// se ficar mudo por tempo demais enquanto deveria estar rastreando, RE-ARMA as
// location updates (stop → start), religando o pipeline. É o que mantém o Strava
// gravando depois que o SO derruba o serviço.
let lastFixWallTs = 0; // Date.now() do último fix processado (não o do device)
let watchdogTimer: ReturnType<typeof setInterval> | null = null;
let rearmInProgress = false;
// Cadência de verificação do watchdog.
const WATCHDOG_INTERVAL_MS = 10000;
// Silêncio (ms) tolerado antes de re-armar EM FOREGROUND. Fixes saudáveis chegam a
// cada ~0,5–2 s; 25 s cobre um túnel/cânion urbano sem re-armar à toa, mas religa
// rápido quando o SO derrubou o serviço. NÃO afeta o tempo do treino (relógio de parede).
const WATCHDOG_SILENCE_MS = 25000;
// Silêncio (ms) tolerado antes de re-armar EM BACKGROUND (tela apagada).
// Reduzido de 45s → 30s: em ROMs agressivas (MIUI, Samsung) o GPS pode ficar
// mudo por 35-50s antes do watchdog reagir com 45s, gerando vários gaps visíveis.
// 30s equilibra melhor a recuperação antecipada vs. re-armes desnecessários por
// entrega em lote legítima do SO (que raramente passa de 20-25s).
const WATCHDOG_BG_SILENCE_MS = 30000;
// Evita re-armar em rajada: intervalo mínimo entre dois re-armes.
// Reduzido de 20s → 12s: permite tentativas mais frequentes em ROMs agressivas
// que chegam a matar e reiniciar o FGS em ciclos rápidos.
const REARM_MIN_INTERVAL_MS = 12000;
let lastRearmTs = 0;

// AppState atual (foreground/background). O watchdog re-arma em AMBOS os estados, com
// limiares distintos (WATCHDOG_SILENCE_MS em foreground, WATCHDOG_BG_SILENCE_MS em
// background) — o re-arme em background recupera a entrega de GPS quando ela para
// com a tela apagada. No retorno ao foreground há ainda um re-arme imediato.
let appActive = AppState.currentState === "active";

// ─── Parâmetros de rastreamento (qualidade Strava/Uber) ─────────────────────────
// Acurácia máxima aceita (m) para um fix ENTRAR na rota. 15 m descartava metade dos
// fixes urbanos (buracos); 50 m deixava jitter demais entrar (zig-zag). 35 m é o
// meio-termo: o Kalman pondera os ruidosos pela acurácia, e o filtro de "ré"
// (processFix) remove os vai-e-volta restantes. Tunável.
const MAX_ACCURACY_M = 35;
// Em background o GPS demora a reaquecer; aceita um pouco mais de ruído para não
// furar o traçado (o Kalman ainda suaviza). Em foreground mantém o limiar estrito.
const MAX_ACCURACY_BG_M = 50;
// Throttle do breadcrumb de reject por acurácia (não inundar o Sentry).
let lastAccRejectTs = 0;
const ACC_REJECT_BREADCRUMB_MS = 15000;
// Acurácia assumida quando o device não reporta (m).
const DEFAULT_ACCURACY_M = 20;
// Deslocamento mínimo (m) entre pontos JÁ filtrados para contar distância/registrar.
// Escala com a acurácia do fix (max(MIN_SEGMENT_M, accuracy·FACTOR)) para não somar
// a "deriva" do GPS parado.
const MIN_SEGMENT_M = 2;
const SEGMENT_ACCURACY_FACTOR = 0.5;
// Acima desta velocidade (m/s ≈ caminhada leve) o gate NÃO infla com a acurácia —
// evita o "buraco" entre o ponto azul e a polyline enquanto a pessoa se move.
const MOVING_SPEED_MS = 0.6;
const MIN_SEGMENT_MOVING_M = 2.5;
// Acima de MAX_SPEED_MS·este fator entre fixes = salto impossível → descarta.
const OUTLIER_SPEED_FACTOR = 1.5;
// Silêncio máximo (s) tolerado entre dois fixes ACEITOS. Acima disso, assumimos
// que o GPS ficou mudo (processo congelado pelo SO com a tela apagada, túnel,
// cânion urbano) e NÃO ligamos os dois pontos: um segmento reto cego inflaria a
// distância (vira a "linha reta fantasma" do início ao fim) e mentiria a rota.
// Em vez disso, recomeçamos um trecho novo a partir do fix pós-silêncio (a rota
// ganha um ponto marcado com `gap:true` para a polyline quebrar).
// Reduzido de 30s → 20s: o watchdog em background dispara com 30s e o re-arme
// leva ~2s; com MAX_FIX_GAP_S=30 havia janelas em que o GPS voltava após o gap
// e o segmento era ligado com reta cega de ~25s. Com 20s o gap é detectado antes.
const MAX_FIX_GAP_S = 20;

// ─── Map-matching ao vivo (snap-to-roads via backend/Mapbox) ────────────────────
// Encaixa o traçado nas ruas reais durante o treino. Throttled: roda no máximo a
// cada SNAP_INTERVAL_MS e só quando há pelo menos SNAP_MIN_NEW_POINTS pontos novos
// desde o último snap — para não estourar requisições nem latência.
const SNAP_INTERVAL_MS = 12000;
const SNAP_MIN_NEW_POINTS = 8;

export type WorkoutKind = "Ciclismo" | "Corrida";
export type LatLng = {
  latitude: number;
  longitude: number;
  timestamp?: number;
  accuracy?: number;
  // Marca o PRIMEIRO ponto de um trecho novo após um silêncio do GPS (gap break).
  // A UI usa isso para quebrar a polyline (não desenha a reta cega que ligaria
  // este ponto ao anterior). Pontos normais não têm o campo.
  gap?: boolean;
};
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
  /** Última FC lida do relógio (bpm). 0 = sem leitura/sem relógio. */
  currentHr: number;
  /** FC média da sessão (bpm), arredondada. 0 = sem dados. */
  avgHr: number;
  /** FC máxima registrada na sessão (bpm). 0 = sem dados. */
  maxHr: number;
  /**
   * Métrica de adoção: o relógio entregou ao menos uma FC válida durante o
   * treino? É o sinal que valida (ou descarta) investimento maior em wearable
   * — quantos treinos de fato têm um relógio alimentando dados.
   */
  watchPresent: boolean;
  isPaused: boolean;
  lastLocation: LatLng | null;
  /**
   * Cabeça ao vivo do traçado (último ponto aceito pelo Kalman). A UI liga
   * `lastRegPoint` → `liveTrailHead` para a polyline acompanhar o usuário sem
   * esperar o gate de distância — sem somar km fantasma.
   */
  liveTrailHead: LatLng | null;
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
  // ── Frequência cardíaca do relógio (Health Connect / HealthKit) ──────────────
  // Série temporal + agregados. Coletado por um poller de leitura (nunca pede
  // permissão — só lê o que o app já tem autorizado, p/ não disparar o crash
  // conhecido do Health Connect). Serializável → sobrevive à persistência.
  hrSeries: { t: number; bpm: number }[]; // amostras (timestamp ms + bpm)
  hrSum: number; // soma p/ média incremental
  hrCount: number; // nº de amostras válidas
  currentHr: number; // última FC lida (bpm)
  maxHr: number; // pico de FC (bpm)
  watchPresent: boolean; // recebeu ao menos uma FC do relógio nesta sessão
  lastAltitude: number | null; // referência de altitude p/ acumular subida (histerese)
  lastPoint: LatLng | null; // último fix aceito (âncora por-fix, p/ velocidade)
  lastRegPoint: LatLng | null; // último ponto REGISTRADO na rota (âncora de distância)
  lastFixTs: number; // domínio location.timestamp (p/ deltaSeconds)
  lastSplitKm: number;
  lastLocation: LatLng | null;
  /** Posição Kalman atual — cabeça visual da polyline (não conta km). */
  liveTrailHead: LatLng | null;
  // Estado do filtro de Kalman (suavização do traçado). Serializável → sobrevive
  // à persistência/rehidratação. null até o primeiro fix válido.
  kf: KalmanState | null;
  // "Permitir o tempo todo" concedido? Decide o modo de foreground service (nosso
  // card ao vivo vs. fallback do expo-location). Persistido p/ sobreviver ao
  // restart do processo.
  backgroundGranted: boolean;
}

let session: Session | null = null;
let hydrated = false;
let lastPersistTs = 0;
let persistChain: Promise<void> = Promise.resolve();
// Garante UM snap em voo por vez (a task de localização dispara em cada lote).
let snapInProgress = false;

// ─── Poller de frequência cardíaca (relógio via Health Connect / HealthKit) ──────
// Cadência de leitura da FC. 8 s é folgado: durante um treino o relógio grava FC
// no agregador com regularidade; ler mais rápido só gastaria bateria/IO sem ganho.
const HR_POLL_MS = 8000;
// FC plausível (bpm). Fora disso é ruído/erro de leitura e não entra na série.
const HR_MIN_BPM = 30;
const HR_MAX_BPM = 240;
let hrTimer: ReturnType<typeof setInterval> | null = null;
let hrFetchInFlight = false;

// Registra uma leitura de FC na sessão ativa (agregados incrementais + série).
function recordHeartRate(bpm: number) {
  if (!session?.active) return;
  if (!isFinite(bpm) || bpm < HR_MIN_BPM || bpm > HR_MAX_BPM) return;
  session.currentHr = Math.round(bpm);
  session.maxHr = Math.max(session.maxHr, session.currentHr);
  session.hrSum += session.currentHr;
  session.hrCount += 1;
  session.watchPresent = true;
  // Série amostrada (bounded por duração real de treino; ~450 pts/h a 8 s).
  session.hrSeries.push({ t: Date.now(), bpm: session.currentHr });
}

// Uma leitura de FC (best-effort). SÓ LÊ — nunca chama authorize()/requestPermission,
// para não disparar o crash conhecido do Health Connect (lateinit). Se a permissão
// não estiver concedida, `fetchHeartRate` devolve 0 e a métrica watchPresent fica
// false — que é exatamente o sinal correto ("sem relógio alimentando este treino").
async function pollHeartRateOnce() {
  if (hrFetchInFlight || !session?.active) return;
  // Só lê a FC com o app em FOREGROUND. Além de poupar bateria, isto evita tocar
  // no módulo do Health Connect logo no retorno do background — momento em que o
  // crash conhecido do HC (lateinit) é mais provável. Em background a FC é
  // enriquecimento dispensável; o GPS/tempo seguem pela via resiliente.
  if (!appActive) return;
  hrFetchInFlight = true;
  try {
    // Lazy-require evita puxar o módulo nativo de saúde para o caminho de registro
    // da task headless de localização (mesmo padrão das telas de dados).
    const { NativeHealthManager } = require("./nativeHealthManager");
    const bpm = await NativeHealthManager.fetchHeartRate();
    recordHeartRate(bpm);
  } catch {
    // best-effort: uma leitura falha não afeta o treino
  } finally {
    hrFetchInFlight = false;
  }
}

function startHrPolling() {
  if (hrTimer) return; // idempotente
  // Leitura imediata + a cada HR_POLL_MS. Enquanto o app está em foreground o
  // timer roda normal; em background profundo o SO pode pausá-lo — aceitável,
  // pois FC do relógio é enriquecimento best-effort (o GPS/tempo seguem por
  // outra via resiliente). Não bloqueia nada do rastreio.
  pollHeartRateOnce();
  hrTimer = setInterval(pollHeartRateOnce, HR_POLL_MS);
}

function stopHrPolling() {
  if (hrTimer) {
    clearInterval(hrTimer);
    hrTimer = null;
  }
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
// Pipeline estilo Strava/Uber:
//   raw → [aceita por acurácia] → [rejeita outlier por velocidade] → [Kalman]
//       → ponto filtrado → [gate de distância proporcional à acurácia] → rota.
function processFix(loc: Location.LocationObject) {
  if (!session || !session.active) return;

  // Sinal de vida do pipeline (relógio de parede): o watchdog usa isto para saber
  // que a task AINDA está entregando fixes. Atualiza em TODO fix bruto — mesmo o
  // impreciso — porque o que importa aqui é "o GPS está chegando", não a qualidade.
  lastFixWallTs = Date.now();

  const { latitude, longitude, speed, accuracy } = loc.coords;
  const ts = loc.timestamp || Date.now(); // domínio do device (p/ deltaSeconds)

  // Sempre atualiza a última localização conhecida (marcador do mapa), mesmo
  // que o fix seja impreciso — é só a posição "ao vivo", não entra na rota.
  // Carimba o timestamp para a UI medir a cadência real e animar a câmera por
  // esse intervalo (acompanhamento contínuo, sem "gap morto").
  session.lastLocation = { latitude, longitude, timestamp: ts };

  // Acurácia efetiva (assume um valor quando o device não reporta).
  const acc = typeof accuracy === "number" && accuracy > 0 ? accuracy : DEFAULT_ACCURACY_M;
  const accLimit = appActive ? MAX_ACCURACY_M : MAX_ACCURACY_BG_M;

  // Fix ruidoso demais: não entra no traçado oficial, mas a cabeça ao vivo
  // acompanha o cru para a polyline não “sumir” atrás do ponto azul.
  if (acc > accLimit) {
    session.liveTrailHead = { latitude, longitude, timestamp: ts, accuracy: acc };
    const now = Date.now();
    if (now - lastAccRejectTs >= ACC_REJECT_BREADCRUMB_MS) {
      lastAccRejectTs = now;
      Sentry.addBreadcrumb({
        category: "workout",
        level: "info",
        message: "tracking:fix-rejected-accuracy",
        data: { acc, accLimit, appActive, fixCount },
      });
    }
    return;
  }

  // Gap break: o GPS ficou mudo tempo demais desde o último fix aceito (processo
  // congelado com a tela apagada, túnel longo…). Zera o Kalman para que ele
  // RE-INICIE neste fix (sem suavizar por cima do vazio) e sinaliza para, mais
  // abaixo, recomeçar um trecho novo em vez de ligar uma reta cega.
  const gapSinceLastFixS =
    session.lastFixTs > 0 ? (ts - session.lastFixTs) / 1000 : 0;
  const isGapBreak = gapSinceLastFixS > MAX_FIX_GAP_S;
  if (isGapBreak) session.kf = null;

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
      if (rawSpeed > MAX_SPEED_MS[session.type] * OUTLIER_SPEED_FACTOR && acc > 10) {
        // Mantém a cabeça ao vivo no cru — a rota oficial não teleporta.
        session.liveTrailHead = { latitude, longitude, timestamp: ts, accuracy: acc };
        return;
      }
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

  // Cabeça ao vivo: posição filtrada atual. A UI desenha lastReg → liveTrailHead
  // para a polyline acompanhar o usuário (e atravessar silêncios/gaps) sem
  // esperar o gate de registro. Não conta distância.
  session.liveTrailHead = { latitude: fLat, longitude: fLng, timestamp: ts, accuracy: acc };

  // Gap break (só quando já havia um trecho em andamento): recomeça aqui. Não soma
  // distância nem velocidade do salto, marca o ponto com `gap:true` para a polyline
  // quebrar, e reancora tudo neste fix. O tempo decorrido NÃO é afetado (relógio de
  // parede). Sem isso, um congelamento viraria uma reta de vários km com pace falso.
  // A cabeça ao vivo (acima) já liga visualmente o último trecho ao usuário.
  if (isGapBreak && session.lastRegPoint) {
    session.currentSpeedMs = 0;
    session.lastPoint = { latitude: fLat, longitude: fLng };
    session.lastFixTs = ts;
    session.lastRegPoint = { latitude: fLat, longitude: fLng };
    session.route.push({ latitude: fLat, longitude: fLng, timestamp: ts, accuracy: acc, gap: true });
    return;
  }

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

  // Distância/rota: medida contra a última âncora REGISTRADA.
  // Em movimento claro: limiar baixo fixo (não infla com accuracy) — fecha o
  // buraco visual entre ponto azul e polyline. Quase parado: gate proporcianal
  // à acurácia para matar deriva do GPS.
  const regSegmentM = haversineMeters(
    session.lastRegPoint.latitude,
    session.lastRegPoint.longitude,
    fLat,
    fLng
  );
  const moving =
    session.currentSpeedMs >= MOVING_SPEED_MS ||
    (typeof speed === "number" && isFinite(speed) && speed >= MOVING_SPEED_MS);
  const distThreshold = moving
    ? MIN_SEGMENT_MOVING_M
    : Math.max(MIN_SEGMENT_M, acc * SEGMENT_ACCURACY_FACTOR);
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

  // Rota com gap: o map-matching encaixaria a reta cega de volta nas ruas
  // (mentindo o traçado). Enquanto houver quebra, mantém a rota crua já dividida.
  if (session.route.some((p) => p.gap)) return;

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
  const serialized = JSON.stringify(session);
  persistChain = persistChain
    .catch(() => {})
    .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
    .catch(() => {});
  await persistChain;
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
        if (!Array.isArray(parsed.hrSeries)) parsed.hrSeries = [];
        if (typeof parsed.hrSum !== "number") parsed.hrSum = 0;
        if (typeof parsed.hrCount !== "number") parsed.hrCount = 0;
        if (typeof parsed.currentHr !== "number") parsed.currentHr = 0;
        if (typeof parsed.maxHr !== "number") parsed.maxHr = 0;
        if (typeof parsed.watchPresent !== "boolean") parsed.watchPresent = false;
        if (typeof parsed.lastAltitude !== "number") parsed.lastAltitude = null;
        if (typeof parsed.backgroundGranted !== "boolean") parsed.backgroundGranted = false;
        if (!parsed.liveTrailHead) parsed.liveTrailHead = parsed.lastPoint ?? null;
        bgGranted = parsed.backgroundGranted;
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
    currentHr: 0,
    avgHr: 0,
    maxHr: 0,
    watchPresent: false,
    isPaused: false,
    lastLocation: null,
    liveTrailHead: null,
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
    currentHr: session.currentHr,
    avgHr: session.hrCount > 0 ? Math.round(session.hrSum / session.hrCount) : 0,
    maxHr: session.maxHr,
    watchPresent: session.watchPresent,
    isPaused: session.isPaused,
    lastLocation: session.lastLocation,
    liveTrailHead: session.liveTrailHead,
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
 * Quebra uma rota em trechos contíguos nos pontos marcados com `gap:true`. Cada
 * `gap` (silêncio do GPS) inicia um novo sub-traçado, para a UI desenhar uma
 * polyline por trecho em vez de uma reta cega cruzando a quebra. Sem gaps,
 * devolve um único trecho com a rota inteira.
 */
export function splitRouteOnGaps(route: LatLng[]): LatLng[][] {
  if (route.length === 0) return [];
  const segments: LatLng[][] = [[]];
  for (const p of route) {
    if (p.gap && segments[segments.length - 1].length > 0) segments.push([]);
    segments[segments.length - 1].push(p);
  }
  return segments.filter((s) => s.length > 0);
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

// ─── Card ao vivo na tela de bloqueio (Fase 2, Android) ─────────────────────────
// Com "Permitir o tempo todo" concedido, NOSSO foreground service
// (MOVTForegroundService) hospeda o card ao vivo do treino e o expo-location roda
// SEM FGS próprio — assim aparece UMA notificação só, atualizável mesmo com a tela
// bloqueada. Sem o background, mantemos o FGS do expo-location (senão
// startLocationUpdatesAsync exigiria background e lançaria).
let bgGranted = false;
let lastNotifTs = 0;
const NOTIF_UPDATE_MS = 2000;
// Com a tela bloqueada, atualizar Live Activity/FGS a cada 2s + map-matching
// estoura o budget de background do iOS e o SO PARA de entregar GPS. Em
// background usamos um throttle bem mais folgado; o traçado continua denso
// (processFix + persist a cada lote).
const NOTIF_BG_UPDATE_MS = 10000;
// iOS Live Activity: push de pace/distância a cada 1 s enquanto o JS está vivo.
// O TEMPO no card tiqueia nativamente (Text timerInterval) — este ticker só
// mantém as outras métricas frescas (pace muda com o elapsed mesmo sem GPS).
let liveActivityTicker: ReturnType<typeof setInterval> | null = null;
const LIVE_ACTIVITY_TICK_MS = 1000;

function startLiveActivityTicker() {
  if (Platform.OS !== "ios") return;
  stopLiveActivityTicker();
  liveActivityTicker = setInterval(() => {
    if (!session?.active || session.isPaused) return;
    updateWorkoutActivity(liveActivityData());
  }, LIVE_ACTIVITY_TICK_MS);
}

function stopLiveActivityTicker() {
  if (liveActivityTicker) {
    clearInterval(liveActivityTicker);
    liveActivityTicker = null;
  }
}

// Texto do card: "MOVT · Corrida" + "3,21 km · 18:45 · 5:50 /km" (pace/vel. média).
function workoutNotifText(): { title: string; body: string } {
  const s = getSnapshot();
  const km = s.distanceKm.toFixed(2).replace(".", ",");
  const time = formatDuration(s.elapsedSec);
  const avgMs = s.elapsedSec > 0 ? (s.distanceKm * 1000) / s.elapsedSec : 0;
  const perf =
    s.type === "Ciclismo" ? `${(avgMs * 3.6).toFixed(1)} km/h` : `${speedToPace(avgMs)} /km`;
  const status = s.isPaused ? " (pausado)" : "";
  return { title: `MOVT · ${s.type}${status}`, body: `${km} km · ${time} · ${perf}` };
}

// Dados da Live Activity (iOS) a partir do snapshot — casa com LiveActivityData.
function liveActivityData(): LiveActivityData {
  const s = getSnapshot();
  const elapsedMs = currentElapsedMs();
  const avgMs = elapsedMs > 0 ? (s.distanceKm * 1000) / (elapsedMs / 1000) : 0;
  const isCycling = s.type === "Ciclismo";
  return {
    type: s.type,
    distance: s.distanceKm.toFixed(2).replace(".", ","),
    time: formatDuration(s.elapsedSec),
    pace: isCycling ? `${(avgMs * 3.6).toFixed(1)} km/h` : `${speedToPace(avgMs)} /km`,
    paceLabel: isCycling ? "km/h" : "pace",
    paused: s.isPaused,
    // Âncora do timer nativo no SwiftUI (= agora − elapsed, respeitando pausas).
    timerStartMs: s.isPaused ? undefined : Date.now() - elapsedMs,
  };
}

// Empurra o status do treino para o SO: card no FGS (Android, modo nosso-FGS) e/ou
// Live Activity (iOS). Throttled; roda mesmo com a tela bloqueada (a partir da task
// de GPS). Cada canal é no-op quando não se aplica à plataforma/estado.
function pushWorkoutStatus(force = false) {
  if (!session?.active) return;
  const now = Date.now();
  const throttle = appActive ? NOTIF_UPDATE_MS : NOTIF_BG_UPDATE_MS;
  if (!force && now - lastNotifTs < throttle) return;
  lastNotifTs = now;
  // Android: card ao vivo no nosso FGS (só no modo nosso-FGS).
  if (bgGranted) {
    const { title, body } = workoutNotifText();
    updateWorkoutNotification(title, body);
  }
  // iOS: Live Activity / Dynamic Island (no-op até o módulo nativo existir).
  updateWorkoutActivity(liveActivityData());
}

// ─── Estratégia de foreground service (entrega de GPS × nº de notificações) ──────
// Com background concedido, o modo CARD ÚNICO usa só o MOVTForegroundService
// (Android) e o expo-location sem FGS próprio. Em campo, buracos com a tela
// apagada levaram a ligar o escape hatch: o expo-location sobe o FGS DELE
// (entrega garantida) — no Android pode aparecer 2 notificações; no iOS a
// location task fica com a entrega mais agressiva do SO.
const PREFER_RELIABLE_DELIVERY = true;

// ─── Opções de location updates (compartilhadas start/resume) ───────────────────
function buildOptions(type: WorkoutKind): Location.LocationTaskOptions {
  const base: Location.LocationTaskOptions = {
    accuracy: Location.Accuracy.BestForNavigation,
    // 500 ms (era 1000): pede fixes na taxa máxima que o GPS entrega, para o
    // acompanhamento da câmera não "pular" em alta velocidade. distanceInterval
    // baixo garante updates densos quando há deslocamento.
    timeInterval: 500,
    distanceInterval: 1,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    // iOS: sem deferral — entrega o mais contínuo possível com a tela apagada
    // (batching agressivo é o que abre “buracos” no traçado).
    deferredUpdatesInterval: 0,
    deferredUpdatesDistance: 0,
  };
  // Inclui o FGS do expo-location quando (a) não há background concedido — exigido
  // p/ as updates seguirem e evita o throw de background-permission — OU (b) o modo
  // de entrega garantida está ligado (PREFER_RELIABLE_DELIVERY).
  if (!bgGranted || PREFER_RELIABLE_DELIVERY) {
    return {
      ...base,
      foregroundService: {
        notificationTitle: "MOVT — Treino em andamento",
        notificationBody: `Acompanhando sua atividade de ${type.toLowerCase()} em tempo real`,
        notificationColor: "#BBF246",
        killServiceOnDestroy: false,
      },
    };
  }
  return base;
}

// ─── Re-arme das location updates (recuperação de serviço morto) ─────────────────
// Para e reinicia o pipeline de localização. Usado pelo watchdog e no retorno ao
// foreground quando o SO derrubou o foreground service com a tela apagada. É
// idempotente e protegido contra reentrância.
async function rearmLocationUpdates(reason: string) {
  if (rearmInProgress || !session?.active) return;
  const now = Date.now();
  if (now - lastRearmTs < REARM_MIN_INTERVAL_MS) return;
  rearmInProgress = true;
  lastRearmTs = now;
  try {
    Sentry.addBreadcrumb({
      category: "workout",
      level: "warning",
      message: "tracking:rearm",
      data: { reason, silenceMs: lastFixWallTs ? now - lastFixWallTs : -1, fixCount },
    });
    // Re-adquire o WakeLock JS como camada de redundância além do WakeLock nativo
    // do MOVTForegroundService. Em casos onde o FGS é reiniciado sem passar pelo
    // onStartCommand (ex.: kill abrupto + START_REDELIVER_INTENT pendente), garantir
    // que ao menos o lock JS esteja ativo enquanto o re-arme do GPS ocorre.
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (started) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
    }
    if (session?.active) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, buildOptions(session.type));
      // Zera a janela de silêncio para o watchdog dar um respiro ao GPS re-adquirir.
      lastFixWallTs = Date.now();
    }
  } catch (e) {
    // best-effort: se falhar, o próximo tick do watchdog tenta de novo
  } finally {
    rearmInProgress = false;
  }
}

// ─── Watchdog: detecta GPS mudo e religa o pipeline ──────────────────────────────
function startWatchdog() {
  if (watchdogTimer) return; // idempotente
  lastFixWallTs = Date.now();
  watchdogTimer = setInterval(() => {
    if (!session?.active || session.isPaused) return;
    // Re-arma em AMBOS os estados, com limiar maior em background (o SO pode
    // entregar em lote com a tela apagada; só religamos após silêncio longo).
    const silenceLimit = appActive ? WATCHDOG_SILENCE_MS : WATCHDOG_BG_SILENCE_MS;
    const silence = lastFixWallTs ? Date.now() - lastFixWallTs : 0;
    if (silence > silenceLimit) {
      rearmLocationUpdates(appActive ? "watchdog-silence" : "watchdog-silence-bg");
    }
  }, WATCHDOG_INTERVAL_MS);
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

// ─── Reação ao ciclo de vida do app (foreground/background) ──────────────────────
// No retorno ao FOREGROUND (usuário desbloqueia a tela): garante que a sessão
// esteja rehidratada e o pipeline vivo. É o momento em que o "parou no meio e não
// voltou" é corrigido — se ficou mudo enquanto apagado, re-arma imediatamente.
function handleAppStateChange(next: AppStateStatus) {
  const wasActive = appActive;
  appActive = next === "active";

  if (!appActive && wasActive && session?.active) {
    void rearmLocationUpdates("enter-background");
    Sentry.addBreadcrumb({
      category: "workout",
      level: "info",
      message: "tracking:enter-background",
      data: {
        fixCount,
        silenceMs: lastFixWallTs ? Date.now() - lastFixWallTs : -1,
        routeLen: session.route.length,
        distanceKm: Number(session.distanceKm.toFixed(3)),
      },
    });
    // Para o ticker de 1s (Live Activity) — em background ele só desperdiça
    // budget do iOS. O card continua atualizando via a task de GPS (throttle BG).
    stopLiveActivityTicker();
    stopHrPolling();
    // Persiste já (se o processo morrer, a rota até aqui sobrevive).
    persist(true);
    // Garante que o pipeline de location updates ainda está armado.
    Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
      .then((started) => {
        if (!started && session?.active) {
          return rearmLocationUpdates("enter-background-not-started");
        }
        return undefined;
      })
      .catch(() => {});
  }

  if (appActive && !wasActive && session?.active) {
    Sentry.addBreadcrumb({
      category: "workout",
      level: "info",
      message: "tracking:return-foreground",
      data: {
        fixCount,
        silenceMs: lastFixWallTs ? Date.now() - lastFixWallTs : -1,
        routeLen: session.route.length,
        distanceKm: Number(session.distanceKm.toFixed(3)),
      },
    });
    // Se ficou mudo além do limite enquanto em background, religa já (sem esperar
    // o próximo tick do watchdog). Caso contrário, apenas segue.
    const silence = lastFixWallTs ? Date.now() - lastFixWallTs : 0;
    if (silence > WATCHDOG_SILENCE_MS) {
      rearmLocationUpdates("foreground-return");
    } else {
      // Confirma que as updates ainda estão armadas (idempotente).
      resumeIfActive();
    }
    // Retoma a leitura de FC (foi ignorada em background).
    startHrPolling();
    // Religa ticker de métricas da Live Activity.
    if (!session.isPaused) startLiveActivityTicker();
    // Empurra o snapshot acumulado em background (a task não notificou a UI).
    notify();
    pushWorkoutStatus(true);
    // Map-matching ficou pausado em background — tenta um snap agora.
    maybeSnapLive();
  }
}
AppState.addEventListener("change", handleAppStateChange);

// ─── API pública ────────────────────────────────────────────────────────────────

export interface StartResult {
  ok: boolean;
  error?: "foreground-denied" | "location-disabled";
  /**
   * "Permitir o tempo todo" concedido? Se false, o rastreio com a tela apagada
   * degrada — a UI avisa, mas o treino inicia mesmo assim (best-effort).
   */
  backgroundGranted?: boolean;
}

/** Inicia uma nova sessão de rastreamento. */
export async function startTracking(type: WorkoutKind): Promise<StartResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return { ok: false, error: "foreground-denied" };

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    Sentry.addBreadcrumb({
      category: "workout",
      level: "warning",
      message: "tracking:location-services-disabled",
    });
    return { ok: false, error: "location-disabled" };
  }
  // Background ("Permitir o tempo todo"): essencial para a tela apagada. Best-effort
  // — se negado, seguimos com o foreground service, mas devolvemos o status para a
  // UI orientar o usuário a habilitar nos Ajustes.
  let backgroundGranted = false;
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    backgroundGranted = bg.status === "granted";
  } catch {
    // alguns devices/ROMs lançam aqui; seguimos com o que houver
  }
  // Define o modo de FGS ANTES de buildOptions (ele lê `bgGranted`).
  bgGranted = backgroundGranted;

  // Isenção de otimização de bateria: SEM ela, o SO congela o processo com a tela
  // apagada (causa #1 do treino "parar" no meio). Mostra o diálogo do sistema
  // (1 toque) enquanto o app não estiver isento. O nativo já checa antes de abrir.
  try {
    const ignoring = await isIgnoringBatteryOptimizations();
    if (!ignoring) requestIgnoreBatteryOptimizations();
  } catch {
    // não bloqueia o início do treino
  }

  // WakeLock parcial: mantém a CPU viva (Doze) para a task processar os fixes.

  fixCount = 0;
  lastBatchTs = Date.now();
  Sentry.addBreadcrumb({
    category: "workout",
    level: "info",
    message: "tracking:start",
    data: { type, backgroundGranted, preferReliable: PREFER_RELIABLE_DELIVERY },
  });

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
    hrSeries: [],
    hrSum: 0,
    hrCount: 0,
    currentHr: 0,
    maxHr: 0,
    watchPresent: false,
    lastAltitude: null,
    lastPoint: null,
    lastRegPoint: null,
    lastFixTs: 0,
    lastSplitKm: 0,
    lastLocation: null,
    liveTrailHead: null,
    kf: null,
    backgroundGranted,
  };
  hydrated = true; // sessão fresca; não rehidratar por cima
  await persist(true);

  // Card ao vivo na tela de bloqueio: com background concedido, NOSSO foreground
  // service hospeda a notificação (single card, atualizável mesmo bloqueado). Sem
  // background, o FGS do expo-location cuida da notificação (ver buildOptions).
  if (bgGranted) {
    const { title, body } = workoutNotifText();
  }
  // iOS: inicia a Live Activity (card na tela de bloqueio + Dynamic Island).
  // No-op fora do iOS / enquanto o módulo nativo não existir.
  startWorkoutActivity(liveActivityData());
  startLiveActivityTicker();

  // Começa a ler a FC do relógio (best-effort, só leitura — ver startHrPolling).
  startHrPolling();

  // Evita task duplicada de uma sessão anterior mal encerrada.
  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (already) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK, buildOptions(type));
  // Watchdog: religa o pipeline se o SO derrubar o serviço no meio do treino.
  startWatchdog();
  notify();
  return { ok: true, backgroundGranted };
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
  // Reflete pausa/retomada no card ao vivo (Android) e Live Activity (iOS).
  pushWorkoutStatus(true);
  if (session.isPaused) {
    stopLiveActivityTicker();
  } else {
    startLiveActivityTicker();
  }
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
  // Uma leitura final de FC (best-effort) antes de fechar, para o resumo refletir
  // o batimento mais recente; depois desliga o poller.
  await pollHeartRateOnce();
  stopHrPolling();
  stopWatchdog();
  const finalSnap = getSnapshot();

  // Passe final de alta qualidade: snap da rota inteira (best-effort). Se a rede
  // falhar, mantém o traçado encaixado que já tínhamos do snap ao vivo. Pula se a
  // rota tem gap — encaixar ligaria a reta cega da quebra de volta nas ruas.
  if (session && session.route.length >= 2 && !session.route.some((p) => p.gap)) {
    try {
      const result = await snapRoute(session.route.slice(), session.type);
      if (result && result.snapped.length >= 2) finalSnap.snappedRoute = result.snapped;
    } catch {
      // mantém finalSnap.snappedRoute (snap ao vivo)
    }
  }

  if (session) session.active = false;
  // Encerra o card ao vivo (nosso FGS, Android) e a Live Activity (iOS). No-op
  // quando não se aplica.
  endWorkoutActivity();
  stopLiveActivityTicker();
  bgGranted = false;
  Sentry.addBreadcrumb({
    category: "workout",
    level: "info",
    message: "tracking:stop",
    data: { fixCount, distanceKm: finalSnap.distanceKm, elapsedSec: finalSnap.elapsedSec },
  });
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
    // Processo religado pelo SO durante um treino: rearma o WakeLock (foi solto
    // quando o processo morreu) para a CPU não suspender de novo.
    // Restaura o modo de FGS e religa o card ao vivo (o serviço morreu com o
    // processo; START_STICKY pode tê-lo recriado com texto padrão — reafirmamos).
    bgGranted = s.backgroundGranted === true;
    if (bgGranted) {
      const { title, body } = workoutNotifText();
    }
    // Rearma também o poller de FC (o timer não sobrevive ao restart do JS).
    startHrPolling();
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (!started) {
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, buildOptions(s.type));
      } catch {
        // ignora
      }
    }
    // Rearma o watchdog (o timer não sobrevive ao restart do JS).
    startWatchdog();
    // Religa Live Activity + ticker de métricas (o id em memória morreu com o JS).
    startWorkoutActivity(liveActivityData());
    if (!s.isPaused) startLiveActivityTicker();
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
  fixCount += locations.length;

  // Diagnóstico: registra um lote no Sentry (throttled) com o gap desde o último —
  // um gap grande com a tela apagada denuncia o SO congelando o processo.
  const now = Date.now();
  if (now - lastBatchTs >= BATCH_BREADCRUMB_MS) {
    Sentry.addBreadcrumb({
      category: "workout",
      level: "info",
      message: "tracking:batch",
      data: { batch: locations.length, fixCount, gapMs: now - lastBatchTs, routeLen: session.route.length },
    });
    lastBatchTs = now;
  }

  await persist();
  // Em background: NÃO notifica a UI React (trabalho inútil) e NÃO dispara
  // map-matching (rede) — isso estoura o budget do iOS e o SO corta o GPS.
  // Só persiste a rota + atualiza o card (throttle folgado).
  if (appActive) {
    notify();
    pushWorkoutStatus();
    maybeSnapLive();
  } else {
    pushWorkoutStatus();
  }
});
