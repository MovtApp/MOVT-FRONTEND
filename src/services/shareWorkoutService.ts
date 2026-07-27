/**
 * shareWorkoutService — compartilhamento do CARD de treino (estilo Strava).
 *
 * O servidor (movt-backend, POST /api/route/share-card) gera a imagem pronta:
 * o mapa real com a rota desenhada + os números do treino e a marca MOVT. Com
 * `workoutId`, o backend persiste os PNGs no Storage e nas próximas vezes
 * devolve URLs em cache (sem novo Mapbox). Aqui materializamos base64/URL num
 * arquivo local (preview + share nativo).
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Share from "react-native-share";
import Constants from "expo-constants";
import { api } from "./api";
import type { WorkoutType } from "./workoutHistoryService";

export interface ShareStat {
  label: string;
  value: string;
}

export type CardLayout = "classic" | "overlay" | "minimal";
// "square" (1:1) é usado para publicar no feed interno do MOVT, que exibe o post
// em quadrado (sem cortar as stats como aconteceria com "feed" 4:5 ou "stories").
export type CardFormat = "feed" | "stories" | "square";

export interface ShareWorkoutInput {
  route: { latitude: number; longitude: number }[];
  type: WorkoutType;
  title: string;
  subtitle: string;
  stats: ShareStat[];
  /** Modelo de como as stats ficam sobre o mapa (default: classic). */
  layout?: CardLayout;
  /** Formato da imagem (default: feed 4:5; stories = 9:16). */
  format?: CardFormat;
  /** id em user_workouts — habilita cache persistente no backend. */
  workoutId?: number | null;
  /** Índice da variante no carrossel (Stories / square). */
  variantIndex?: number;
}

/** Uma variante do card (layout + as 3 stats daquele card). */
export interface ShareVariant {
  layout?: CardLayout;
  stats: ShareStat[];
}

export interface ShareWorkoutCardsInput {
  route: { latitude: number; longitude: number }[];
  type: WorkoutType;
  title: string;
  subtitle: string;
  variants: ShareVariant[];
  workoutId?: number | null;
  format?: CardFormat;
}

export interface ShareCardsDoc {
  updatedAt?: string | null;
  cards?: Record<string, string>;
}

async function writeBase64Png(base64: string, name: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${name}`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

async function downloadPng(url: string, name: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${name}`;
  const result = await FileSystem.downloadAsync(url, uri);
  return result.uri;
}

/**
 * Gera o card no backend e grava o PNG num arquivo temporário local.
 * Retorna o URI do arquivo (para exibir no preview e depois compartilhar).
 */
export async function generateWorkoutCard(input: ShareWorkoutInput): Promise<string> {
  const res = await api.post("/route/share-card", input);
  const stamp = Date.now();
  const name = `movt-treino-${stamp}.png`;

  if (res.data?.url && typeof res.data.url === "string") {
    return downloadPng(res.data.url, name);
  }

  const base64: string | undefined = res.data?.image;
  if (!base64) throw new Error("Não foi possível gerar a imagem do treino.");
  return writeBase64Png(base64, name);
}

export interface GenerateWorkoutCardsResult {
  uris: string[];
  cached: boolean;
  shareCards?: ShareCardsDoc;
}

/**
 * Gera VÁRIOS cards (carrossel). Com workoutId, o backend reusa PNGs salvos.
 */
export async function generateWorkoutCards(
  input: ShareWorkoutCardsInput
): Promise<GenerateWorkoutCardsResult> {
  const res = await api.post("/route/share-card", {
    ...input,
    format: input.format || "feed",
  });
  const stamp = Date.now();
  const cached = !!res.data?.cached;
  const shareCards = res.data?.shareCards as ShareCardsDoc | undefined;

  const urls: string[] | undefined = Array.isArray(res.data?.urls) ? res.data.urls : undefined;
  if (urls && urls.length > 0) {
    const uris: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      uris.push(await downloadPng(urls[i], `movt-treino-${stamp}-${i}.png`));
    }
    return { uris, cached, shareCards };
  }

  const images: string[] | undefined = res.data?.images;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Não foi possível gerar as imagens do treino.");
  }
  const uris: string[] = [];
  for (let i = 0; i < images.length; i++) {
    uris.push(await writeBase64Png(images[i], `movt-treino-${stamp}-${i}.png`));
  }
  return { uris, cached, shareCards };
}

/**
 * Gera o card e o SOBE pelo backend (service_role), devolvendo a URL pública —
 * usado para PUBLICAR no feed do MOVT. Com workoutId, reusa URL em cache.
 */
export async function uploadWorkoutPostImage(input: ShareWorkoutInput): Promise<string> {
  const res = await api.post("/route/share-card", { ...input, upload: true });
  const url: string | undefined = res.data?.url;
  if (!url) throw new Error("Não foi possível preparar a imagem do treino.");
  return url;
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

/** Facebook/Meta App ID (de app.json → extra.facebookAppId). Exigido pelo IG Stories. */
export function getFacebookAppId(): string {
  const id = (Constants.expoConfig?.extra as any)?.facebookAppId;
  return typeof id === "string" ? id : "";
}

/** True se o App ID está configurado (não é o placeholder). */
export function isInstagramStoriesConfigured(): boolean {
  const id = getFacebookAppId();
  return !!id && id !== "SEU_FACEBOOK_APP_ID";
}

/**
 * Abre o Instagram direto na tela de Stories com a imagem como fundo.
 */
export async function shareWorkoutStory(uri: string): Promise<void> {
  const appId = getFacebookAppId();
  if (!appId || appId === "SEU_FACEBOOK_APP_ID") {
    throw new Error("Instagram Stories não configurado (Facebook App ID ausente).");
  }
  await Share.shareSingle({
    // @ts-ignore enum do react-native-share
    social: Share.Social.INSTAGRAM_STORIES,
    appId,
    backgroundImage: uri,
    backgroundBottomColor: "#020617",
    backgroundTopColor: "#020617",
  });
}
