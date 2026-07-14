/**
 * liveActivityService — ponte JS para a Live Activity do treino no iOS (card na
 * tela de bloqueio + Dynamic Island, via ActivityKit / iOS 16.1+).
 *
 * ESTA CAMADA É SÓ O CONTRATO APP-SIDE. O módulo nativo `MOVTLiveActivity` (Swift)
 * e o Widget Extension ainda NÃO existem no projeto — enquanto não existirem, TODAS
 * as funções aqui são no-op silencioso (guardadas por `NativeModules.MOVTLiveActivity`).
 * Assim o app-side já fica pronto e cablado no tracker sem afetar em nada os builds
 * atuais (Android e iOS). Ver `docs/live-activity-ios.md` para a parte nativa.
 *
 * Contrato esperado do módulo nativo (a implementar num Mac):
 *   isSupported(): boolean            // ActivityAuthorizationInfo().areActivitiesEnabled em iOS 16.1+
 *   start(data: LiveActivityData): void
 *   update(data: LiveActivityData): void
 *   end(): void
 */
import { NativeModules, Platform } from "react-native";

const MOVTLiveActivity = NativeModules.MOVTLiveActivity as
  | {
      isSupported?: boolean;
      start?: (data: LiveActivityData) => void;
      update?: (data: LiveActivityData) => void;
      end?: () => void;
    }
  | undefined;

/** Payload da Live Activity — precisa casar 1:1 com o `ActivityAttributes.ContentState` no Swift. */
export interface LiveActivityData {
  /** "Corrida" | "Ciclismo" (texto exibido). */
  type: string;
  /** Distância em km, já formatada (ex.: "3,21"). */
  distance: string;
  /** Tempo decorrido formatado (ex.: "18:45"). */
  time: string;
  /** Pace ("5:50 /km") ou velocidade média ("18.4 km/h"), conforme a modalidade. */
  pace: string;
  /** Rótulo de `pace` ("pace" | "km/h") para a UI nativa. */
  paceLabel: string;
  /** Treino pausado? (a UI nativa mostra o selo "Pausado"). */
  paused: boolean;
}

/** iOS com o módulo nativo presente e Live Activities habilitadas pelo usuário. */
export const isLiveActivitySupported = (): boolean =>
  Platform.OS === "ios" && MOVTLiveActivity?.isSupported === true;

/** Inicia a Live Activity do treino. No-op fora do iOS / sem módulo nativo. */
export const startWorkoutActivity = (data: LiveActivityData): void => {
  if (Platform.OS !== "ios" || !MOVTLiveActivity?.start) return;
  try {
    MOVTLiveActivity.start(data);
  } catch {
    // Live Activity é enriquecimento — nunca afeta o treino.
  }
};

/** Atualiza os dados da Live Activity ao vivo. No-op fora do iOS / sem módulo. */
export const updateWorkoutActivity = (data: LiveActivityData): void => {
  if (Platform.OS !== "ios" || !MOVTLiveActivity?.update) return;
  try {
    MOVTLiveActivity.update(data);
  } catch {
    // silencioso
  }
};

/** Encerra a Live Activity do treino. No-op fora do iOS / sem módulo. */
export const endWorkoutActivity = (): void => {
  if (Platform.OS !== "ios" || !MOVTLiveActivity?.end) return;
  try {
    MOVTLiveActivity.end();
  } catch {
    // silencioso
  }
};
