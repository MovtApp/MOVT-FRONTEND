import { supabase } from "./supabaseClient";

/**
 * Tipos para dados de saúde do Wear OS
 */
export interface WearOsHealthData {
  id_wh: number;
  id_disp: number;
  tipo_dado: string;
  valor: number;
  unidade: string;
  createdAt: string;
  updatedAt: string;
}

export interface WearOsDeviceData {
  id_disp: number;
  id_us: number;
  nome: string;
  tipo: string;
  status: string;
  modelo: string;
  versao_wearOS?: string;
  token_acesso?: string;
}

/**
 * Busca os dados de saúde mais recentes do dispositivo Wear OS do usuário
 * @param userId ID do usuário
 * @returns Promise com os dados de saúde mais recentes
 */
export const getLatestWearOsHealthData = async (
  userId: number
): Promise<{
  heartRate: number | null;
  pressure: number | null;
  oxygen: number | null;
} | null> => {
  try {
    // Buscar dispositivos Wear OS do usuário
    const { data: devices, error: devicesError } = await supabase
      .from("dispositivos")
      .select("id_disp, nome, modelo, status")
      .eq("id_us", userId)
      .eq("tipo", "Wear OS") // Filtrar apenas dispositivos Wear OS
      .eq("status", "ativo");

    if (devicesError) {
      console.error("Erro ao buscar dispositivos Wear OS:", devicesError);
      throw new Error(`Erro ao buscar dispositivos: ${devicesError.message}`);
    }

    if (!devices || devices.length === 0) {
      return null;
    }

    const deviceId = devices[0].id_disp;

    // Buscar dados mais recentes de cada tipo na tabela healthkit
    const [heartRateData, pressureData, oxygenData] = await Promise.all([
      // Frequência cardíaca
      supabase
        .from("healthkit")
        .select("*")
        .eq("id_disp", deviceId)
        .eq("tipo_dado", "heart_rate")
        .order("createdat", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Pressão arterial
      supabase
        .from("healthkit")
        .select("*")
        .eq("id_disp", deviceId)
        .eq("tipo_dado", "blood_pressure")
        .order("createdat", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Oxigênio (SpO2)
      supabase
        .from("healthkit")
        .select("*")
        .eq("id_disp", deviceId)
        .eq("tipo_dado", "oxygen_saturation")
        .order("createdat", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Converter o valor para número, pois a coluna é character varying
    return {
      heartRate: heartRateData.data?.valor ? Number(heartRateData.data.valor) : null,
      pressure: pressureData.data?.valor ? Number(pressureData.data.valor) : null,
      oxygen: oxygenData.data?.valor ? Number(oxygenData.data.valor) : null,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de saúde do Wear OS:", error);
    throw error; // Lançar o erro para que o componente possa tratá-lo
  }
};

/**
 * Inscreve-se para receber atualizações em tempo real dos dados de saúde do Wear OS
 * @param userId ID do usuário
 * @param callback Função callback chamada quando há atualizações
 * @returns Função para cancelar a inscrição
 */
export const subscribeToWearOsHealthRealtime = (
  userId: number,
  callback: (data: {
    heartRate: number | null;
    pressure: number | null;
    oxygen: number | null;
  }) => void
): (() => void) => {
  let subscription: ReturnType<typeof supabase.channel> | null = null;

  // Buscar dispositivo Wear OS do usuário primeiro
  supabase
    .from("dispositivos")
    .select("id_disp")
    .eq("id_us", userId)
    .eq("tipo", "Wear OS") // Filtrar apenas dispositivos Wear OS
    .eq("status", "ativo")
    .limit(1)
    .then(({ data: devices, error }) => {
      if (error || !devices || devices.length === 0) {
        return;
      }

      const deviceId = devices[0].id_disp;

      // Inscrever-se em atualizações da tabela healthkit
      subscription = supabase
        .channel(`wearos-health-${deviceId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "healthkit",
            filter: `id_disp=eq.${deviceId}`,
          },
          async () => {
            // Quando há atualização, buscar os dados mais recentes
            const latestData = await getLatestWearOsHealthData(userId);
            if (latestData) {
              callback(latestData);
            }
          }
        )
        .subscribe();
    });

  // Retornar função de limpeza
  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
};

/**
 * Busca dados de saúde do Wear OS em tempo real usando polling (alternativa ao realtime)
 * @param userId ID do usuário
 * @param interval Intervalo em milissegundos (padrão: 5000ms = 5 segundos)
 * @param callback Função callback chamada quando há atualizações
 * @returns Função para cancelar o polling
 */
export const pollWearOsHealthData = (
  userId: number,
  interval: number = 5000,
  callback: (data: {
    heartRate: number | null;
    pressure: number | null;
    oxygen: number | null;
  }) => void
): (() => void) => {
  let isPolling = true;

  const poll = async () => {
    if (!isPolling) return;

    try {
      const data = await getLatestWearOsHealthData(userId);
      if (data) {
        callback(data);
      }
    } catch (error) {
      console.error("Erro durante o poll de dados de saúde:", error);
      // Não parar o polling por erro, apenas continuar tentando
    }

    if (isPolling) {
      setTimeout(poll, interval);
    }
  };

  // Iniciar polling imediatamente
  poll();

  // Retornar função para cancelar
  return () => {
    isPolling = false;
  };
};

/**
 * Verifica se o usuário tem um dispositivo Wear OS registrado
 * @param userId ID do usuário
 * @returns Promise com informações do dispositivo ou null se não encontrado
 */
export const checkWearOsDeviceRegistered = async (
  userId: number
): Promise<WearOsDeviceData | null> => {
  try {
    const { data: devices, error } = await supabase
      .from("dispositivos")
      .select("*")
      .eq("id_us", userId)
      .eq("tipo", "Wear OS")
      .eq("status", "ativo")
      .order("createdAt", { ascending: false }) // Pegar o dispositivo mais recentemente registrado
      .limit(1);

    if (error) {
      console.error("Erro ao verificar dispositivo Wear OS:", error);
      return null;
    }

    return devices && devices.length > 0 ? (devices[0] as WearOsDeviceData) : null;
  } catch (error) {
    console.error("Erro ao verificar dispositivo Wear OS:", error);
    return null;
  }
};

/**
 * Obtém todos os dispositivos Wear OS registrados para o usuário
 * @param userId ID do usuário
 * @returns Promise com array de dispositivos Wear OS
 */
export const getAllWearOsDevices = async (userId: number): Promise<WearOsDeviceData[]> => {
  try {
    const { data: devices, error } = await supabase
      .from("dispositivos")
      .select("*")
      .eq("id_us", userId)
      .eq("tipo", "Wear OS")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Erro ao buscar dispositivos Wear OS:", error);
      return [];
    }

    return devices as WearOsDeviceData[];
  } catch (error) {
    console.error("Erro ao buscar dispositivos Wear OS:", error);
    return [];
  }
};

/**
 * Obtém dados de saúde combinados de todos os dispositivos Wear OS do usuário
 * @param userId ID do usuário
 * @returns Promise com os dados de saúde combinados
 */
export const getLatestWearOsHealthDataFromAllDevices = async (
  userId: number
): Promise<{
  heartRate: number | null;
  pressure: number | null;
  oxygen: number | null;
  deviceData: {
    deviceId: number;
    deviceName: string;
    heartRate: number | null;
    pressure: number | null;
    oxygen: number | null;
    lastUpdate: string | null;
  }[];
} | null> => {
  try {
    // Buscar todos os dispositivos Wear OS ativos do usuário
    const devices = await getAllWearOsDevices(userId);

    if (!devices || devices.length === 0) {
      return null;
    }

    const deviceIds = devices.map((device) => device.id_disp);

    // Buscar dados mais recentes de cada tipo para todos os dispositivos na tabela healthkit
    const [heartRateData, pressureData, oxygenData] = await Promise.all([
      // Frequência cardíaca
      supabase
        .from("healthkit")
        .select("*")
        .in("id_disp", deviceIds)
        .eq("tipo_dado", "heart_rate")
        .order("createdat", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Pressão arterial
      supabase
        .from("healthkit")
        .select("*")
        .in("id_disp", deviceIds)
        .eq("tipo_dado", "blood_pressure")
        .order("createdat", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Oxigênio (SpO2)
      supabase
        .from("healthkit")
        .select("*")
        .in("id_disp", deviceIds)
        .eq("tipo_dado", "oxygen_saturation")
        .order("createdat", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Obter dados mais recentes por dispositivo
    const deviceData = await Promise.all(
      devices.map(async (device) => {
        const [deviceHeartRate, devicePressure, deviceOxygen] = await Promise.all([
          supabase
            .from("healthkit")
            .select("valor, createdat")
            .eq("id_disp", device.id_disp)
            .eq("tipo_dado", "heart_rate")
            .order("createdat", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("healthkit")
            .select("valor, createdat")
            .eq("id_disp", device.id_disp)
            .eq("tipo_dado", "blood_pressure")
            .order("createdat", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("healthkit")
            .select("valor, createdat")
            .eq("id_disp", device.id_disp)
            .eq("tipo_dado", "oxygen_saturation")
            .order("createdat", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        return {
          deviceId: device.id_disp,
          deviceName: device.nome,
          heartRate: deviceHeartRate.data?.valor ? Number(deviceHeartRate.data.valor) : null,
          pressure: devicePressure.data?.valor ? Number(devicePressure.data.valor) : null,
          oxygen: deviceOxygen.data?.valor ? Number(deviceOxygen.data.valor) : null,
          lastUpdate:
            deviceHeartRate.data?.createdat ||
            devicePressure.data?.createdat ||
            deviceOxygen.data?.createdat ||
            null,
        };
      })
    );

    return {
      heartRate: heartRateData.data?.valor ? Number(heartRateData.data.valor) : null,
      pressure: pressureData.data?.valor ? Number(pressureData.data.valor) : null,
      oxygen: oxygenData.data?.valor ? Number(oxygenData.data.valor) : null,
      deviceData: deviceData,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de saúde de todos os dispositivos Wear OS:", error);
    return null;
  }
};

/**
 * Monitora a conexão do dispositivo Wear OS em tempo real
 * @param userId ID do usuário
 * @param onDeviceConnected Callback chamado quando um dispositivo é conectado
 * @param onDeviceDisconnected Callback chamado quando um dispositivo é desconectado
 * @returns Função para parar de monitorar
 */
export const monitorWearOsDeviceConnection = (
  userId: number,
  onDeviceConnected: (device: WearOsDeviceData) => void,
  onDeviceDisconnected: () => void
): (() => void) => {
  let subscription: ReturnType<typeof supabase.channel> | null = null;
  let isMonitoring = true;
  let lastDeviceStatus: boolean | null = null;

  const checkDeviceStatus = async () => {
    if (!isMonitoring) return;

    try {
      const device = await checkWearOsDeviceRegistered(userId);

      if (device && !lastDeviceStatus) {
        // Dispositivo conectado
        lastDeviceStatus = true;
        onDeviceConnected(device);
      } else if (!device && lastDeviceStatus) {
        // Dispositivo desconectado
        lastDeviceStatus = false;
        onDeviceDisconnected();
      }

      if (isMonitoring) {
        setTimeout(checkDeviceStatus, 5000); // Verificar a cada 5 segundos
      }
    } catch (error) {
      console.error("Erro ao monitorar dispositivo Wear OS:", error);
      if (isMonitoring) {
        setTimeout(checkDeviceStatus, 5000);
      }
    }
  };

  // Iniciar monitoramento
  checkDeviceStatus();

  // Também configurar listener em tempo real
  subscription = supabase
    .channel(`wearos-devices-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "dispositivos",
        filter: `id_us=eq.${userId}`,
      },
      async () => {
        // Quando há mudança na tabela dispositivos, verificar status
        await checkDeviceStatus();
      }
    )
    .subscribe();

  return () => {
    isMonitoring = false;
    if (subscription) {
      subscription.unsubscribe();
    }
  };
};

/**
 * Registra automaticamente um dispositivo Wear OS para o usuário
 * @param userId ID do usuário
 * @param deviceInfo Informações do dispositivo para registro
 * @returns Promise com informações do dispositivo registrado
 */
export const registerWearOsDevice = async (
  userId: number,
  deviceInfo: {
    deviceName: string;
    deviceModel: string;
    deviceType?: string;
    deviceVersion?: string;
    tokenAcesso?: string;
  }
): Promise<WearOsDeviceData | null> => {
  try {
    // Primeiro verificar se já existe um dispositivo com o mesmo modelo
    const existingDevice = await checkWearOsDeviceRegistered(userId);

    if (existingDevice) {
      console.log("Dispositivo já registrado para o usuário:", existingDevice);
      return existingDevice;
    }

    // Se não existir, registrar um novo dispositivo
    const { data: newDevice, error } = await supabase
      .from("dispositivos")
      .insert([
        {
          id_us: userId,
          nome: deviceInfo.deviceName,
          tipo: deviceInfo.deviceType || "Wear OS",
          status: "ativo",
          modelo: deviceInfo.deviceModel,
          versao_watchos: deviceInfo.deviceVersion, // Corrigindo o nome da coluna
          token_acesso: deviceInfo.tokenAcesso,
          createdat: new Date().toISOString(), // Corrigindo o nome da coluna
          updatedat: new Date().toISOString(), // Corrigindo o nome da coluna
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao registrar dispositivo Wear OS:", error);
      throw error;
    }

    console.log("Novo dispositivo Wear OS registrado:", newDevice);
    return newDevice as WearOsDeviceData;
  } catch (error) {
    console.error("Erro ao registrar dispositivo Wear OS:", error);
    throw error;
  }
};
