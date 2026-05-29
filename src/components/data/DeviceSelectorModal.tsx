import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import { Buffer } from "buffer";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import {
  Watch,
  Bluetooth,
  CheckCircle2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Smartphone,
  Headphones,
  Monitor,
} from "lucide-react-native";
import {
  getRegisteredDevices,
  registerWearOsDevice,
  WearOsDeviceData,
} from "../../services/wearOsHealthService";
import { useAuth } from "../../contexts/AuthContext";
import Animated, { FadeInDown } from "react-native-reanimated";
import { bluetoothService, HEART_RATE_SERVICE_UUID } from "../../services/bluetoothService";

interface DeviceSelectorModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDeviceSelected?: (device: any) => void;
}

// Manager global já é tratado pelo bluetoothService

const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({
  isVisible,
  onClose,
  onDeviceSelected,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<WearOsDeviceData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<string>("Unknown");
  const [scanResults, setScanResults] = useState<
    {
      name: string;
      model: string;
      id: string;
      rssi: number | null;
      rawDevice: any;
      isLikelyWearable?: boolean;
      deviceType?: "watch" | "audio" | "tv" | "other";
    }[]
  >([]);
  const scanningRef = useRef(false);

  const snapPoints = useMemo(() => ["50%", "85%"], []);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          result["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS lida com isso via Info.plist e sistema
  };

  const loadRegisteredDevices = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Backend identifica o usuário pelo token; não passamos id do cliente.
      const data = await getRegisteredDevices();
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const scanTimeoutRef = useRef<any>(null);

  const stopScanning = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    bluetoothService.stopScan();
    setIsScanning(false);
    scanningRef.current = false;
  }, []);

  useEffect(() => {
    if (isVisible) {
      loadRegisteredDevices();
    }
    return () => {
      stopScanning();
    };
  }, [isVisible, loadRegisteredDevices, stopScanning]);

  const startScan = useCallback(async () => {
    const hasPermission = await bluetoothService.requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permissão Necessária",
        "O app precisa de permissões de Bluetooth e Localização para encontrar dispositivos."
      );
      return;
    }

    const state = await bluetoothService.getBluetoothState();
    setBluetoothState(state);

    if (state !== "PoweredOn") {
      Alert.alert(
        "Bluetooth Desligado",
        "Por favor, ligue o Bluetooth do seu celular para escanear."
      );
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    scanningRef.current = true;

    // Busca dispositivos já conectados ao sistema (útil para fones já pareados)
    bluetoothService
      .getConnectedDevices()
      .then((connectedDevices) => {
        connectedDevices.forEach((device) => {
          const name = device.name || device.localName || "Dispositivo Conectado";
          console.log(`[BT CONNECTED] Encontrado: ${name} | ID: ${device.id}`);

          // Detecção de tipo para os já conectados
          let type: "watch" | "audio" | "tv" | "other" = "other";
          const lowerName = name.toLowerCase();
          if (/watch|band|fit|heart|relogio/i.test(lowerName)) type = "watch";
          else if (/fone|ear|buds|audio|fon-|moto|phone/i.test(lowerName)) type = "audio";

          setScanResults((prev) => {
            if (prev.find((d) => d.id === device.id)) return prev;
            return [
              ...prev,
              {
                name: name,
                model: device.id,
                id: device.id,
                rssi: -35, // Sinal forte presumido para conectados
                rawDevice: device,
                deviceType: type,
                isLikelyWearable: type === "watch",
              },
            ];
          });
        });
      })
      .catch((err) => console.warn("[BT] Erro ao buscar conectados:", err));

    // Scan profissional: Tenta primeiro com filtro, se não achar em 5 segundos, abre o filtro
    bluetoothService.scanDevices((device) => {
      // DUMP COMPLETO EM LINHA ÚNICA
      console.log(
        `[BT DUMP] ID: ${device.id} | Name: ${device.name || "null"} | RSSI: ${device.rssi} | Services: ${JSON.stringify(device.serviceUUIDs)}`
      );

      const name = device.name || device.localName;

      // Filtro solicitado: Apenas exige que tenha NOME real
      if (!name || name.trim() === "" || name === "null") {
        return;
      }

      const rssi = device.rssi || -100;
      const displayName = name;

      // Detecção de Tipo
      let type: "watch" | "audio" | "tv" | "other" = "other";
      const lowerName = displayName.toLowerCase();

      const isWatch =
        /watch|band|fit|pulse|heart|relogio|mi\s|amazfit|galaxy|huawei|garmin/i.test(lowerName) ||
        device.serviceUUIDs?.includes(HEART_RATE_SERVICE_UUID);

      const isAudio = /fone|ear|buds|pods|audio|wh-|wf-|sound|speaker|headset|headphone|fon-/i.test(
        lowerName
      );

      const isTV = /tv|uhd|led|oled|smart|vizio|sharp|sony|roku|firestick/i.test(lowerName);

      if (isWatch) type = "watch";
      else if (isAudio) type = "audio";
      else if (isTV) type = "tv";

      console.log(`[BT SCAN] Encontrado: ${displayName} | Tipo: ${type} | RSSI: ${rssi}dBm`);

      const isLikelyOther =
        type === "tv" || (type === "other" && /Samsung|LG|Monitor|Soundbar/i.test(displayName));

      setScanResults((prev) => {
        const existing = prev.find((d) => d.id === device.id);
        if (existing) {
          return prev.map((d) =>
            d.id === device.id
              ? { ...d, rssi: device.rssi, name: displayName, deviceType: type }
              : d
          );
        }

        const newDevice = {
          name: displayName,
          model: device.id,
          id: device.id,
          rssi: device.rssi,
          rawDevice: device,
          deviceType: type,
          isLikelyWearable:
            type === "watch" || (!isLikelyOther && type !== "audio" && (device.rssi || -100) > -65),
        };

        return [...prev, newDevice].sort((a: any, b: any) => {
          // Prioriza wearables prováveis e depois por sinal
          if (a.isLikelyWearable && !b.isLikelyWearable) return -1;
          if (!a.isLikelyWearable && b.isLikelyWearable) return 1;
          return (b.rssi || -100) - (a.rssi || -100);
        });
      });
    }, false);

    scanTimeoutRef.current = setTimeout(() => {
      stopScanning();
    }, 20000);
  }, [stopScanning]);

  const handleRegister = async (device: any) => {
    if (!user?.id) {
      Alert.alert(
        "Sessão inválida",
        "Não foi possível identificar sua conta para vincular o dispositivo. Saia e entre novamente."
      );
      return;
    }
    setIsLoading(true);
    try {
      // 1. Conecta via Bluetooth ANTES de gravar.
      //    Nem todo relógio expõe Heart Rate via BLE (Galaxy/Apple/Amazfit usam
      //    protocolo próprio); nesses casos a sincronização real ocorre via
      //    Health Connect. Por isso NÃO bloqueamos o vínculo por falha de BLE,
      //    mas distinguimos claramente "falha de conexão" de "falha ao salvar".
      console.log(`[BT] Tentando conectar ao dispositivo: ${device.id}`);
      const connected = await bluetoothService.connectToDevice(device.rawDevice, (bpm) => {
        console.log(`[BT LIVE] Batimento recebido de ${device.name}: ${bpm} BPM`);
      });

      // 2. Registra via backend (service_role no servidor, ignora a RLS).
      //    Sem deviceType: o backend usa "Wear OS", que é o tipo que a listagem
      //    (GET /wearos/devices) filtra — assim o device aparece em "Salvos".
      await registerWearOsDevice({
        deviceName: device.name,
        deviceModel: device.id,
      });

      if (connected) {
        Alert.alert("Sucesso", `${device.name} vinculado e conectado com sucesso!`);
      } else {
        Alert.alert(
          "Vínculo salvo",
          `${device.name} foi salvo nos seus dispositivos, mas não conseguimos uma conexão Bluetooth ao vivo agora.\n\nSe for um smartwatch, os dados serão sincronizados pelo Health Connect. Mantenha o dispositivo ligado e próximo.`
        );
      }

      await loadRegisteredDevices();
      if (onDeviceSelected) {
        onDeviceSelected(device);
      }
      setScanResults([]);
    } catch (error: any) {
      // A conexão BLE já ocorreu antes deste ponto, então qualquer erro aqui é
      // do passo de SALVAR no servidor — mensagem específica evita o engano de
      // "erro ao conectar".
      const serverMessage = error?.response?.data?.error ?? error?.response?.data?.message;
      console.error("Error registering device:", error?.response?.data ?? error?.message ?? error);
      Alert.alert(
        "Falha ao salvar dispositivo",
        serverMessage
          ? `A conexão funcionou, mas o servidor recusou salvar o dispositivo: ${serverMessage}`
          : "A conexão funcionou, mas não conseguimos salvar o dispositivo na sua conta. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  if (!isVisible) return null;

  return (
    <BottomSheet
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#E2E8F0" }}
      backgroundStyle={{ borderRadius: 32 }}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Gerenciar conexões</Text>
          <Text style={styles.subtitle}>Sincronize seu relógio para dados em tempo real</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sessão: Meus Dispositivos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Smartphone size={18} color="#64748B" />
              <Text style={styles.sectionTitle}>Dispositivos Salvos</Text>
            </View>

            {isLoading && devices.length === 0 ? (
              <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />
            ) : devices.length > 0 ? (
              devices.map((device) => (
                <View key={device.id_disp} style={styles.deviceRow}>
                  <View style={styles.deviceIcon}>
                    <Watch size={20} color="#2563EB" />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.nome}</Text>
                    <Text style={styles.deviceStatus}>Sincronizado • Ativo</Text>
                  </View>
                  <CheckCircle2 size={20} color="#10B981" />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhum relógio cadastrado</Text>
              </View>
            )}
          </View>

          {/* Sessão: Busca Bluetooth */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bluetooth size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Procurar via Bluetooth</Text>
            </View>

            {isScanning && (
              <View style={styles.scanningBox}>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.scanningText}>Buscando relógios próximos...</Text>
                <TouchableOpacity onPress={stopScanning}>
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>Parar</Text>
                </TouchableOpacity>
              </View>
            )}

            {scanResults.length === 0 && isScanning && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Procurando...</Text>
              </View>
            )}

            {scanResults.map((result: any) => (
              <Animated.View entering={FadeInDown} key={result.id} style={styles.scanResultRow}>
                <View style={styles.deviceIcon}>
                  {result.deviceType === "watch" ? (
                    <Watch size={20} color="#2563EB" />
                  ) : result.deviceType === "audio" ? (
                    <Headphones size={20} color="#8B5CF6" />
                  ) : result.deviceType === "tv" ? (
                    <Monitor size={20} color="#F59E0B" />
                  ) : (
                    <Bluetooth size={20} color="#64748B" />
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    {result.deviceType === "watch" && (
                      <View style={styles.wearableBadge}>
                        <Text style={styles.wearableBadgeText}>Relógio</Text>
                      </View>
                    )}
                    {result.deviceType === "audio" && (
                      <View style={[styles.wearableBadge, { backgroundColor: "#F3E8FF" }]}>
                        <Text style={[styles.wearableBadgeText, { color: "#6B21A8" }]}>Áudio</Text>
                      </View>
                    )}
                    {result.deviceType === "tv" && (
                      <View style={[styles.wearableBadge, { backgroundColor: "#FEF3C7" }]}>
                        <Text style={[styles.wearableBadgeText, { color: "#92400E" }]}>TV</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.linkBtn} onPress={() => handleRegister(result)}>
                  <Plus size={16} color="#2563EB" />
                  <Text style={styles.linkBtnText}>Vincular</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {!isScanning && (
            <TouchableOpacity style={styles.scanBtn} onPress={startScan}>
              <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.scanBtnText}>Escanear dispositivos</Text>
            </TouchableOpacity>
          )}

          {/* Banner de Segurança */}
          <View style={styles.securityBanner}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.securityText}>
              Seus dados de saúde são criptografados e protegidos.
            </Text>
          </View>

          {/* Seção de Ajuda */}
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() =>
              Alert.alert(
                "Ajuda na Conexão",
                "1. Verifique se o dispositivo está ligado e em modo de pareamento.\n\n2. Se o dispositivo já estiver conectado ao Bluetooth do seu celular, DESCONECTE-O nas configurações do Android para que ele apareça aqui.\n\n3. Verifique se as permissões de localização estão ativas.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Abrir Bluetooth",
                    onPress: () => bluetoothService.openBluetoothSettings(),
                  },
                ]
              )
            }
          >
            <Text style={styles.helpButtonText}>Meu dispositivo não aparece?</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  deviceStatus: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  scanBtn: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  scanBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  scanningBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  scanningText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  scanResultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  resultModel: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  helpButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  helpButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  securityText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "600",
  },
  rssiText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "600",
  },
  wearableBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wearableBadgeText: {
    color: "#166534",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});

export default DeviceSelectorModal;
