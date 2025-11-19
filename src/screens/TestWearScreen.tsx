import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import {
  requestWearOsAuthorization,
  checkWearOsPermissions,
  initializeWearOsAuthorization,
} from "../services/wearOsPermissions";
import {
  getLatestWearOsHealthData,
  checkWearOsDeviceRegistered,
} from "../services/wearOsHealthService";

export default function TestWearScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [healthData, setHealthData] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Usuário não encontrado. Faça login.</Text>
      </SafeAreaView>
    );
  }

  const log = (msg: string) => {
    console.log(`[Wear OS Test] ${msg}`);
    setResult((prev) => `${prev}\n${msg}`);
  };

  const handleCheckPermissions = async () => {
    setLoading(true);
    setResult("");
    log("Verificando permissões...");

    try {
      const hasPermissions = await checkWearOsPermissions();
      log(`✓ Permissões: ${hasPermissions ? "Concedidas ✅" : "Negadas ❌"}`);
    } catch (error) {
      log(`✗ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    setLoading(true);
    setResult("");
    log("Solicitando permissões Wear OS...");

    try {
      const result = await requestWearOsAuthorization(user.id, (msg) => {
        log(`→ ${msg}`);
      });

      if (result.success) {
        log("✅ Autorização bem-sucedida!");
        log(`Dispositivo: ${result.deviceInfo?.nome}`);
        log(`ID: ${result.deviceInfo?.id_disp}`);
        setDeviceInfo(result.deviceInfo);
      } else {
        log(`❌ Erro: ${result.message}`);
      }
    } catch (error) {
      log(`✗ Exceção: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeFlow = async () => {
    setLoading(true);
    setResult("");
    log("Iniciando fluxo completo de autorização...");

    try {
      const result = await initializeWearOsAuthorization(user.id);
      if (result.success) {
        log("✅ Fluxo completo concluído!");
        setDeviceInfo(result.deviceInfo);
      } else {
        log(`❌ Fluxo cancelado: ${result.message}`);
      }
    } catch (error) {
      log(`✗ Erro no fluxo: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDevice = async () => {
    setLoading(true);
    setResult("");
    log("Verificando dispositivo registrado...");

    try {
      const device = await checkWearOsDeviceRegistered(user.id);

      if (device) {
        log("✅ Dispositivo encontrado!");
        log(`Nome: ${device.nome}`);
        log(`Tipo: ${device.tipo}`);
        log(`Status: ${device.status}`);
        log(`ID: ${device.id_disp}`);
        setDeviceInfo(device);
      } else {
        log("❌ Nenhum dispositivo Wear OS registrado");
      }
    } catch (error) {
      log(`✗ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchHealthData = async () => {
    setLoading(true);
    setResult("");
    log("Buscando dados de saúde do Wear OS...");

    try {
      const data = await getLatestWearOsHealthData(user.id);

      if (data) {
        log("✅ Dados recebidos!");
        log(`Frequência Cardíaca: ${data.heartRate} bpm`);
        log(`Pressão Arterial: ${data.pressure} mmHg`);
        log(`Saturação O2: ${data.oxygen}%`);
        setHealthData(data);
      } else {
        log("⚠️ Nenhum dado disponível. Verifique:");
        log("1. Dispositivo está pareado?");
        log("2. App está instalado no Wear OS?");
        log("3. Há 5 segundos de delay na primeira leitura");
      }
    } catch (error) {
      log(`✗ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setResult("");
    setHealthData(null);
    setDeviceInfo(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🧪 Teste Wear OS</Text>
        <Text style={styles.subtitle}>Usuário: {user.email}</Text>

        {/* Botões de Teste */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCheckPermissions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>1️⃣ Verificar Permissões</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRequestPermissions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>2️⃣ Solicitar Autorização</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handleInitializeFlow}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>3️⃣ Fluxo Completo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleCheckDevice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>4️⃣ Verificar Dispositivo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleFetchHealthData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>5️⃣ Buscar Dados de Saúde</Text>
            )}
          </TouchableOpacity>

          {(result || healthData || deviceInfo) && (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleClearResults}
            >
              <Text style={styles.buttonText}>🗑️ Limpar Resultados</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultados */}
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>📊 Resultados:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        {deviceInfo && (
          <View style={styles.infoBox}>
            <Text style={styles.resultTitle}>📱 Informações do Dispositivo:</Text>
            <Text style={styles.infoText}>
              Nome: {deviceInfo.nome}
              {"\n"}Tipo: {deviceInfo.tipo}
              {"\n"}Status: {deviceInfo.status}
              {"\n"}ID: {deviceInfo.id_disp}
              {deviceInfo.modelo && `\nModelo: ${deviceInfo.modelo}`}
            </Text>
          </View>
        )}

        {healthData && (
          <View style={styles.healthBox}>
            <Text style={styles.resultTitle}>❤️ Dados de Saúde:</Text>
            <Text style={styles.healthText}>
              Frequência Cardíaca: {healthData.heartRate ? `${healthData.heartRate} bpm` : "N/A"}
              {"\n"}Pressão Arterial: {healthData.pressure ? `${healthData.pressure} mmHg` : "N/A"}
              {"\n"}Saturação O2: {healthData.oxygen ? `${healthData.oxygen}%` : "N/A"}
            </Text>
          </View>
        )}

        {/* Instruções */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionTitle}>📋 Passo a Passo:</Text>
          <Text style={styles.instructionText}>
            1. Clique em &quot;Verificar Permissões&quot; para ver o status{"\n"}
            {"\n"}
            2. Clique em &quot;Solicitar Autorização&quot; para ativar sensores{"\n"}
            {"\n"}
            3. Aceite as permissões no diálogo que aparecer{"\n"}
            {"\n"}
            4. Verifique se o dispositivo foi registrado (botão 4){"\n"}
            {"\n"}
            5. Aguarde 5 segundos e busque os dados de saúde (botão 5)
            {"\n"}
            {"\n"}
            ⚠️ Dica: Se nenhum dado aparecer, verifique se o Wear OS{"\n"}
            está pareado e se há um app coletando dados lá.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  buttonGroup: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: "#1976D2",
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  infoButton: {
    backgroundColor: "#2196F3",
  },
  warningButton: {
    backgroundColor: "#FF9800",
  },
  dangerButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  resultBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  healthBox: {
    backgroundColor: "#FCE4EC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E91E63",
  },
  instructionsBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 8,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  infoText: {
    fontSize: 12,
    color: "#1B5E20",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  healthText: {
    fontSize: 12,
    color: "#880E4F",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  instructionText: {
    fontSize: 12,
    color: "#E65100",
    lineHeight: 18,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginTop: 20,
  },
});
