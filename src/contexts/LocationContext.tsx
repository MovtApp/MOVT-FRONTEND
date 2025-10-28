import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

type Coordinates = { latitude: number; longitude: number };

interface LocationContextValue {
  location: Coordinates | null;
  permissionStatus: Location.PermissionStatus | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined,
);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    initializeLocation();
    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, []);

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
            // Abre configurações para o usuário habilitar manualmente
            try {
              await Linking.openSettings();
            } catch {}
          }
        }
      }

      if (status !== "granted") return;

      // Tenta última localização conhecida para ser instantâneo
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords?.latitude && last?.coords?.longitude) {
        setLocation({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        });
      }

      // Inicia watcher para manter atualizado em background enquanto app está ativo
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          if (loc?.coords?.latitude && loc?.coords?.longitude) {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        },
      );
    } catch {
      // Erro não é usado, removemos a variável
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
    <LocationContext.Provider
      value={{ location, permissionStatus, refreshLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx)
    throw new Error(
      "useLocationContext deve ser usado dentro de LocationProvider",
    );
  return ctx;
}
