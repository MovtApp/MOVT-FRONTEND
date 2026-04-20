import { BleManager, Device, Service, Characteristic } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";

const HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const HEART_RATE_CHARACTERISTIC_UUID = "00002a37-0000-1000-8000-00805f9b34fb";

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

  scanDevices(onDeviceFound: (device: Device) => void) {
    if (!this.manager || !this.isAvailable) return;
    this.manager.startDeviceScan([HEART_RATE_SERVICE_UUID], null, (error, device) => {
      if (error) {
        console.error("Erro no scan Bluetooth:", error);
        return;
      }
      if (device && device.name) {
        onDeviceFound(device);
      }
    });
  }

  stopScan() {
    if (!this.manager || !this.isAvailable) return;
    this.manager.stopDeviceScan();
  }

  async connectToDevice(device: Device, onHeartRateUpdate: (bpm: number) => void) {
    if (!this.manager || !this.isAvailable) return false;
    try {
      this.stopScan();
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connectedDevice;

      connectedDevice.monitorCharacteristicForService(
        HEART_RATE_SERVICE_UUID,
        HEART_RATE_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error("Erro ao monitorar batimentos:", error);
            return;
          }
          if (characteristic?.value) {
            const bpm = this.decodeHeartRate(characteristic.value);
            onHeartRateUpdate(bpm);
          }
        }
      );

      return true;
    } catch (error) {
      console.error("Falha ao conectar dispositivo Bluetooth:", error);
      return false;
    }
  }

  private decodeHeartRate(base64Value: string): number {
    // Decodifica o valor Base64 para bytes
    const buffer = Buffer.from(base64Value, "base64");
    const flags = buffer[0];

    // De acordo com a especificação Bluetooth GATT:
    // Se o bit 0 da flag for 0, o BPM é 1 byte (UINT8).
    // Se o bit 0 da flag for 1, o BPM é 2 bytes (UINT16).
    const isUint16 = (flags & 0x01) !== 0;

    if (isUint16) {
      return buffer.readUInt16LE(1);
    } else {
      return buffer[1];
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
