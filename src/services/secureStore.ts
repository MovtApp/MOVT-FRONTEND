import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";

/**
 * Armazenamento seguro para dados sensíveis (tokens de sessão, credenciais).
 *
 * Usa o Keystore (Android) / Keychain (iOS) via expo-secure-store em vez do
 * AsyncStorage (texto puro). Inclui MIGRAÇÃO TRANSPARENTE: na primeira leitura,
 * se o valor ainda estiver no AsyncStorage (versão antiga do app), ele é movido
 * para o SecureStore e removido do legado — usuários já logados NÃO são deslogados.
 *
 * Política de fallback (assimétrica, deliberada):
 *  - secureGet: tolerante — se SecureStore falhar, tenta AsyncStorage com warning
 *    + Sentry. Permite recuperar sessões legadas/buggy sem deslogar o usuário.
 *  - secureSet: estrito — se SecureStore falhar, reporta e lança. NUNCA cria nova
 *    sessão em texto puro (fechando F19/Fase 5).
 */

// O SecureStore só aceita chaves no formato [A-Za-z0-9._-]. Chaves legadas como
// "@Auth:user" e "@spotify_token" são mapeadas para um nome válido equivalente.
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

export async function secureGet(key: string): Promise<string | null> {
  try {
    const sk = safeKey(key);
    const fromSecure = await SecureStore.getItemAsync(sk);
    if (fromSecure != null) return fromSecure;

    // Migração do armazenamento legado (AsyncStorage) -> SecureStore
    const legacy = await AsyncStorage.getItem(key);
    if (legacy != null) {
      await SecureStore.setItemAsync(sk, legacy);
      await AsyncStorage.removeItem(key);
      return legacy;
    }
    return null;
  } catch (e) {
    Sentry.captureException(e, {
      tags: { module: "secureStore", op: "get", fallback: "asyncstorage" },
    });
    console.warn("[secureStore] SecureStore.getItemAsync falhou; lendo AsyncStorage (INSEGURO).");
    return AsyncStorage.getItem(key).catch(() => null);
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(safeKey(key), value);
    // Garante que não sobre cópia em texto puro no legado.
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch (e) {
    Sentry.captureException(e, {
      tags: { module: "secureStore", op: "set" },
    });
    throw e;
  }
}

export async function secureRemove(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(safeKey(key)).catch(() => {});
  await AsyncStorage.removeItem(key).catch(() => {});
}
