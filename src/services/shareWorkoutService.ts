/**
 * shareWorkoutService — compartilhamento do CARD de treino (estilo Strava).
 *
 * O servidor (movt-backend, POST /api/route/share-card) gera a imagem pronta:
 * o mapa real com a rota desenhada + os números do treino e a marca MOVT. Aqui
 * apenas baixamos o PNG (base64), gravamos num arquivo temporário e abrimos o
 * menu nativo de compartilhamento (Instagram, WhatsApp, Stories, etc.).
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

export interface ShareWorkoutInput {
  route: { latitude: number; longitude: number }[];
  type: WorkoutType;
  title: string;
  subtitle: string;
  stats: ShareStat[];
}

/**
 * Gera o card no backend e dispara o menu nativo de compartilhamento.
 * Lança em caso de falha (rede/sem rota/sharing indisponível) — o caller mostra
 * o feedback via notify.
 */
export async function shareWorkoutCard(input: ShareWorkoutInput): Promise<void> {
  const res = await api.post("/route/share-card", input);
  const base64: string | undefined = res.data?.image;
  if (!base64) throw new Error("Não foi possível gerar a imagem do treino.");

  const uri = `${FileSystem.cacheDirectory}movt-treino-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Compartilhamento indisponível neste dispositivo.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: "Compartilhar treino",
    UTI: "public.png",
  });
}
