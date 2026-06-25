import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff, RotateCw } from "lucide-react-native";
import { useConnectivity } from "../contexts/ConnectivityContext";
import { subscribe, getSnapshot } from "../services/locationTrackingService";

/**
 * Gate de conexão obrigatória do MOVT.
 *
 * Substitui a filosofia offline-first anterior: quando o SO confirma ausência de
 * rede, este overlay full-screen BLOQUEIA todo o app (login incluído) e só libera
 * quando a conexão volta (Wi-Fi ou dados móveis). Diferente do antigo OfflineBanner,
 * este componente captura os toques (sem pointerEvents="none") para impedir o uso.
 *
 * Exceção: se houver um treino (corrida/ciclismo) gravando em background, o gate NÃO
 * aparece — perder a conexão num túnel não pode matar o treino em andamento, que
 * segue gravando localmente.
 *
 * Conectividade é otimista no boot (só bloqueia em offline EXPLÍCITO), reaproveitando
 * a lógica de ConnectivityContext, para não piscar o gate enquanto o SO ainda decide.
 */

/** Reativo: true enquanto um treino estiver ativo (subscreve o tracking service). */
function useWorkoutActive(): boolean {
  const [active, setActive] = useState<boolean>(() => getSnapshot().active);

  useEffect(() => {
    const unsubscribe = subscribe((snap) => setActive(snap.active));
    return unsubscribe;
  }, []);

  return active;
}

const NoConnectionGate: React.FC = () => {
  const { isOffline } = useConnectivity();
  const workoutActive = useWorkoutActive();
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);

  if (!isOffline || workoutActive) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Força o NetInfo a reavaliar a rede agora. Se a conexão voltou, o provider
      // recebe o novo estado e este overlay desmonta sozinho.
      await NetInfo.refresh();
    } catch {
      // refresh pode falhar se o módulo nativo não responder — sem efeito visível.
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.iconWrap}>
        <WifiOff size={48} color="#fff" />
      </View>
      <Text style={styles.title}>Sem conexão com a internet</Text>
      <Text style={styles.message}>
        Para usar o MOVT você precisa estar conectado. Verifique seu Wi-Fi ou os
        dados móveis e tente novamente.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRetry}
        disabled={retrying}
        activeOpacity={0.8}
      >
        {retrying ? (
          <ActivityIndicator size="small" color="#192126" />
        ) : (
          <>
            <RotateCw size={18} color="#192126" />
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: "#192126",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    minWidth: 200,
  },
  buttonText: {
    color: "#192126",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default NoConnectionGate;
