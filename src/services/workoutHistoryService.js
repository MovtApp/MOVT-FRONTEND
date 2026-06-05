"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkouts = getWorkouts;
exports.getWorkoutById = getWorkoutById;
exports.saveWorkout = saveWorkout;
exports.deleteWorkout = deleteWorkout;
exports.computeRecords = computeRecords;
exports.getPersonalRecords = getPersonalRecords;
exports.checkRecords = checkRecords;
var async_storage_1 = require("@react-native-async-storage/async-storage");
var performance_1 = require("../utils/workout/performance");
var STORAGE_KEY = "@MOVT:workoutHistory";
// ─── Helpers internos ──────────────────────────────────────────────────────────
/** Pace médio em segundos por km a partir de distância (km) e tempo (s). */
function paceSecPerKm(distanceKm, durationSec) {
    if (!distanceKm || distanceKm <= 0 || !durationSec || durationSec <= 0)
        return null;
    return durationSec / distanceKm;
}
// ─── CRUD local ──────────────────────────────────────────────────────────────
function getWorkouts() {
    return __awaiter(this, void 0, void 0, function () {
        var raw, list, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.getItem(STORAGE_KEY)];
                case 1:
                    raw = _b.sent();
                    list = raw ? JSON.parse(raw) : [];
                    // Mais recentes primeiro
                    return [2 /*return*/, Array.isArray(list)
                            ? list.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); })
                            : []];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getWorkoutById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var list;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getWorkouts()];
                case 1:
                    list = _a.sent();
                    return [2 /*return*/, list.find(function (w) { return w.id === id; }) || null];
            }
        });
    });
}
/**
 * Persiste um treino. Recebe os dados crus do tracking e deriva pace/velocidade
 * médios antes de salvar. Retorna o registro salvo.
 */
function saveWorkout(input) {
    return __awaiter(this, void 0, void 0, function () {
        var type, durationSec, distanceKm, kcal, route, splits, secPerKm, avgPace, avgSpeedKmh, record, list;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    type = input.type, durationSec = input.durationSec, distanceKm = input.distanceKm, kcal = input.kcal, route = input.route, splits = input.splits;
                    secPerKm = paceSecPerKm(distanceKm, durationSec);
                    avgPace = secPerKm ? (0, performance_1.speedToPace)(1000 / secPerKm) : "--:--";
                    avgSpeedKmh = durationSec > 0 ? Number(((distanceKm / (durationSec / 3600)) || 0).toFixed(1)) : 0;
                    record = {
                        id: "".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8)),
                        type: type,
                        date: new Date().toISOString(),
                        durationSec: Math.round(durationSec),
                        distanceKm: Number(distanceKm.toFixed(2)),
                        avgPace: avgPace,
                        avgSpeedKmh: avgSpeedKmh,
                        kcal: Math.round(kcal),
                        route: Array.isArray(route) ? route : [],
                        splits: Array.isArray(splits) ? splits : [],
                    };
                    return [4 /*yield*/, getWorkouts()];
                case 1:
                    list = _a.sent();
                    list.push(record);
                    return [4 /*yield*/, async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(list))];
                case 2:
                    _a.sent();
                    // TODO(backend): quando o endpoint existir, sincronizar aqui.
                    // saveWorkoutBackend(record).catch(() => {});
                    return [2 /*return*/, record];
            }
        });
    });
}
function deleteWorkout(id) {
    return __awaiter(this, void 0, void 0, function () {
        var list, filtered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getWorkouts()];
                case 1:
                    list = _a.sent();
                    filtered = list.filter(function (w) { return w.id !== id; });
                    return [4 /*yield*/, async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(filtered))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ─── Recordes pessoais ─────────────────────────────────────────────────────────
/**
 * Calcula os recordes pessoais a partir de uma lista de treinos. Se `type` for
 * informado, considera só aquela modalidade (corrida e ciclismo têm recordes
 * separados). Opcionalmente exclui um id (útil para comparar um treino recém
 * salvo com o histórico ANTERIOR a ele).
 */
function computeRecords(workouts, type, excludeId) {
    var scope = workouts.filter(function (w) { return (!type || w.type === type) && (!excludeId || w.id !== excludeId); });
    if (scope.length === 0) {
        return {
            longestDistanceKm: 0,
            longestDurationSec: 0,
            bestPaceSecPerKm: null,
            mostKcal: 0,
        };
    }
    var longestDistanceKm = 0;
    var longestDurationSec = 0;
    var bestPaceSecPerKm = null;
    var mostKcal = 0;
    for (var _i = 0, scope_1 = scope; _i < scope_1.length; _i++) {
        var w = scope_1[_i];
        if (w.distanceKm > longestDistanceKm)
            longestDistanceKm = w.distanceKm;
        if (w.durationSec > longestDurationSec)
            longestDurationSec = w.durationSec;
        if (w.kcal > mostKcal)
            mostKcal = w.kcal;
        var pace = paceSecPerKm(w.distanceKm, w.durationSec);
        // Ignora paces irreais (< 2 min/km) para não fixar recorde com ruído de GPS.
        if (pace !== null && pace >= 120 && (bestPaceSecPerKm === null || pace < bestPaceSecPerKm)) {
            bestPaceSecPerKm = pace;
        }
    }
    return { longestDistanceKm: longestDistanceKm, longestDurationSec: longestDurationSec, bestPaceSecPerKm: bestPaceSecPerKm, mostKcal: mostKcal };
}
function getPersonalRecords(type) {
    return __awaiter(this, void 0, void 0, function () {
        var list;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getWorkouts()];
                case 1:
                    list = _a.sent();
                    return [2 /*return*/, computeRecords(list, type)];
            }
        });
    });
}
/**
 * Compara um treino recém-salvo com o histórico ANTERIOR e retorna os recordes
 * batidos. Distância mínima de 0.3 km evita falso-positivo de testes curtos.
 */
function checkRecords(saved) {
    return __awaiter(this, void 0, void 0, function () {
        var list, previous, broken, hasPrevious, min, savedPace;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (saved.distanceKm < 0.3)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, getWorkouts()];
                case 1:
                    list = _a.sent();
                    previous = computeRecords(list, saved.type, saved.id);
                    broken = [];
                    hasPrevious = list.some(function (w) { return w.type === saved.type && w.id !== saved.id; });
                    if (!hasPrevious)
                        return [2 /*return*/, []];
                    if (saved.distanceKm > previous.longestDistanceKm) {
                        broken.push({
                            key: "distance",
                            label: "Maior dist\u00E2ncia: ".concat(saved.distanceKm.toFixed(2).replace(".", ","), " km"),
                        });
                    }
                    if (saved.durationSec > previous.longestDurationSec) {
                        min = Math.floor(saved.durationSec / 60);
                        broken.push({ key: "duration", label: "Maior dura\u00E7\u00E3o: ".concat(min, " min") });
                    }
                    if (saved.kcal > previous.mostKcal) {
                        broken.push({ key: "kcal", label: "Mais calorias: ".concat(saved.kcal, " kcal") });
                    }
                    savedPace = paceSecPerKm(saved.distanceKm, saved.durationSec);
                    if (savedPace !== null &&
                        savedPace >= 120 &&
                        previous.bestPaceSecPerKm !== null &&
                        savedPace < previous.bestPaceSecPerKm) {
                        broken.push({ key: "pace", label: "Melhor pace: ".concat(saved.avgPace, " /km") });
                    }
                    return [2 /*return*/, broken];
            }
        });
    });
}
// ─── Sync com backend (futuro) ─────────────────────────────────────────────────
// O backend (movt-backend) ainda não expõe endpoint de treinos. Quando expuser,
// implementar abaixo e ligar a sincronização em saveWorkout/getWorkouts, no
// mesmo modelo do missionService (tenta backend, cai pro local).
//
// export async function saveWorkoutBackend(record: WorkoutRecord): Promise<void> {
//   await api.post("/user/workouts", record);
// }
// export async function getWorkoutsBackend(): Promise<WorkoutRecord[]> {
//   const res = await api.get("/user/workouts");
//   return res.data?.workouts || [];
// }
