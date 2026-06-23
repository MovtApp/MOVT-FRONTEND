/**
 * geo.ts — utilidades geográficas para rastreamento de treino com qualidade
 * "estilo Strava/Uber", 100% em JS (sem módulo nativo novo).
 *
 * Contém:
 *  - haversineMeters: distância entre dois pontos (metros).
 *  - Kalman 1D para lat/lng (suaviza o ruído do GPS ponderando pela acurácia do
 *    fix). É o que tira o "serrilhado" do traçado sem cortar caminho.
 *  - simplifyRoute: Douglas-Peucker em metros (reduz milhares de pontos sem
 *    perder a forma — performance no replay).
 *  - MAX_SPEED_MS / KALMAN_Q: parâmetros por modalidade (corrida x ciclismo).
 */

export type Modality = "Corrida" | "Ciclismo";

/** Velocidade máxima plausível (m/s) por modalidade — usada para matar "teleportes" do GPS. */
export const MAX_SPEED_MS: Record<Modality, number> = {
  Corrida: 12, // ~43 km/h (margem folgada acima de um sprint)
  Ciclismo: 30, // ~108 km/h (descida agressiva)
};

/** Ruído de processo BASE do Kalman (m/s): quão rápido a pessoa pode se mover entre fixes. */
export const KALMAN_Q: Record<Modality, number> = {
  Corrida: 3,
  Ciclismo: 6,
};

/** Quanto a velocidade atual aumenta o Q do Kalman (adimensional). */
export const Q_SPEED_FACTOR = 0.5;

/**
 * Ruído de processo ADAPTATIVO à velocidade. Em alta velocidade o filtro precisa
 * "acreditar" mais nas medições (Q alto) para não cortar curva / ficar atrás da
 * posição real; parado/lento, Q baixo suaviza o jitter. `q = base + k·v`.
 */
export function kalmanQForSpeed(baseQ: number, speedMs: number): number {
  const v = typeof speedMs === "number" && isFinite(speedMs) && speedMs > 0 ? speedMs : 0;
  return baseQ + Q_SPEED_FACTOR * v;
}

const EARTH_RADIUS_M = 6371000;
const DEG = Math.PI / 180;
const METERS_PER_DEG_LAT = 111320;

/** Distância em metros entre dois pares lat/lng (Haversine). */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// ─── Kalman 1D para posição GPS ──────────────────────────────────────────────────
// Implementação canônica do filtro de GPS: a variância é mantida em metros² e a
// acurácia reportada pelo device entra como variância da medida. O ganho K é
// adimensional, então misturar graus (lat/lng) com variância em metros funciona.
export interface KalmanState {
  lat: number; // estimativa atual (graus)
  lng: number; // estimativa atual (graus)
  variance: number; // metros²
  ts: number; // timestamp do último update (ms)
}

/** Inicia o filtro com o primeiro fix válido. */
export function kalmanInit(lat: number, lng: number, accuracyM: number, ts: number): KalmanState {
  const acc = accuracyM > 0 ? accuracyM : 20;
  return { lat, lng, variance: acc * acc, ts };
}

/**
 * Incorpora um novo fix. Retorna um NOVO estado cujos `lat`/`lng` já são a
 * posição filtrada (suavizada). `qMs` é o ruído de processo da modalidade.
 */
export function kalmanUpdate(
  s: KalmanState,
  lat: number,
  lng: number,
  accuracyM: number,
  ts: number,
  qMs: number
): KalmanState {
  const acc = accuracyM > 0 ? accuracyM : 20;
  let variance = s.variance;
  const dtSec = (ts - s.ts) / 1000;
  if (dtSec > 0) variance += dtSec * qMs * qMs; // o tempo aumenta a incerteza

  const k = variance / (variance + acc * acc); // ganho de Kalman (0..1)
  return {
    lat: s.lat + k * (lat - s.lat),
    lng: s.lng + k * (lng - s.lng),
    variance: (1 - k) * variance,
    ts,
  };
}

// ─── Douglas-Peucker (simplificação de polyline, tolerância em metros) ────────────
interface PlanarPoint {
  latitude: number;
  longitude: number;
}

/** Distância perpendicular (m) de `p` ao segmento `a`→`b`, via projeção equiretangular. */
function perpDistanceMeters(p: PlanarPoint, a: PlanarPoint, b: PlanarPoint): number {
  const lat0 = a.latitude * DEG;
  const mPerDegLng = METERS_PER_DEG_LAT * Math.cos(lat0);
  const ax = 0;
  const ay = 0;
  const bx = (b.longitude - a.longitude) * mPerDegLng;
  const by = (b.latitude - a.latitude) * METERS_PER_DEG_LAT;
  const px = (p.longitude - a.longitude) * mPerDegLng;
  const py = (p.latitude - a.latitude) * METERS_PER_DEG_LAT;

  const dx = bx - ax;
  const dy = by - ay;
  const segLen2 = dx * dx + dy * dy;
  if (segLen2 === 0) return Math.hypot(px - ax, py - ay);

  let t = ((px - ax) * dx + (py - ay) * dy) / segLen2;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Simplifica a rota com Douglas-Peucker (iterativo, sem recursão — seguro para
 * milhares de pontos). `epsilonM` é a tolerância em metros: pontos que desviam
 * menos que isso da reta são removidos. Preserva a forma do traçado.
 */
export function simplifyRoute<T extends PlanarPoint>(points: T[], epsilonM = 4): T[] {
  const n = points.length;
  if (n < 3) return points.slice();

  const keep = new Array<boolean>(n).fill(false);
  keep[0] = true;
  keep[n - 1] = true;

  const stack: Array<[number, number]> = [[0, n - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const d = perpDistanceMeters(points[i], points[start], points[end]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > epsilonM && index !== -1) {
      keep[index] = true;
      stack.push([start, index]);
      stack.push([index, end]);
    }
  }

  const out: T[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i]);
  return out;
}
