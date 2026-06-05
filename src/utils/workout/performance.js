"use strict";
/**
 * Performance Metrics Utilities for MOVT
 * Based on Running/Cycling API Documentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.speedToPace = speedToPace;
exports.paceToSpeed = paceToSpeed;
exports.formatDuration = formatDuration;
exports.formatDistance = formatDistance;
exports.estimateCalories = estimateCalories;
exports.deriveSpeedMs = deriveSpeedMs;
/**
 * Converts speed (m/s) to pace (min/km)
 * Standard for Running
 */
function speedToPace(speedMs) {
    if (!speedMs || speedMs <= 0)
        return "--:--";
    var secondsPerKm = 1000 / speedMs;
    var minutes = Math.floor(secondsPerKm / 60);
    var seconds = Math.round(secondsPerKm % 60);
    // Trata casos de pace irrealisticamente alto (ex: parado)
    if (minutes > 30)
        return "--:--";
    return "".concat(minutes, ":").concat(String(seconds).padStart(2, "0"));
}
/**
 * Converts Pace (min/km) to Speed (km/h)
 */
function paceToSpeed(minutes, seconds) {
    var totalSeconds = minutes * 60 + seconds;
    if (totalSeconds === 0)
        return 0;
    return 3600 / totalSeconds;
}
/**
 * Formats duration in seconds to HH:MM:SS or MM:SS
 */
function formatDuration(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.round(seconds % 60);
    if (h > 0) {
        return "".concat(h, ":").concat(String(m).padStart(2, "0"), ":").concat(String(s).padStart(2, "0"));
    }
    return "".concat(m, ":").concat(String(s).padStart(2, "0"));
}
/**
 * Formats distance for display
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return "".concat(meters.toFixed(0), "m");
    }
    return "".concat((meters / 1000).toFixed(2), " km");
}
/**
 * Estimates Calories (Simplified MET strategy)
 * 40 kcal per km is a rough average for active users
 */
function estimateCalories(distanceKm, weightKg) {
    if (weightKg === void 0) { weightKg = 75; }
    return distanceKm * weightKg * 1.036; // Running MET formula approx
}
/**
 * Deriva a velocidade em m/s entre dois fixes de GPS.
 *
 * Muitos dispositivos (especialmente Android) reportam `coords.speed` como
 * `null` ou `-1` nos primeiros fixes ou de forma intermitente. Nesses casos
 * caímos para o cálculo distância/tempo, evitando que a velocidade seja lida
 * como 0 e dispare uma auto-pausa indevida.
 *
 * @param reportedSpeedMs velocidade reportada pelo device (m/s) — pode ser null/-1
 * @param distanceMeters  distância percorrida desde o fix anterior (metros)
 * @param deltaSeconds    tempo decorrido desde o fix anterior (segundos)
 */
function deriveSpeedMs(reportedSpeedMs, distanceMeters, deltaSeconds) {
    if (typeof reportedSpeedMs === "number" &&
        reportedSpeedMs >= 0 &&
        isFinite(reportedSpeedMs)) {
        return reportedSpeedMs;
    }
    if (deltaSeconds > 0 && isFinite(distanceMeters) && distanceMeters >= 0) {
        var derived = distanceMeters / deltaSeconds;
        return isFinite(derived) ? derived : 0;
    }
    return 0;
}
