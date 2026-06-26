/**
 * mapMatchingService — encaixa a rota do treino nas ruas reais (snap-to-roads).
 *
 * Fala SÓ com o backend (POST /api/route/snap), que faz o map-matching via Mapbox
 * com a chave guardada no servidor. O app nunca toca na Mapbox direto.
 *
 * Resiliente a offline/erro: qualquer falha devolve `null` — o chamador mantém a
 * linha suavizada crua (sem travar o treino). A distância/pace continuam vindo da
 * rota crua; o snap é só o traçado bonito que segue as ruas/esquinas.
 */
import * as Sentry from "@sentry/react-native";
import { api } from "./api";
import type { WorkoutKind, LatLng } from "./locationTrackingService";

/** Registra o resultado de um snap no Sentry (breadcrumb) — o snap falhava em
 * silêncio, escondendo a causa (ex.: 502 = MAPBOX_TOKEN ausente). Não altera o
 * comportamento de fallback; só dá visibilidade. */
function logSnap(reason: string, data: Record<string, unknown>) {
  Sentry.addBreadcrumb({ category: "mapmatch", level: "info", message: reason, data });
}

/** Piso de confiança do match. Abaixo disso, descartamos o snap (correu em parque/
 * trilha/pista sem rua mapeada → a Mapbox "grudaria" numa rua errada). */
export const MIN_SNAP_CONFIDENCE = 0.5;

export interface SnapResult {
  snapped: LatLng[];
  confidence: number;
}

/**
 * Encaixa `points` nas ruas. Retorna a rota encaixada + confiança, ou `null` se
 * falhar / vier vazia / não atingir o piso de confiança (aí mantém-se o cru).
 */
export async function snapRoute(
  points: LatLng[],
  kind: WorkoutKind
): Promise<SnapResult | null> {
  if (!Array.isArray(points) || points.length < 2) return null;

  // Envia só o necessário (lat/lng/accuracy) para minimizar payload.
  const payload = points
    .filter(
      (p) =>
        p &&
        typeof p.latitude === "number" &&
        isFinite(p.latitude) &&
        typeof p.longitude === "number" &&
        isFinite(p.longitude)
    )
    .map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: typeof p.accuracy === "number" ? p.accuracy : undefined,
    }));

  if (payload.length < 2) {
    logSnap("poucos pontos", { npts: payload.length });
    return null;
  }

  try {
    const res = await api.post("/route/snap", { points: payload, kind });
    const data = res.data;
    if (!data?.ok || !Array.isArray(data.snapped) || data.snapped.length < 2) {
      logSnap("resposta sem snap", { npts: payload.length, ok: data?.ok, snappedLen: Array.isArray(data?.snapped) ? data.snapped.length : null });
      return null;
    }

    const confidence = typeof data.confidence === "number" ? data.confidence : 0;
    if (confidence < MIN_SNAP_CONFIDENCE) {
      logSnap("confiança baixa", { npts: payload.length, confidence, floor: MIN_SNAP_CONFIDENCE });
      return null;
    }

    // Sanitiza o retorno antes de devolver para a UI/persistência.
    const snapped: LatLng[] = data.snapped
      .filter(
        (p: any) =>
          p &&
          typeof p.latitude === "number" &&
          isFinite(p.latitude) &&
          typeof p.longitude === "number" &&
          isFinite(p.longitude)
      )
      .map((p: any) => ({ latitude: p.latitude, longitude: p.longitude }));

    logSnap("ok", { npts: payload.length, confidence, snappedLen: snapped.length });
    return snapped.length >= 2 ? { snapped, confidence } : null;
  } catch (err: any) {
    // Offline / 502 / timeout: o chamador segue com a linha crua. 502 normalmente =
    // MAPBOX_TOKEN ausente no backend; outros = rede/timeout.
    logSnap("erro de rede", {
      npts: payload.length,
      status: err?.response?.status ?? null,
      message: err?.message ?? null,
    });
    return null;
  }
}
