import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { DeviceEventEmitter } from "react-native";

/**
 * Consciência de conectividade do MOVT (base da estratégia offline-first).
 *
 * Filosofia: o app NUNCA bloqueia por falta de internet. Esta camada apenas
 * INFORMA o resto do app se há rede, para:
 *  - exibir o banner global de offline (OfflineBanner);
 *  - servir cache de leitura sem apagá-lo (AppDataContext);
 *  - disparar o flush da fila de escrita (syncQueue) quando a conexão volta.
 *
 * `isInternetReachable` pode vir `null` enquanto o SO ainda não decidiu — nesse
 * caso assumimos ONLINE para não piscar "offline" indevidamente no boot. Só
 * tratamos como offline quando há sinal EXPLÍCITO de ausência de rede.
 */

interface ConnectivityContextData {
  /** true quando há conexão utilizável (default otimista enquanto indefinido). */
  isOnline: boolean;
  /** true apenas quando o SO confirma ausência de rede/Internet. */
  isOffline: boolean;
  /** Estado cru do NetInfo, para casos avançados. */
  raw: NetInfoState | null;
}

const ConnectivityContext = createContext<ConnectivityContextData>({
  isOnline: true,
  isOffline: false,
  raw: null,
});

/** Evento emitido na transição offline → online (consumido pelo syncQueue). */
export const RECONNECTED_EVENT = "movt:reconnected";

/** Deriva o "offline explícito" a partir de um NetInfoState. */
function deriveOffline(state: NetInfoState | null): boolean {
  if (!state) return false; // ainda indefinido: assume online
  if (state.isConnected === false) return true;
  // isInternetReachable: true | false | null. Só offline quando explicitamente false.
  if (state.isInternetReachable === false) return true;
  return false;
}

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [raw, setRaw] = useState<NetInfoState | null>(null);
  const wasOfflineRef = useRef(false);

  const handleState = useCallback((state: NetInfoState) => {
    setRaw(state);
    const offline = deriveOffline(state);

    // Transição offline → online: avisa quem precisa reenviar pendências.
    if (wasOfflineRef.current && !offline) {
      DeviceEventEmitter.emit(RECONNECTED_EVENT);
    }
    wasOfflineRef.current = offline;
  }, []);

  useEffect(() => {
    // Blindagem: se o módulo nativo RNCNetInfo não estiver no binário (build
    // gerado antes de adicionar a lib), `NetInfo.*` lança. Nesse caso degradamos
    // para "assume online" e a feature fica inerte — nunca derruba o app. O fix
    // de verdade é rebuildar o nativo (autolinking inclui o RNCNetInfo).
    let unsubscribe: (() => void) | undefined;
    try {
      NetInfo.fetch().then(handleState).catch(() => {});
      unsubscribe = NetInfo.addEventListener(handleState);
    } catch (err) {
      if (__DEV__) {
        console.warn(
          "[Connectivity] NetInfo indisponível (módulo nativo ausente? rebuild necessário):",
          err
        );
      }
    }
    return () => unsubscribe?.();
  }, [handleState]);

  const isOffline = deriveOffline(raw);

  return (
    <ConnectivityContext.Provider value={{ isOnline: !isOffline, isOffline, raw }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export function useConnectivity(): ConnectivityContextData {
  return useContext(ConnectivityContext);
}
