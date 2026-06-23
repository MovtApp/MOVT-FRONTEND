import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudOff } from "lucide-react-native";
import { useConnectivity } from "../contexts/ConnectivityContext";

/**
 * Banner global de offline. Aparece no topo (sob a status bar) sempre que o SO
 * confirma ausência de rede e some sozinho quando a conexão volta.
 *
 * Mensagem reforça a filosofia offline-first: o usuário pode continuar usando;
 * o que ele registrar será sincronizado depois (ver syncQueue).
 */
const OfflineBanner: React.FC = () => {
  const { isOffline } = useConnectivity();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]} pointerEvents="none">
      <CloudOff size={15} color="#fff" />
      <Text style={styles.text}>Sem conexão — seus registros serão salvos e sincronizados</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 6,
    backgroundColor: "#192126",
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
});

export default OfflineBanner;
