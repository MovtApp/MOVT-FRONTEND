/**
 * Performance Metrics Utilities for MOVT
 * Based on Running/Cycling API Documentation
 */

/**
 * Converts speed (m/s) to pace (min/km)
 * Standard for Running
 */
export function speedToPace(speedMs: number): string {
  if (!speedMs || speedMs <= 0) return "--:--";
  const secondsPerKm = 1000 / speedMs;

  // Arredonda o TOTAL de segundos antes de separar em min:seg. Arredondar os
  // segundos isoladamente (round(secPerKm % 60)) podia gerar "5:60" quando o
  // resto caía em [59.5, 60) — agora rola corretamente para "6:00".
  const totalSec = Math.round(secondsPerKm);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;

  // Trata casos de pace irrealisticamente alto (ex: parado)
  if (minutes > 30) return "--:--";

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Converts Pace (min/km) to Speed (km/h)
 */
export function paceToSpeed(minutes: number, seconds: number): number {
  const totalSeconds = minutes * 60 + seconds;
  if (totalSeconds === 0) return 0;
  return 3600 / totalSeconds;
}

/**
 * Formats duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Formats distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Estimates Calories (Simplified MET strategy)
 * 40 kcal per km is a rough average for active users
 */
export function estimateCalories(distanceKm: number, weightKg: number = 75): number {
  return distanceKm * weightKg * 1.036; // Running MET formula approx
}

/**
 * Deriva a velocidade em m/s entre dois fixes de GPS.
 *
 * Muitos dispositivos (especialmente Android) reportam `coords.speed` como
 * `null` ou `-1` nos primeiros fixes ou de forma intermitente. Nesses casos
 * caímos para o cálculo distância/tempo, evitando que a velocidade seja lida
 * como 0 de forma indevida.
 *
 * @param reportedSpeedMs velocidade reportada pelo device (m/s) — pode ser null/-1
 * @param distanceMeters  distância percorrida desde o fix anterior (metros)
 * @param deltaSeconds    tempo decorrido desde o fix anterior (segundos)
 */
export function deriveSpeedMs(
  reportedSpeedMs: number | null | undefined,
  distanceMeters: number,
  deltaSeconds: number
): number {
  if (
    typeof reportedSpeedMs === "number" &&
    reportedSpeedMs >= 0 &&
    isFinite(reportedSpeedMs)
  ) {
    return reportedSpeedMs;
  }
  if (deltaSeconds > 0 && isFinite(distanceMeters) && distanceMeters >= 0) {
    const derived = distanceMeters / deltaSeconds;
    return isFinite(derived) ? derived : 0;
  }
  return 0;
}
