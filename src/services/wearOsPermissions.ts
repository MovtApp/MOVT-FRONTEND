import { Platform, Alert, PermissionsAndroid } from "react-native";
import { registerWearOsDevice, checkWearOsDeviceRegistered } from "./wearOsHealthService";

/**
 * Interface para resultado de autorização
 */
export interface WearOsAuthorizationResult {
  success: boolean;
  message: string;
  deviceInfo?: {
    id_disp: number;
    id_us: number;
    nome: string;
    tipo: string;
    status: string;
    modelo: string;
  };
}

/**
 * Permissões necessárias para coletar dados de saúde do Wear OS
 */
const WEAR_OS_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
  PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
];

/**
 * Pede autorização para acessar os sensores e atividades do dispositivo Wear OS
 * @param userId ID do usuário para registro no banco
 * @param onProgress Callback para feedback do progresso
 * @returns Promise com resultado da autorização
 */
export const requestWearOsAuthorization = async (
  userId: number,
  onProgress?: (message: string) => void
): Promise<WearOsAuthorizationResult> => {
  try {
    // Verificar plataforma
    if (Platform.OS !== "android") {
      return {
        success: false,
        message: "Wear OS é disponível apenas em Android",
      };
    }

    onProgress?.("Verificando dispositivo Wear OS...");

    // Verificar se já existe dispositivo registrado
    const existingDevice = await checkWearOsDeviceRegistered(userId);
    if (existingDevice && existingDevice.status === "ativo") {
      return {
        success: true,
        message: "Dispositivo Wear OS já autorizado",
        deviceInfo: existingDevice,
      };
    }

    onProgress?.("Solicitando permissões de sensores...");

    // Solicitar permissões de sensores
    const permissionResults = await PermissionsAndroid.requestMultiple(
      WEAR_OS_PERMISSIONS
    );

    const allPermissionsGranted = Object.values(permissionResults).every(
      (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allPermissionsGranted) {
      const deniedPermissions = Object.entries(permissionResults)
        .filter(([_, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
        .map(([perm]) => perm)
        .join(", ");

      return {
        success: false,
        message: `Permissões negadas: ${deniedPermissions}`,
      };
    }

    onProgress?.("Registrando dispositivo no banco de dados...");

    // Registrar o dispositivo Wear OS no banco
    const deviceInfo = await registerWearOsDevice(userId, {
      deviceName: `Wear OS ${Platform.Version}`,
      deviceModel: "Android Wear",
      deviceType: "Wear OS",
      deviceVersion: String(Platform.Version),
    });

    if (!deviceInfo) {
      return {
        success: false,
        message: "Falha ao registrar dispositivo no banco de dados",
      };
    }

    return {
      success: true,
      message: "Dispositivo Wear OS autorizado com sucesso",
      deviceInfo,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao solicitar autorização Wear OS:", error);

    return {
      success: false,
      message: `Erro ao autorizar Wear OS: ${errorMessage}`,
    };
  }
};

/**
 * Solicita autorização do Wear OS com UI (AlertDialog)
 * Ideal para usar na primeira vez que o app é aberto
 * @param userId ID do usuário
 * @returns Promise com resultado da autorização
 */
export const requestWearOsAuthorizationWithUI = async (
  userId: number
): Promise<WearOsAuthorizationResult> => {
  return new Promise((resolve) => {
    Alert.alert(
      "Autorizar Wear OS",
      "Para sincronizar dados de saúde com seu dispositivo Wear OS, precisamos de permissão para acessar os sensores.\n\nDeseja continuar?",
      [
        {
          text: "Cancelar",
          onPress: () =>
            resolve({
              success: false,
              message: "Autorização cancelada pelo usuário",
            }),
          style: "cancel",
        },
        {
          text: "Autorizar",
          onPress: async () => {
            const result = await requestWearOsAuthorization(userId, (msg) => {
              console.log("Progresso:", msg);
            });
            resolve(result);
          },
          style: "default",
        },
      ]
    );
  });
};

/**
 * Mostra alertas de status baseado no resultado da autorização
 * @param result Resultado da autorização
 */
export const showWearOsAuthorizationAlert = (
  result: WearOsAuthorizationResult
): void => {
  const title = result.success ? "Sucesso" : "Erro";
  Alert.alert(title, result.message);
};

/**
 * Função completa para solicitar autorização com UI e feedback
 * Recomendado para usar na primeira abertura do app ou em telas de configuração
 * @param userId ID do usuário
 * @returns Promise com resultado da autorização
 */
export const initializeWearOsAuthorization = async (
  userId: number
): Promise<WearOsAuthorizationResult> => {
  return new Promise((resolve) => {
    Alert.alert(
      "Configurar Wear OS",
      "Detectamos que você tem um dispositivo Wear OS. Gostaria de sincronizar seus dados de saúde?",
      [
        {
          text: "Agora não",
          onPress: () =>
            resolve({
              success: false,
              message: "Configuração adiada",
            }),
          style: "cancel",
        },
        {
          text: "Configurar agora",
          onPress: async () => {
            Alert.alert(
              "Aguarde",
              "Solicitando permissões...",
              [{ text: "OK", onPress: () => {} }],
              { cancelable: false }
            );

            const result = await requestWearOsAuthorization(userId, (msg) => {
              console.log(msg);
            });

            if (result.success) {
              Alert.alert(
                "Sucesso",
                `Dispositivo ${result.deviceInfo?.nome} autorizado com sucesso!\n\nSeus dados de saúde serão sincronizados automaticamente.`,
                [
                  {
                    text: "OK",
                    onPress: () => resolve(result),
                  },
                ]
              );
            } else {
              Alert.alert("Erro", result.message, [
                {
                  text: "Tentar novamente",
                  onPress: async () => {
                    const retryResult =
                      await initializeWearOsAuthorization(userId);
                    resolve(retryResult);
                  },
                },
                {
                  text: "Cancelar",
                  onPress: () => resolve(result),
                  style: "cancel",
                },
              ]);
            }
          },
          style: "default",
        },
      ]
    );
  });
};

/**
 * Verifica se as permissões do Wear OS estão concedidas
 * @returns Promise<boolean> true se todas as permissões estão concedidas
 */
export const checkWearOsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return false;
  }

  try {
    const results = await PermissionsAndroid.checkMultiple(WEAR_OS_PERMISSIONS);
    return Object.values(results).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error("Erro ao verificar permissões Wear OS:", error);
    return false;
  }
};

/**
 * Abre as configurações do app para o usuário ativar permissões manualmente
 */
export const openWearOsSettingsAlert = (): void => {
  Alert.alert(
    "Permissões necessárias",
    "Para continuar, você precisa ativar as permissões de sensores nas configurações do app.",
    [
      {
        text: "Abrir configurações",
        onPress: () => {
          // Nota: Para abrir as configurações, você pode usar react-native-app-settings
          // ou solicitar permissão novamente via código nativo
          console.log("Abrindo configurações do app...");
        },
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]
  );
};
