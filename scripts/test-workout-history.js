/* eslint-disable no-console */
/**
 * Teste de integração do histórico de treinos (workoutHistoryService).
 *
 * Como o histórico é local (AsyncStorage no device) e NÃO existe endpoint HTTP,
 * curl não se aplica. Este script roda o CÓDIGO REAL do serviço fora do React
 * Native, substituindo apenas o AsyncStorage por um mock em memória, e injeta
 * dados de corrida/ciclismo realistas para validar:
 *   1. saveWorkout deriva pace/velocidade média e persiste
 *   2. getWorkouts retorna ordenado (mais recente primeiro)
 *   3. checkRecords detecta recordes superados (PR)
 *   4. getPersonalRecords / computeRecords calculam os recordes
 *   5. modalidades (Corrida x Ciclismo) têm recordes separados
 *   6. deleteWorkout remove do histórico
 *
 * Uso (a compilação TS é feita antes — ver comando no chat):
 *   node scripts/test-workout-history.js
 */

const path = require("path");
const Module = require("module");

// O código do app referencia o global __DEV__ (injetado pelo Metro). Em node ele
// não existe, então definimos antes de carregar qualquer módulo do app.
global.__DEV__ = false;

// ── Mock em memória do AsyncStorage ─────────────────────────────────────────
const store = new Map();
const memAsyncStorage = {
  getItem: async (k) => (store.has(k) ? store.get(k) : null),
  setItem: async (k, v) => {
    store.set(k, v);
  },
  removeItem: async (k) => {
    store.delete(k);
  },
};

// ── Backend FAKE em memória (imita a tabela user_workouts via /api/user/workouts)
// Permite testar tanto o caminho offline (online=false → rejeita) quanto o
// caminho de sincronização (online=true), incluindo idempotência por client_id.
const fakeBackend = {
  online: false,
  seq: 1,
  rows: [],
  post(url, body) {
    if (!this.online) return Promise.reject(new Error("offline"));
    if (url !== "/user/workouts") return Promise.reject(new Error("404"));
    const existing = this.rows.find((r) => r.client_id === body.clientId);
    if (existing) return Promise.resolve({ data: { workout: existing } }); // idempotente
    const row = {
      id: this.seq++,
      client_id: body.clientId,
      tipo: body.tipo,
      data: body.data,
      duracao_seg: body.duracaoSeg,
      distancia_km: body.distanciaKm,
      pace_medio: body.paceMedio,
      velocidade_media_kmh: body.velocidadeMediaKmh,
      kcal: body.kcal,
      rota: body.rota,
      splits: body.splits,
    };
    this.rows.push(row);
    return Promise.resolve({ data: { workout: row } });
  },
  get(url) {
    if (!this.online) return Promise.reject(new Error("offline"));
    if (url !== "/user/workouts") return Promise.reject(new Error("404"));
    const sorted = [...this.rows].sort((a, b) => new Date(b.data) - new Date(a.data));
    return Promise.resolve({ data: { workouts: sorted } });
  },
  delete(url) {
    if (!this.online) return Promise.reject(new Error("offline"));
    const id = Number(url.split("/").pop());
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx >= 0) this.rows.splice(idx, 1);
    return Promise.resolve({ data: { message: "ok" } });
  },
};
const axiosClient = {
  get: (...a) => fakeBackend.get(...a),
  post: (...a) => fakeBackend.post(...a),
  delete: (...a) => fakeBackend.delete(...a),
  interceptors: { request: { use: () => {} }, response: { use: () => {} } },
};
const axiosStub = { create: () => axiosClient };

// ── Stubs de módulos nativos (não existem fora do React Native) ──────────────
const secureStoreStub = {
  getItemAsync: async () => null,
  setItemAsync: async () => {},
  deleteItemAsync: async () => {},
};
const sentryStub = new Proxy({}, { get: () => () => {} });

// Intercepta o require dos módulos nativos/rede, devolvendo os mocks.
const origLoad = Module._load;
Module._load = function (request) {
  if (request === "@react-native-async-storage/async-storage") return memAsyncStorage;
  if (request === "axios") return axiosStub;
  if (request === "expo-secure-store") return secureStoreStub;
  if (request === "@sentry/react-native") return sentryStub;
  return origLoad.apply(this, arguments);
};

// Carrega o serviço REAL já transpilado para JS.
const svc = require(path.join(__dirname, ".tmp-wh", "services", "workoutHistoryService.js"));

// ── Helpers ──────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
function assert(label, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}${extra ? ` → ${extra}` : ""}`);
  }
}

// Gera uma rota plausível (linha reta em São Paulo) com N pontos cobrindo ~distKm.
function fakeRoute(distKm, n = 8) {
  const startLat = -23.5613;
  const startLng = -46.6565;
  const dLatTotal = distKm / 111.32; // graus de latitude para a distância
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      latitude: startLat + (dLatTotal * i) / (n - 1),
      longitude: startLng,
    });
  }
  return pts;
}

const fmtPace = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ── Cenários ───────────────────────────────────────────────────────────────
async function run() {
  console.log("\n🏃  TESTE — Histórico de Treinos MOVT (dados simulados reais)\n");

  // ── Corrida #1: 5,00 km em 25:00 (pace 5:00/km) ────────────────────────────
  console.log("1) Salvando Corrida #1 — 5,00 km / 25min");
  const c1 = await svc.saveWorkout({
    type: "Corrida",
    durationSec: 1500,
    distanceKm: 5.0,
    kcal: 389, // estimateCalories(5)
    route: fakeRoute(5.0),
    splits: [
      { km: 1, time: "5:02", pace: "5:02" },
      { km: 2, time: "10:05", pace: "5:03" },
      { km: 3, time: "15:01", pace: "4:56" },
      { km: 4, time: "20:08", pace: "5:07" },
      { km: 5, time: "25:00", pace: "4:52" },
    ],
  });
  assert("pace médio derivado = 5:00", c1.avgPace === "5:00", c1.avgPace);
  assert("velocidade média = 12 km/h", c1.avgSpeedKmh === 12, String(c1.avgSpeedKmh));
  const broken1 = await svc.checkRecords(c1);
  assert("primeiro treino não conta como recorde (broken=[])", broken1.length === 0,
    JSON.stringify(broken1));

  // ── Corrida #2: 7,20 km em 35:00 (pace ~4:52/km) — bate vários recordes ─────
  console.log("\n2) Salvando Corrida #2 — 7,20 km / 35min (deve bater recordes)");
  const c2 = await svc.saveWorkout({
    type: "Corrida",
    durationSec: 2100,
    distanceKm: 7.2,
    kcal: 559,
    route: fakeRoute(7.2),
    splits: [],
  });
  const broken2 = await svc.checkRecords(c2);
  const keys2 = broken2.map((b) => b.key).sort();
  console.log("   recordes batidos:", broken2.map((b) => b.label).join(" | ") || "(nenhum)");
  assert("bateu recorde de distância", keys2.includes("distance"));
  assert("bateu recorde de duração", keys2.includes("duration"));
  assert("bateu recorde de calorias", keys2.includes("kcal"));
  assert("bateu recorde de pace (4:51 < 5:00)", keys2.includes("pace"),
    `pace c2=${fmtPace(2100 / 7.2)}`);

  // ── Ciclismo #1: 22,5 km em 45:00 — modalidade separada ────────────────────
  console.log("\n3) Salvando Ciclismo #1 — 22,5 km / 45min (modalidade separada)");
  const b1 = await svc.saveWorkout({
    type: "Ciclismo",
    durationSec: 2700,
    distanceKm: 22.5,
    kcal: 1748,
    route: fakeRoute(22.5, 12),
    splits: [],
  });
  assert("velocidade média ciclismo = 30 km/h", b1.avgSpeedKmh === 30, String(b1.avgSpeedKmh));
  const brokenB1 = await svc.checkRecords(b1);
  assert("1º ciclismo não conta como recorde (separado da corrida)",
    brokenB1.length === 0, JSON.stringify(brokenB1));

  // ── Verificações de agregação ──────────────────────────────────────────────
  console.log("\n4) Verificando histórico e recordes");
  const all = await svc.getWorkouts();
  assert("3 treinos no histórico", all.length === 3, String(all.length));
  assert("ordenado: mais recente primeiro (Ciclismo)", all[0].type === "Ciclismo", all[0].type);

  const recCorrida = await svc.getPersonalRecords("Corrida");
  assert("recorde de distância Corrida = 7,2 km", recCorrida.longestDistanceKm === 7.2,
    String(recCorrida.longestDistanceKm));
  assert("recorde de duração Corrida = 2100s", recCorrida.longestDurationSec === 2100,
    String(recCorrida.longestDurationSec));

  const recCiclismo = await svc.getPersonalRecords("Ciclismo");
  assert("recorde de distância Ciclismo = 22,5 km (não mistura com corrida)",
    recCiclismo.longestDistanceKm === 22.5, String(recCiclismo.longestDistanceKm));

  // ── Exclusão ───────────────────────────────────────────────────────────────
  console.log("\n5) Excluindo Corrida #2");
  await svc.deleteWorkout(c2.id);
  const afterDel = await svc.getWorkouts();
  assert("histórico ficou com 2 treinos", afterDel.length === 2, String(afterDel.length));
  const recAfter = await svc.getPersonalRecords("Corrida");
  assert("recorde de distância Corrida voltou para 5,0 km",
    recAfter.longestDistanceKm === 5.0, String(recAfter.longestDistanceKm));

  // ── Sincronização com o backend (online) ───────────────────────────────────
  console.log("\n6) Sincronização com backend (online)");
  fakeBackend.online = true; // backend agora acessível
  const beforeSync = await svc.getWorkouts(); // empurra pendentes + baixa do servidor
  assert("todos sincronizados (synced=true)", beforeSync.every((w) => w.synced === true),
    JSON.stringify(beforeSync.map((w) => w.synced)));
  assert("todos com serverId numérico",
    beforeSync.every((w) => typeof w.serverId === "number"));
  assert("backend recebeu os 2 treinos locais", fakeBackend.rows.length === 2,
    String(fakeBackend.rows.length));

  // Idempotência: novo sync não duplica no servidor
  const afterSync = await svc.getWorkouts();
  assert("idempotente: backend continua com 2", fakeBackend.rows.length === 2,
    String(fakeBackend.rows.length));
  assert("contagem local estável (2)", afterSync.length === 2, String(afterSync.length));

  // Delete propaga para o backend
  await svc.deleteWorkout(afterSync[0].id);
  assert("delete propagou: backend ficou com 1", fakeBackend.rows.length === 1,
    String(fakeBackend.rows.length));
  const afterDelete2 = await svc.getWorkouts();
  assert("local consistente com backend (1)", afterDelete2.length === 1,
    String(afterDelete2.length));

  // Persistência entre "dispositivos": limpa o cache local e baixa do servidor
  store.clear();
  const fromServer = await svc.getWorkouts();
  assert("novo device baixa o histórico do servidor (1)", fromServer.length === 1,
    String(fromServer.length));
  assert("registro do servidor mapeado com serverId",
    typeof fromServer[0].serverId === "number");

  // ── Resumo ─────────────────────────────────────────────────────────────────
  console.log(`\n──────────────────────────────────────────`);
  console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
  console.log(`──────────────────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("Erro no teste:", e);
  process.exit(1);
});
