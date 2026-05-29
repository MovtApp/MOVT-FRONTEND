import { BleManager, Device, Service, Characteristic } from "react-native-ble-plx";
import { Platform, PermissionsAndroid, Linking } from "react-native";
import { Buffer } from "buffer";

export const HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
export const HEART_RATE_CHARACTERISTIC_UUID = "00002a37-0000-1000-8000-00805f9b34fb";

class BluetoothService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private isAvailable: boolean = false;

  constructor() {
    try {
      this.manager = new BleManager();
      this.isAvailable = true;
    } catch (error) {
      console.warn("Bluetooth BLE: Módulo nativo não detectado (Expo Go ou Emulador).");
      this.isAvailable = false;
    }
  }

  getIsEnabled() {
    return this.isAvailable;
  }

  async requestPermissions() {
    if (Platform.OS === "android") {
      const apiLevel = Platform.Version as number;
      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Permissão de Localização",
            message: "O app precisa de localização para encontrar dispositivos Bluetooth.",
            buttonNeutral: "Depois",
            buttonNegative: "Cancelar",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true; // iOS handles via Info.plist automatically with ble-plx
  }

  async getBluetoothState() {
    if (!this.manager || !this.isAvailable) return "PoweredOff";
    return await this.manager.state();
  }

  async getConnectedDevices() {
    if (!this.manager || !this.isAvailable) return [];
    try {
      // Busca dispositivos já conectados que exponham serviços comuns
      // Incluindo Generic Access e Generic Attribute para maior compatibilidade
      const commonServices = [
        HEART_RATE_SERVICE_UUID,
        "0000180f-0000-1000-8000-00805f9b34fb", // Battery Service
        "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
        "00001800-0000-1000-8000-00805f9b34fb", // Generic Access
        "00001801-0000-1000-8000-00805f9b34fb", // Generic Attribute
      ];
      return await this.manager.connectedDevices(commonServices);
    } catch (e) {
      return [];
    }
  }

  scanDevices(onDeviceFound: (device: Device) => void, filterServices: boolean = true) {
    if (!this.manager || !this.isAvailable) {
      console.warn("Bluetooth BLE: Gerenciador não disponível.");
      return;
    }

    // Se filterServices for true, buscamos apenas dispositivos que anunciam o serviço de Heart Rate
    // Caso contrário, buscamos todos (útil para dispositivos que não anunciam serviços antes de parear)
    const services = filterServices ? [HEART_RATE_SERVICE_UUID] : null;

    console.log(
      `Iniciando scan Bluetooth (Filtro: ${filterServices ? "Heart Rate" : "Nenhum"})...`
    );

    this.manager.startDeviceScan(services, { allowDuplicates: false }, (error, device) => {
      if (error) {
        // Se o Bluetooth estiver desligado, o erro terá o código 102
        console.error("Erro no scan Bluetooth:", error);
        return;
      }

      if (device) {
        onDeviceFound(device);
      }
    });
  }

  stopScan() {
    if (!this.manager || !this.isAvailable) return;
    console.log("Parando scan Bluetooth.");
    this.manager.stopDeviceScan();
  }

  openBluetoothSettings() {
    if (Platform.OS === "android") {
      Linking.sendIntent("android.settings.BLUETOOTH_SETTINGS").catch(() => {
        Linking.openSettings(); // Fallback se o intent falhar
      });
    } else {
      Linking.openURL("App-Prefs:root=Bluetooth"); // iOS shortcut
    }
  }

  async connectToDevice(device: Device, onHeartRateUpdate: (bpm: number) => void) {
    if (!this.manager || !this.isAvailable) return false;
    try {
      this.stopScan();
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connectedDevice;

      // Nem todo relógio expõe o serviço padrão de Heart Rate (0x180D): Galaxy,
      // Apple, Amazfit etc. usam protocolo próprio. Só monitoramos batimentos se
      // o serviço existir de fato — caso contrário a conexão ainda é válida (a
      // sincronia de saúde ocorre via Health Connect) e evitamos um erro falso.
      const services = await connectedDevice.services();
      const hasHeartRate = services.some(
        (s) => s.uuid.toLowerCase() === HEART_RATE_SERVICE_UUID.toLowerCase()
      );

      if (hasHeartRate) {
        connectedDevice.monitorCharacteristicForService(
          HEART_RATE_SERVICE_UUID,
          HEART_RATE_CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.warn("[Bluetooth] Monitor de batimentos encerrado:", error.message);
              return;
            }
            if (characteristic?.value) {
              try {
                const bpm = this.decodeHeartRate(characteristic.value);
                if (bpm > 0) onHeartRateUpdate(bpm);
              } catch (e) {
                console.warn("[Bluetooth] Falha ao decodificar pacote:", e);
              }
            }
          }
        );
      } else {
        console.log(
          "[Bluetooth] Conectado, mas sem serviço de Heart Rate padrão (0x180D). " +
            "Sem BPM ao vivo via BLE — dados virão pelo Health Connect."
        );
      }

      return true;
    } catch (error) {
      console.error("Falha ao conectar dispositivo Bluetooth:", error);
      return false;
    }
  }

  private decodeHeartRate(base64Value: string): number {
    try {
      const buffer = Buffer.from(base64Value, "base64");
      if (buffer.length < 2) return 0;

      const flags = buffer[0];
      const isUint16 = (flags & 0x01) !== 0;

      if (isUint16) {
        if (buffer.length < 3) return 0;
        return buffer.readUInt16LE(1);
      } else {
        return buffer[1];
      }
    } catch (e) {
      return 0;
    }
  }

  async disconnect() {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }
}

export const bluetoothService = new BluetoothService();
