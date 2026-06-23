import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter, AppState, AppStateStatus } from "react-native";
import { RECONNECTED_EVENT } from "../contexts/ConnectivityContext";

/**
 * syncQueue — "outbox" genérico de escrita offline-first do MOVT.
 *
 * Generaliza o padrão que o workoutHistoryService já usava só para treinos:
 *  - Toda escrita do usuário (água, missão, etc.) é enfileirada no AsyncStorage
 *    com um `id` (= chave de idempotência) e despachada na hora se houver rede.
 *  - Se a rede falhar, o item fica pendente e é reenviado quando a conexão volta
 *    (RECONNECTED_EVENT) ou quando o app volta ao foreground.
 *  - Cada `kind` registra um handler que sabe chamar o endpoint certo. O handler
 *    recebe o `clientId` para mandar ao backend, que deduplica (ON CONFLICT) —
 *    assim o reenvio nunca duplica o dado.
 *
 * Erros são classificados: falha de rede/5xx = mantém e tenta de novo; 4xx de
 * validação = "poison", descartado (nunca vai passar). Itens sem handler ainda
 * registrado são pulados (o registro acontece no boot).
 */

const QUEUE_KEY = "@MOVT:syncQueue";
const MAX_ATTEMPTS = 8;

export interface QueueItem {
  id: string; // clientId — chave de idempotência
  kind: string; // qual handler despacha este item
  payload: any;
  createdAt: number;
  attempts: number;
}

type Handler = (payload: any, clientId: string) => Promise<void>;

const handlers: Record<string, Handler> = {};

/** Registra o despachante de um tipo de item. Chamado no boot, antes do flush. */
export function registerSyncHandler(kind: string, fn: Handler): void {
  handlers[kind] = fn;
}

/** Gera um clientId local (mesmo formato usado no histórico de treinos). */
export function makeClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Persistência da fila ─────────────────────────────────────────────────────

async function readQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeQueue(list: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list));
}

// Mutex simples: serializa as mutações read→modify→write da fila para que um
// enqueue concorrente não seja sobrescrito por um flush em andamento. A I/O de
// rede do flush acontece FORA do lock; só a reconciliação final o adquire.
let lock: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  // Mantém a cadeia viva mesmo se `fn` rejeitar (sem vazar a rejeição no lock).
  lock = run.then(
    () => {},
    () => {}
  );
  return run;
}

/** Quantos itens estão pendentes (útil para um badge de "sincronizando"). */
export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

// ─── Classificação de erro ────────────────────────────────────────────────────

/** true se o erro é definitivo (4xx de validação): não adianta reenviar. */
function isPoison(error: any): boolean {
  const status = error?.response?.status;
  // Transitórios apesar de 4xx — NÃO descartar:
  //  - 401/403: token ainda não carregado no boot ou sessão expirada (volta ao
  //    logar de novo);
  //  - 408 timeout, 429 rate limit.
  if (status === 401 || status === 403 || status === 408 || status === 429) return false;
  return typeof status === "number" && status >= 400 && status < 500;
}

// ─── Enfileiramento + flush ───────────────────────────────────────────────────

/**
 * Enfileira uma escrita e tenta despachar imediatamente. Retorna o clientId
 * (que o caller pode usar como id local otimista). Nunca lança: a gravação local
 * é o que garante que o dado não se perde.
 */
export async function enqueue(kind: string, payload: any): Promise<string> {
  const item: QueueItem = {
    id: makeClientId(),
    kind,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };

  try {
    await withLock(async () => {
      const list = await readQueue();
      list.push(item);
      await writeQueue(list);
    });
  } catch {
    // Se nem o AsyncStorage respondeu, não há o que fazer além de seguir.
  }

  // Tenta empurrar já (best-effort). Se estiver offline, fica pendente.
  flushQueue().catch(() => {});
  return item.id;
}

let flushing = false;

/**
 * Esvazia a fila: despacha cada item via seu handler. Itens de rede/5xx ficam
 * para a próxima; 4xx de validação (ou estouro de tentativas) são descartados.
 * Reentrância protegida por flag — chamadas concorrentes viram no-op.
 */
export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;

  try {
    const list = await readQueue();
    if (list.length === 0) return;

    // Processa a I/O de rede FORA do lock; acumula o que fazer com cada id.
    const doneIds = new Set<string>(); // sucesso ou descarte → remover
    const attemptUpdates = new Map<string, number>(); // transitório → re-tentar

    for (const item of list) {
      const handler = handlers[item.kind];

      // Handler ainda não registrado neste ciclo de vida: preserva para depois.
      if (!handler) continue;

      try {
        await handler(item.payload, item.id);
        doneIds.add(item.id); // sucesso → sai da fila
      } catch (error: any) {
        const attempts = item.attempts + 1;
        if (isPoison(error) || attempts >= MAX_ATTEMPTS) {
          // Descarta: erro definitivo ou tentativas demais.
          if (__DEV__) {
            console.warn(`[syncQueue] descartando item ${item.kind}#${item.id}:`, error?.message);
          }
          doneIds.add(item.id);
          continue;
        }
        // Erro transitório (offline/5xx): mantém com a tentativa contabilizada.
        attemptUpdates.set(item.id, attempts);
      }
    }

    // Reconcilia sob o lock: re-lê a fila ATUAL (pode ter ganho itens novos via
    // enqueue concorrente) e só remove/atualiza por id — nunca clobbera.
    await withLock(async () => {
      const current = await readQueue();
      const next = current
        .filter((it) => !doneIds.has(it.id))
        .map((it) =>
          attemptUpdates.has(it.id) ? { ...it, attempts: attemptUpdates.get(it.id)! } : it
        );
      await writeQueue(next);
    });
  } catch (err) {
    if (__DEV__) console.warn("[syncQueue] erro no flush:", err);
  } finally {
    flushing = false;
  }
}

// ─── Gatilhos de sincronização ────────────────────────────────────────────────

let initialized = false;

/**
 * Liga os gatilhos de flush (reconexão + volta ao foreground) e tenta um flush
 * inicial. Idempotente: chamadas repetidas (fast refresh) não duplicam listeners.
 */
export function initSyncQueue(): void {
  if (initialized) return;
  initialized = true;

  DeviceEventEmitter.addListener(RECONNECTED_EVENT, () => {
    flushQueue().catch(() => {});
  });

  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") flushQueue().catch(() => {});
  });

  // Flush de boot: reenvia o que ficou de sessões anteriores.
  flushQueue().catch(() => {});
}
