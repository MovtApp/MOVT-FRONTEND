import AsyncStorage from "@react-native-async-storage/async-storage";
import { speedToPace } from "../utils/workout/performance";
import { api } from "./api";

/**
 * Histórico de treinos de performance (Corrida / Ciclismo) do MOVT.
 *
 * Estratégia OFFLINE-FIRST (corrida acontece com conexão ruim):
 *  - AsyncStorage é o cache local e a fila de pendências.
 *  - O backend (movt-backend, tabela user_workouts via /api/user/workouts) é a
 *    fonte de verdade e amarra o histórico ao usuário logado (Bearer sessionId).
 *  - saveWorkout grava local na hora (synced:false) e tenta empurrar pro backend.
 *  - getWorkouts reconcilia: empurra pendentes, baixa do servidor, faz merge e
 *    atualiza o cache; se estiver offline, devolve o cache local.
 *  - Idempotência via client_id (= id local) garante que o sync nunca duplica.
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export type WorkoutType = "Corrida" | "Ciclismo";

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface WorkoutSplit {
  km: number;
  time: string; // formatado (mm:ss)
  pace: string; // formatado (min/km)
}

export interface WorkoutRecord {
  id: string; // id local (client_id) — também usado como chave de idempotência
  type: WorkoutType;
  date: string; // ISO string
  durationSec: number;
  distanceKm: number;
  avgPace: string; // min/km formatado (corrida)
  avgSpeedKmh: number;
  kcal: number;
  route: RoutePoint[];
  splits: WorkoutSplit[];
  serverId?: number | null; // id no banco (user_workouts.id); null enquanto não sincronizado
  synced?: boolean; // true quando já confirmado no backend
}

/** Recordes pessoais do usuário, por tipo de atividade. */
export interface PersonalRecords {
  longestDistanceKm: number;
  longestDurationSec: number;
  bestPaceSecPerKm: number | null; // menor é melhor; null = sem dado
  mostKcal: number;
}

/** Resultado da checagem de recordes ao salvar um treino. */
export interface BrokenRecord {
  key: "distance" | "duration" | "pace" | "kcal";
  label: string; // mensagem pronta para exibição
}

const STORAGE_KEY = "@MOVT:workoutHistory";

// ─── Helpers internos ──────────────────────────────────────────────────────────

/** Pace médio em segundos por km a partir de distância (km) e tempo (s). */
function paceSecPerKm(distanceKm: number, durationSec: number): number | null {
  if (!distanceKm || distanceKm <= 0 || !durationSec || durationSec <= 0) return null;
  return durationSec / distanceKm;
}

// ─── Cache local (AsyncStorage) ────────────────────────────────────────────────

function sortByDateDesc(list: WorkoutRecord[]): WorkoutRecord[] {
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Lê o cache local cru (sem tocar no backend). Uso interno. */
async function readLocal(): Promise<WorkoutRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeLocal(list: WorkoutRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ─── Mapeamento backend → app ───────────────────────────────────────────────────

/** Converte uma linha de user_workouts (snake_case) em WorkoutRecord. */
function mapRowToRecord(row: any): WorkoutRecord {
  return {
    id: row.client_id || `srv-${row.id}`,
    serverId: typeof row.id === "number" ? row.id : Number(row.id),
    synced: true,
    type: row.tipo === "Ciclismo" ? "Ciclismo" : "Corrida",
    date: row.data ? new Date(row.data).toISOString() : new Date().toISOString(),
    durationSec: Number(row.duracao_seg) || 0,
    distanceKm: Number(row.distancia_km) || 0,
    avgPace: row.pace_medio || "--:--",
    avgSpeedKmh: Number(row.velocidade_media_kmh) || 0,
    kcal: Number(row.kcal) || 0,
    route: Array.isArray(row.rota) ? row.rota : [],
    splits: Array.isArray(row.splits) ? row.splits : [],
  };
}

// ─── Chamadas de backend ────────────────────────────────────────────────────────
// (API_BASE_URL já inclui "/api"; por isso os paths começam em "/user/...")

async function saveWorkoutBackend(record: WorkoutRecord): Promise<number | null> {
  const res = await api.post("/user/workouts", {
    clientId: record.id,
    tipo: record.type,
    data: record.date,
    duracaoSeg: record.durationSec,
    distanciaKm: record.distanceKm,
    paceMedio: record.avgPace,
    velocidadeMediaKmh: record.avgSpeedKmh,
    kcal: record.kcal,
    rota: record.route,
    splits: record.splits,
  });
  const w = res.data?.workout;
  return w && (typeof w.id === "number" || w.id) ? Number(w.id) : null;
}

async function getWorkoutsBackend(): Promise<WorkoutRecord[]> {
  const res = await api.get("/user/workouts");
  const rows = res.data?.workouts || [];
  return Array.isArray(rows) ? rows.map(mapRowToRecord) : [];
}

// ─── API pública ────────────────────────────────────────────────────────────────

export async function getWorkoutById(id: string): Promise<WorkoutRecord | null> {
  const list = await readLocal();
  return list.find((w) => w.id === id) || null;
}

/**
 * Persiste um treino. Deriva pace/velocidade médios, grava no cache local na
 * hora (synced:false) e tenta empurrar para o backend em seguida.
 */
export async function saveWorkout(input: {
  type: WorkoutType;
  durationSec: number;
  distanceKm: number;
  kcal: number;
  route: RoutePoint[];
  splits: WorkoutSplit[];
}): Promise<WorkoutRecord> {
  const { type, durationSec, distanceKm, kcal, route, splits } = input;

  const secPerKm = paceSecPerKm(distanceKm, durationSec);
  const avgPace = secPerKm ? speedToPace(1000 / secPerKm) : "--:--";
  const avgSpeedKmh =
    durationSec > 0 ? Number(((distanceKm / (durationSec / 3600)) || 0).toFixed(1)) : 0;

  const record: WorkoutRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    date: new Date().toISOString(),
    durationSec: Math.round(durationSec),
    distanceKm: Number(distanceKm.toFixed(2)),
    avgPace,
    avgSpeedKmh,
    kcal: Math.round(kcal),
    route: Array.isArray(route) ? route : [],
    splits: Array.isArray(splits) ? splits : [],
    serverId: null,
    synced: false,
  };

  // 1) Grava local imediatamente (não perde o treino se a rede falhar).
  const list = await readLocal();
  list.push(record);
  await writeLocal(list);

  // 2) Tenta sincronizar com o backend.
  try {
    const serverId = await saveWorkoutBackend(record);
    record.serverId = serverId;
    record.synced = true;
    const updated = (await readLocal()).map((w) => (w.id === record.id ? record : w));
    await writeLocal(updated);
  } catch {
    // Offline / erro: fica pendente; getWorkouts reenvia depois.
  }

  return record;
}

/**
 * Reconcilia local ↔ backend e retorna a lista consolidada (mais recente
 * primeiro). Empurra pendentes, baixa do servidor e atualiza o cache. Em caso
 * de falha de rede, devolve o cache local.
 */
export async function getWorkouts(): Promise<WorkoutRecord[]> {
  const local = await readLocal();

  try {
    // 1) Empurra os pendentes (synced:false).
    for (const w of local.filter((x) => !x.synced)) {
      try {
        const serverId = await saveWorkoutBackend(w);
        w.serverId = serverId;
        w.synced = true;
      } catch {
        // Mantém pendente; tenta de novo no próximo getWorkouts.
      }
    }

    // 2) Baixa a fonte de verdade do servidor.
    const remote = await getWorkoutsBackend();
    const remoteIds = new Set(remote.map((r) => r.id));

    // 3) Mantém eventuais locais ainda não sincronizados (push falhou).
    const localOnly = local.filter((w) => !w.synced && !remoteIds.has(w.id));

    const merged = sortByDateDesc([...remote, ...localOnly]);
    await writeLocal(merged);
    return merged;
  } catch {
    // Offline: devolve o que temos em cache.
    return sortByDateDesc(local);
  }
}

export async function deleteWorkout(id: string): Promise<void> {
  const local = await readLocal();
  const target = local.find((w) => w.id === id);
  await writeLocal(local.filter((w) => w.id !== id));

  // Remove no backend se já estava sincronizado.
  if (target?.serverId) {
    try {
      await api.delete(`/user/workouts/${target.serverId}`);
    } catch {
      // Best-effort: se falhar, fica removido só localmente.
    }
  }
}

// ─── Recordes pessoais ─────────────────────────────────────────────────────────

/**
 * Calcula os recordes pessoais a partir de uma lista de treinos. Se `type` for
 * informado, considera só aquela modalidade (corrida e ciclismo têm recordes
 * separados). Opcionalmente exclui um id (útil para comparar um treino recém
 * salvo com o histórico ANTERIOR a ele).
 */
export function computeRecords(
  workouts: WorkoutRecord[],
  type?: WorkoutType,
  excludeId?: string
): PersonalRecords {
  const scope = workouts.filter(
    (w) => (!type || w.type === type) && (!excludeId || w.id !== excludeId)
  );

  if (scope.length === 0) {
    return {
      longestDistanceKm: 0,
      longestDurationSec: 0,
      bestPaceSecPerKm: null,
      mostKcal: 0,
    };
  }

  let longestDistanceKm = 0;
  let longestDurationSec = 0;
  let bestPaceSecPerKm: number | null = null;
  let mostKcal = 0;

  for (const w of scope) {
    if (w.distanceKm > longestDistanceKm) longestDistanceKm = w.distanceKm;
    if (w.durationSec > longestDurationSec) longestDurationSec = w.durationSec;
    if (w.kcal > mostKcal) mostKcal = w.kcal;

    const pace = paceSecPerKm(w.distanceKm, w.durationSec);
    // Ignora paces irreais (< 2 min/km) para não fixar recorde com ruído de GPS.
    if (pace !== null && pace >= 120 && (bestPaceSecPerKm === null || pace < bestPaceSecPerKm)) {
      bestPaceSecPerKm = pace;
    }
  }

  return { longestDistanceKm, longestDurationSec, bestPaceSecPerKm, mostKcal };
}

export async function getPersonalRecords(type?: WorkoutType): Promise<PersonalRecords> {
  const list = await readLocal();
  return computeRecords(list, type);
}

/**
 * Compara um treino recém-salvo com o histórico ANTERIOR e retorna os recordes
 * batidos. Distância mínima de 0.3 km evita falso-positivo de testes curtos.
 */
export async function checkRecords(saved: WorkoutRecord): Promise<BrokenRecord[]> {
  if (saved.distanceKm < 0.3) return [];

  const list = await readLocal();
  const previous = computeRecords(list, saved.type, saved.id);
  const broken: BrokenRecord[] = [];

  // Primeiro treino da modalidade: não conta como "recorde batido".
  const hasPrevious = list.some((w) => w.type === saved.type && w.id !== saved.id);
  if (!hasPrevious) return [];

  if (saved.distanceKm > previous.longestDistanceKm) {
    broken.push({
      key: "distance",
      label: `Maior distância: ${saved.distanceKm.toFixed(2).replace(".", ",")} km`,
    });
  }
  if (saved.durationSec > previous.longestDurationSec) {
    const min = Math.floor(saved.durationSec / 60);
    broken.push({ key: "duration", label: `Maior duração: ${min} min` });
  }
  if (saved.kcal > previous.mostKcal) {
    broken.push({ key: "kcal", label: `Mais calorias: ${saved.kcal} kcal` });
  }
  const savedPace = paceSecPerKm(saved.distanceKm, saved.durationSec);
  if (
    savedPace !== null &&
    savedPace >= 120 &&
    previous.bestPaceSecPerKm !== null &&
    savedPace < previous.bestPaceSecPerKm
  ) {
    broken.push({ key: "pace", label: `Melhor pace: ${saved.avgPace} /km` });
  }

  return broken;
}

