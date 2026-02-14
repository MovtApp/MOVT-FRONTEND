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
} from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import {
  Watch,
  Bluetooth,
  CheckCircle2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";
import {
  getAllWearOsDevices,
  registerWearOsDevice,
  WearOsDeviceData,
} from "../../services/wearOsHealthService";
import { useAuth } from "../../contexts/AuthContext";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BleManager, Device } from "react-native-ble-plx";

interface DeviceSelectorModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// Inicializa o BleManager com segurança para evitar erros no Expo Go
let bleManager: BleManager | null = null;
try {
  bleManager = new BleManager();
} catch (error) {
  console.log("Bluetooth nativo não disponível (Expo Go ou Emulador)");
}

const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({ isVisible, onClose }) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<WearOsDeviceData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResults, setScanResults] = useState<{ name: string; model: string; id: string }[]>([]);
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
      const data = await getAllWearOsDevices(parseInt(user.id, 10));
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanning = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (bleManager) bleManager.stopDeviceScan();
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
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Permissão de Bluetooth negada.");
      return;
    }

    // Limpa qualquer scan anterior
    stopScanning();

    setIsScanning(true);
    setScanResults([]);
    scanningRef.current = true;

    if (!bleManager) {
      console.warn("Hardware Bluetooth não detectado. Usando simulação.");
      // Simulação básica (relógio 1)
      setTimeout(() => {
        if (scanningRef.current) {
          setScanResults((prev) => [
            ...prev,
            {
              name: "Relógio de Teste (Simulador)",
              model: "MOVT-DEMO-01",
              id: "mock-1",
            },
          ]);
        }
      }, 1000);
    } else {
      bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          console.error("Erro no scan:", error);
          stopScanning();
          return;
        }

        if (device && (device.name || device.localName)) {
          const deviceName = device.name || device.localName || "Dispositivo desconhecido";

          setScanResults((prev) => {
            if (prev.find((d) => d.id === device.id)) return prev;
            return [
              ...prev,
              {
                name: deviceName,
                model: device.id,
                id: device.id,
              },
            ];
          });
        }
      });
    }

    // Simulador de Fallback: Galaxy Watch 6
    setTimeout(() => {
      if (scanningRef.current) {
        setScanResults((prev) => {
          const mockId = "dev-mock-galaxy-6";
          if (prev.find((d) => d.id === mockId)) return prev;
          return [
            ...prev,
            {
              name: "Galaxy Watch 6 (Simulado)",
              model: "SM-R930",
              id: mockId,
            },
          ];
        });
      }
    }, 1500);

    // Timeout padrão de 20 segundos para parar automaticamente
    scanTimeoutRef.current = setTimeout(() => {
      console.log("Tempo de busca esgotado (timeout padrão)");
      stopScanning();
    }, 20000);
  }, [stopScanning]);

  const handleRegister = async (device: { name: string; model: string }) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      await registerWearOsDevice(parseInt(user.id, 10), {
        deviceName: device.name,
        deviceModel: device.model,
        deviceType: "Wear OS",
      });
      await loadRegisteredDevices();
      setScanResults([]);
    } catch (error) {
      console.error("Error registering device:", error);
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

            {scanResults.map((result) => (
              <Animated.View entering={FadeInDown} key={result.id} style={styles.scanResultRow}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{result.name}</Text>
                  <Text style={styles.resultModel}>{result.model}</Text>
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
    marginTop: 2,
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
});

export default DeviceSelectorModal;
