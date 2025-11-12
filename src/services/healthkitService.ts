import { supabase } from "./supabaseClient";

/**
 * Tipos para dados de healthkit
 */
export interface HealthKitData {
  id_hk: number;
  id_disp: number;
  tipo_dado: string;
  valor: number;
  unidade: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceData {
  id_disp: number;
  id_us: number;
  nome: string;
  tipo: string;
  status: string;
  modelo: string;
  versao_watchOS?: string;
  token_acesso?: string;
}

/**
 * Busca os dados de healthkit mais recentes do usuário
 * @param userId ID do usuário
 * @returns Promise com os dados de healthkit mais recentes
 */
export const getLatestHealthKitData = async (
  userId: number
): Promise<{
  heartRate: number | null;
  pressure: number | null;
  oxygen: number | null;
} | null> => {
  try {
    // Buscar dispositivos do usuário
    const { data: devices, error: devicesError } = await supabase
      .from("dispositivos")
      .select("id_disp")
      .eq("id_us", userId)
      .eq("status", "ativo")
      .limit(1);

    if (devicesError || !devices || devices.length === 0) {
      console.warn("Nenhum dispositivo ativo encontrado para o usuário");
      return null;
    }

    const deviceId = devices[0].id_disp;

    // Buscar dados mais recentes de cada tipo
    const [heartRateData, pressureData, oxygenData] = await Promise.all([
      // Frequência cardíaca
      supabase
        .from("healthkit")
        .select("*")
        .eq("id_disp", deviceId)
        .eq("tipo_dado", "heart_rate")
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Pressão arterial
      supabase
        .from("healthkit")
        .select("*")
        .eq("id_disp", deviceId)
        .eq("tipo_dado", "blood_pressure")
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Oxigênio (SpO2)
      supabase
        .from("healthkit")
        .select("*")
        .eq("id_disp", deviceId)
        .eq("tipo_dado", "oxygen_saturation")
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      heartRate: heartRateData.data?.valor || null,
      pressure: pressureData.data?.valor || null,
      oxygen: oxygenData.data?.valor || null,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de healthkit:", error);
    return null;
  }
};

/**
 * Inscreve-se para receber atualizações em tempo real dos dados de healthkit
 * @param userId ID do usuário
 * @param callback Função callback chamada quando há atualizações
 * @returns Função para cancelar a inscrição
 */
export const subscribeToHealthKitRealtime = (
  userId: number,
  callback: (data: {
    heartRate: number | null;
    pressure: number | null;
    oxygen: number | null;
  }) => void
): (() => void) => {
  let subscription: ReturnType<typeof supabase.channel> | null = null;

  // Buscar dispositivo do usuário primeiro
  supabase
    .from("dispositivos")
    .select("id_disp")
    .eq("id_us", userId)
    .eq("status", "ativo")
    .limit(1)
    .then(({ data: devices, error }) => {
      if (error || !devices || devices.length === 0) {
        console.warn("Nenhum dispositivo ativo encontrado para o usuário");
        return;
      }

      const deviceId = devices[0].id_disp;

      // Inscrever-se em atualizações da tabela healthkit
      subscription = supabase
        .channel(`healthkit-${deviceId}`)
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
            const latestData = await getLatestHealthKitData(userId);
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
 * Busca dados de healthkit em tempo real usando polling (alternativa ao realtime)
 * @param userId ID do usuário
 * @param interval Intervalo em milissegundos (padrão: 5000ms = 5 segundos)
 * @param callback Função callback chamada quando há atualizações
 * @returns Função para cancelar o polling
 */
export const pollHealthKitData = (
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

    const data = await getLatestHealthKitData(userId);
    if (data) {
      callback(data);
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

