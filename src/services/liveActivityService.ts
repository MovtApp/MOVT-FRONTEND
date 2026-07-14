/**
 * liveActivityService — Live Activity do treino no iOS (card na tela de bloqueio +
 * Dynamic Island), via `expo-live-activity` (ActivityKit, iOS 16.2+).
 *
 * Mantém a MESMA API pública usada pelo tracker (`startWorkoutActivity` /
 * `updateWorkoutActivity` / `endWorkoutActivity`) e mapeia o snapshot do treino
 * para o `LiveActivityState` de schema FIXO da lib (title/subtitle + config visual).
 *
 * Seguro em qualquer plataforma/estado:
 *  - Android: guard `Platform.OS !== "ios"` retorna cedo (a lib nem é tocada).
 *  - iOS antes do build nativo: a lib usa `requireOptionalNativeModule` (módulo
 *    nulo) e o try/catch aqui engole a chamada — no-op, sem crash.
 *  - iOS pós-build: funciona.
 *
 * A UI do widget (SwiftUI) é gerada pelo config plugin da lib (target no Xcode no
 * prebuild) — não escrevemos Swift. Ver `docs/live-activity-ios.md`.
 */
import { Platform } from "react-native";
import {
  startActivity,
  updateActivity,
  stopActivity,
  type LiveActivityState,
  type LiveActivityConfig,
} from "expo-live-activity";

/** Snapshot do treino que o tracker passa (formatado). */
export interface LiveActivityData {
  /** "Corrida" | "Ciclismo". */
  type: string;
  /** Distância em km, formatada (ex.: "3,21"). */
  distance: string;
  /** Tempo decorrido formatado (ex.: "18:45"). */
  time: string;
  /** Pace ("5:50 /km") ou velocidade média ("18.4 km/h"), com unidade. */
  pace: string;
  /** Rótulo de `pace` ("pace" | "km/h") — reservado para variações de layout. */
  paceLabel: string;
  /** Treino pausado? */
  paused: boolean;
}

// Estilo do card (cores de marca MOVT). deepLinkUrl abre o app ao tocar no card.
const CONFIG: LiveActivityConfig = {
  backgroundColor: "#192126",
  titleColor: "#FFFFFF",
  subtitleColor: "#BBF246",
  deepLinkUrl: "movt://",
};

// Identificador da Activity em andamento + último estado (p/ o stop final).
let currentActivityId: string | undefined;
let lastState: LiveActivityState | undefined;

/** Mapeia o snapshot do treino para o schema fixo da lib. */
function toState(d: LiveActivityData): LiveActivityState {
  const icon = d.type === "Ciclismo" ? "🚴" : "🏃";
  const pausedTag = d.paused ? " · pausado" : "";
  return {
    title: `${icon} ${d.distance} km`,
    subtitle: `${d.time} · ${d.pace}${pausedTag}`,
  };
}

/** iOS (o suporte real é confirmado por `startActivity` devolver um id). */
export const isLiveActivitySupported = (): boolean => Platform.OS === "ios";

/** Inicia a Live Activity do treino (idempotente). No-op fora do iOS / sem nativo. */
export const startWorkoutActivity = (data: LiveActivityData): void => {
  if (Platform.OS !== "ios") return;
  try {
    lastState = toState(data);
    // Já existe uma Activity (ex.: relaunch do processo): atualiza, não duplica.
    if (currentActivityId) {
      updateActivity(currentActivityId, lastState);
      return;
    }
    const id = startActivity(lastState, CONFIG);
    if (id) currentActivityId = id;
  } catch {
    // Live Activity é enriquecimento — nunca afeta o treino.
  }
};

/** Atualiza a Live Activity ao vivo. No-op fora do iOS / sem Activity ativa. */
export const updateWorkoutActivity = (data: LiveActivityData): void => {
  if (Platform.OS !== "ios" || !currentActivityId) return;
  try {
    lastState = toState(data);
    updateActivity(currentActivityId, lastState);
  } catch {
    // silencioso
  }
};

/** Encerra a Live Activity do treino. No-op fora do iOS / sem Activity ativa. */
export const endWorkoutActivity = (): void => {
  if (Platform.OS !== "ios" || !currentActivityId) return;
  try {
    stopActivity(currentActivityId, lastState ?? { title: "MOVT" });
  } catch {
    // silencioso
  } finally {
    currentActivityId = undefined;
    lastState = undefined;
  }
};
