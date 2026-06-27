/**
 * shareWorkoutService — compartilhamento do CARD de treino (estilo Strava).
 *
 * O servidor (movt-backend, POST /api/route/share-card) gera a imagem pronta:
 * o mapa real com a rota desenhada + os números do treino e a marca MOVT. Aqui
 * baixamos o PNG (base64) e gravamos num arquivo temporário (generateWorkoutCard);
 * a UI mostra esse arquivo numa tela de preview e, ao confirmar, abre o menu
 * nativo de compartilhamento (shareImageFile) — Instagram, WhatsApp, Stories, etc.
 *
 * Mantemos a Mapbox e a composição da imagem 100% no backend — sem rebuild
 * nativo (nada de capturar o MapView, que sai preto no Android).
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { api } from "./api";
import type { WorkoutType } from "./workoutHistoryService";

export interface ShareStat {
  label: string;
  value: string;
}

export type CardLayout = "classic" | "overlay" | "minimal";

export interface ShareWorkoutInput {
  route: { latitude: number; longitude: number }[];
  type: WorkoutType;
  title: string;
  subtitle: string;
  stats: ShareStat[];
  /** Modelo de como as stats ficam sobre o mapa (default: classic). */
  layout?: CardLayout;
}

/**
 * Gera o card no backend e grava o PNG num arquivo temporário local.
 * Retorna o URI do arquivo (para exibir no preview e depois compartilhar).
 * Lança em caso de falha (rede/sem rota) — o caller mostra o feedback via notify.
 */
export async function generateWorkoutCard(input: ShareWorkoutInput): Promise<string> {
  const res = await api.post("/route/share-card", input);
  const base64: string | undefined = res.data?.image;
  if (!base64) throw new Error("Não foi possível gerar a imagem do treino.");

  const uri = `${FileSystem.cacheDirectory}movt-treino-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

/** Abre o menu nativo de compartilhamento para um arquivo de imagem já gerado. */
export async function shareImageFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Compartilhamento indisponível neste dispositivo.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: "Compartilhar treino",
    UTI: "public.png",
  });
}

/**
 * Conveniência: gera o card e abre o menu de compartilhamento direto (sem
 * preview). Mantido para usos simples.
 */
export async function shareWorkoutCard(input: ShareWorkoutInput): Promise<void> {
  const uri = await generateWorkoutCard(input);
  await shareImageFile(uri);
}
