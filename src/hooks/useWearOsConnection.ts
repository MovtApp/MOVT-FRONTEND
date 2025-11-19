import { useState, useEffect, useCallback } from "react";
import { monitorWearOsDeviceConnection, WearOsDeviceData } from "../services/wearOsHealthService";

interface UseWearOsConnectionResult {
  isConnected: boolean;
  connectedDevice: WearOsDeviceData | null;
  isLoading: boolean;
}

/**
 * Hook para monitorar a conexão do dispositivo Wear OS
 * @param userId ID do usuário
 * @returns Objeto com status de conexão, dispositivo conectado e loading
 */
export const useWearOsConnection = (userId: number | null): UseWearOsConnectionResult => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<WearOsDeviceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Iniciar monitoramento de dispositivo
    const unmonitor = monitorWearOsDeviceConnection(
      userId,
      (device: WearOsDeviceData) => {
        setIsConnected(true);
        setConnectedDevice(device);
        setIsLoading(false);
      },
      () => {
        setIsConnected(false);
        setConnectedDevice(null);
        setIsLoading(false);
      }
    );

    return () => {
      unmonitor();
    };
  }, [userId]);

  return {
    isConnected,
    connectedDevice,
    isLoading,
  };
};

/**
 * Hook para obter callbacks de conexão/desconexão do Wear OS
 */
export const useWearOsConnectionCallbacks = () => {
  const handleDeviceConnected = useCallback((device: WearOsDeviceData) => {
    console.log("✅ Dispositivo Wear OS conectado:", device.nome);
  }, []);

  const handleDeviceDisconnected = useCallback(() => {
    console.log("❌ Dispositivo Wear OS desconectado");
  }, []);

  return {
    handleDeviceConnected,
    handleDeviceDisconnected,
  };
};
