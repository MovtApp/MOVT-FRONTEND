import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import { NativeHealthManager } from "../services/nativeHealthManager";

type Coordinates = { latitude: number; longitude: number };

interface LocationContextValue {
  location: Coordinates | null;
  permissionStatus: Location.PermissionStatus | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    initializeLocation();
    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, []);

  /**
   * Aguarda o app voltar ao foreground após abrir um diálogo externo (como o HC).
   * Isso evita o crash de UninitializedPropertyAccessException causado por transições
   * de Activity enquanto o delegate nativo do HC ainda não está pronto.
   */
  const waitForForeground = (): Promise<void> => {
    return new Promise((resolve) => {
      // Se já está em foreground, resolve imediatamente com um pequeno buffer
      if (AppState.currentState === "active") {
        setTimeout(resolve, 500);
        return;
      }
      // Caso contrário, espera o app voltar ao foco
      const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
        if (state === "active") {
          sub.remove();
          // Buffer extra após o retorno para garantir estabilidade da Activity
          setTimeout(resolve, 1000);
        }
      });
      // Timeout de segurança de 10s para não travar o app
      setTimeout(() => {
        sub.remove();
        resolve();
      }, 10000);
    });
  };

  const initializeLocation = async () => {
    try {
      // Verifica permissão atual primeiro
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;
      setPermissionStatus(status);

      // Solicita apenas se necessário
      if (status !== "granted") {
        if (current.canAskAgain) {
          const req = await Location.requestForegroundPermissionsAsync();
          status = req.status;
          setPermissionStatus(status);
        } else {
          // Usuário marcou "não perguntar novamente"
          if (Platform.OS === "android" || Platform.OS === "ios") {
            try {
              await Linking.openSettings();
            } catch {}
          }
        }
      }

      // Aguarda o app voltar ao foreground após o diálogo de localização fechar
      // e a Activity estar 100% estabilizada.
      await waitForForeground();

      // REMOVIDO: NativeHealthManager.authorize() automático.
      // As permissões de saúde devem ser solicitadas separadamente
      // para evitar conflitos com diálogos de localização e crashes no boot.

      if (status !== "granted") return;

      // Tenta última localização conhecida para ser instantâneo
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords?.latitude && last?.coords?.longitude) {
        setLocation({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        });
      }

      // Inicia watcher para manter atualizado em tempo real
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          if (loc?.coords?.latitude && loc?.coords?.longitude) {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      );
    } catch {
      // noop
    }
  };

  const refreshLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (loc?.coords?.latitude && loc?.coords?.longitude) {
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch {
      // Erro não é usado, removemos a variável
      // noop
    }
  };

  return (
    <LocationContext.Provider value={{ location, permissionStatus, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext deve ser usado dentro de LocationProvider");
  return ctx;
}
