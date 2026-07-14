import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { AlertCircle, Watch, CheckCircle } from "lucide-react-native";
import { useWearOsAuthorization } from "../hooks/useWearOsAuthorization";
import { NativeHealthManager } from "../services/nativeHealthManager";

/**
 * Variante iOS do card: Wear OS é Android-only, então no iOS o equivalente é o
 * **Apple Saúde** — os dados do Apple Watch entram automaticamente no HealthKit e
 * o app lê de lá. O botão dispara `NativeHealthManager.authorize()` (que no iOS =
 * `ensureHealthKitPermissions`), o mesmo authorize usado nas telas de Dados.
 */
const AppleHealthCard: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "authorized" | "error">("idle");
  const isAuthorized = status === "authorized";
  const isLoading = status === "loading";

  const handleConnect = async () => {
    setStatus("loading");
    try {
      const ok = await NativeHealthManager.authorize();
      setStatus(ok ? "authorized" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Watch size={24} color={isAuthorized ? "#4CAF50" : "#FF9800"} />
        <Text style={styles.title}>Apple Saúde</Text>
      </View>

      {isAuthorized ? (
        <View style={styles.authorizedContent}>
          <View style={styles.statusRow}>
            <CheckCircle size={20} color="#4CAF50" />
            <Text style={styles.statusText}>Conectado</Text>
          </View>
          <Text style={styles.description}>
            Os dados do seu Apple Watch são sincronizados automaticamente pelo app Saúde.
          </Text>
        </View>
      ) : (
        <View style={status === "error" ? styles.errorContent : styles.unauthorizedContent}>
          {status === "error" && (
            <View style={styles.statusRow}>
              <AlertCircle size={20} color="#F44336" />
              <Text style={styles.errorText}>Permissão negada</Text>
            </View>
          )}
          <Text style={styles.description}>
            Conecte o Apple Saúde para sincronizar os dados de saúde do seu Apple Watch.
          </Text>
        </View>
      )}

      {!isAuthorized && (
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {status === "error" ? "Tentar novamente" : "Conectar Apple Saúde"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Componente de card para autorização do Wear OS (Android) / Apple Saúde (iOS).
 * Exibe status e botão para solicitar autorização.
 */
export const WearOsAuthorizationCard: React.FC = () => {
  // Wear OS não existe no iOS — lá o caminho é o Apple Saúde/HealthKit.
  if (Platform.OS === "ios") return <AppleHealthCard />;

  return <WearOsAndroidCard />;
};

const WearOsAndroidCard: React.FC = () => {
  const { isAuthorized, isLoading, error, requestAuthorization } = useWearOsAuthorization();

  const handleRequestAuthorization = async () => {
    const success = await requestAuthorization();
    if (success) {
      console.log("Wear OS autorizado com sucesso!");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Watch size={24} color={isAuthorized ? "#4CAF50" : "#FF9800"} />
        <Text style={styles.title}>Dispositivo Wear OS</Text>
      </View>

      {isAuthorized ? (
        <View style={styles.authorizedContent}>
          <View style={styles.statusRow}>
            <CheckCircle size={20} color="#4CAF50" />
            <Text style={styles.statusText}>Autorizado</Text>
          </View>
          <Text style={styles.description}>
            Seus dados de saúde estão sendo sincronizados com seu dispositivo Wear OS.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContent}>
          <View style={styles.statusRow}>
            <AlertCircle size={20} color="#F44336" />
            <Text style={styles.errorText}>Erro</Text>
          </View>
          <Text style={styles.errorDescription}>{error}</Text>
        </View>
      ) : (
        <View style={styles.unauthorizedContent}>
          <Text style={styles.description}>
            Autorize o acesso para sincronizar dados de saúde com seu Wear OS.
          </Text>
        </View>
      )}

      {!isAuthorized && (
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRequestAuthorization}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {error ? "Tentar novamente" : "Autorizar Wear OS"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#192126",
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F44336",
    marginLeft: 8,
  },
  authorizedContent: {
    marginBottom: 12,
  },
  unauthorizedContent: {
    marginBottom: 12,
  },
  errorContent: {
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
  },
  errorDescription: {
    fontSize: 12,
    color: "#F44336",
    lineHeight: 16,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#FF9800",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
