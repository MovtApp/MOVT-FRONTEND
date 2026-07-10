/**
 * navStatePersistence — restaura a tela onde o usuário parou ao reabrir o app.
 *
 * Persiste o estado da árvore de navegação (React Navigation) no AsyncStorage e
 * o devolve no próximo cold start, para o app cair na ÚLTIMA tela (com os params)
 * em vez de sempre voltar pra Home. Mecanismo oficial do React Navigation:
 * `onStateChange` salva, `initialState` restaura.
 *
 * Garantias:
 *  - Só persiste/restaura a área autenticada ("App"): nunca telas de Auth/Verify/Info.
 *  - Janela de validade (MAX_AGE_MS): estado velho é descartado → abre na Home.
 *  - Crash-guard: arma uma flag ao restaurar; se o app quebrar logo em seguida
 *    (tela profunda com param obsoleto → GlobalErrorBoundary), a próxima abertura
 *    descarta o estado salvo e abre limpa, evitando boot-loop.
 *  - clearNavState() no logout: não restaura a sessão de outro usuário.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const NAV_STATE_KEY = "@MOVT:navState";
const CRASH_GUARD_KEY = "@MOVT:navRestoreInFlight";
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Lê o estado salvo se for válido, recente e da área "App". Caso contrário
 * (ausente, corrompido, expirado, de outra área, ou pós-crash) retorna undefined
 * e o app segue o fluxo normal (Home). Quando devolve um estado, arma o
 * crash-guard — que deve ser liberado por markRestoreSettled() após a UI estabilizar.
 */
export async function loadNavState(): Promise<object | undefined> {
  try {
    // Crash-guard: restauração anterior ficou "em voo" (quebrou antes de assentar)
    // → descarta para abrir limpo e não repetir o crash.
    const inFlight = await AsyncStorage.getItem(CRASH_GUARD_KEY);
    if (inFlight) {
      await AsyncStorage.multiRemove([NAV_STATE_KEY, CRASH_GUARD_KEY]);
      return undefined;
    }

    const raw = await AsyncStorage.getItem(NAV_STATE_KEY);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    const savedAt = parsed?.savedAt;
    if (!state || typeof savedAt !== "number") return undefined;

    if (Date.now() - savedAt > MAX_AGE_MS) {
      await AsyncStorage.removeItem(NAV_STATE_KEY);
      return undefined;
    }

    // Só restaura se a raiz for a área autenticada "App".
    const root = state?.routes?.[state.index ?? 0];
    if (!root || root.name !== "App") return undefined;

    await AsyncStorage.setItem(CRASH_GUARD_KEY, "1");
    return state;
  } catch {
    return undefined;
  }
}

/** Libera o crash-guard depois que a tela restaurada provou ser estável. */
export async function markRestoreSettled(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_GUARD_KEY);
  } catch {
    // silencioso: no pior caso o próximo cold start abre na Home uma vez
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Salva (com debounce) o estado de navegação — somente quando a raiz é "App". */
export function saveNavState(state: any): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const root = state?.routes?.[state?.index ?? 0];
      if (!root || root.name !== "App") return;
      AsyncStorage.setItem(
        NAV_STATE_KEY,
        JSON.stringify({ state, savedAt: Date.now() })
      ).catch(() => {});
    } catch {
      // estado não serializável: ignora, o app só não restaura desta vez
    }
  }, 400);
}

/** Limpa tudo (logout) — não restaurar a sessão de outro usuário. */
export async function clearNavState(): Promise<void> {
  try {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await AsyncStorage.multiRemove([NAV_STATE_KEY, CRASH_GUARD_KEY]);
  } catch {
    // silencioso
  }
}
