import { Platform } from "react-native";

/**
 * Serviço de Health Connect para Android
 * Substitui o Google Fit (descontinuado em 2024)
 * Compatível com: Samsung, Amazfit, Garmin, Fitbit, Xiaomi e todos os relógios Android
 */

// Import dinâmico para evitar erros em iOS
let HC: typeof import("react-native-health-connect") | null = null;

const getHC = async () => {
  if (Platform.OS !== "android") return null;
  if (HC) return HC;
  try {
    HC = await import("react-native-health-connect");
    return HC;
  } catch {
    console.warn("react-native-health-connect não disponível");
    return null;
  }
};

/**
 * Inicializa e solicita permissões do Health Connect
 */
export const ensureHealthConnectPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;

  try {
    const hc = await getHC();
    if (!hc) return false;

    const initialized = await hc.initialize();
    if (!initialized) {
      console.warn("Health Connect não inicializado. Talvez não esteja instalado no dispositivo.");
      return false;
    }

    const granted = await hc.requestPermission([
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "TotalCaloriesBurned" },
      { accessType: "read", recordType: "SleepSession" },
      { accessType: "read", recordType: "OxygenSaturation" },
      { accessType: "read", recordType: "BloodPressure" },
    ]);

    return Array.isArray(granted) && granted.length > 0;
  } catch (error) {
    console.warn("Erro ao solicitar permissões do Health Connect:", error);
    return false;
  }
};

/**
 * Retorna o intervalo do dia atual
 */
const getTodayTimeRange = () => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  return {
    operator: "between" as const,
    startTime: startOfDay.toISOString(),
    endTime: now.toISOString(),
  };
};

/**
 * Busca a frequência cardíaca mais recente (BPM)
 * Funciona com qualquer relógio que sincronize com o Health Connect
 */
export const fetchHealthConnectHeartRate = async (): Promise<number> => {
  if (Platform.OS !== "android") return 0;

  try {
    const hc = await getHC();
    if (!hc) return 0;

    const results = await hc.readRecords("HeartRate", {
      timeRangeFilter: getTodayTimeRange(),
    });

    if (!results?.records || results.records.length === 0) return 0;

    // Pega a leitura mais recente
    const latest = results.records[results.records.length - 1] as any;
    const samples = latest?.samples ?? latest?.beatsPerMinute;

    if (Array.isArray(samples) && samples.length > 0) {
      return samples[samples.length - 1]?.beatsPerMinute ?? 0;
    }
    if (typeof latest?.beatsPerMinute === "number") {
      return latest.beatsPerMinute;
    }

    return 0;
  } catch (error) {
    console.warn("Erro ao buscar BPM do Health Connect:", error);
    return 0;
  }
};

/**
 * Busca os passos do dia de hoje
 */
export const fetchHealthConnectSteps = async (): Promise<number> => {
  if (Platform.OS !== "android") return 0;

  try {
    const hc = await getHC();
    if (!hc) return 0;

    const results = await hc.readRecords("Steps", {
      timeRangeFilter: getTodayTimeRange(),
    });

    if (!results?.records || results.records.length === 0) return 0;

    // Soma todos os registros de passos do dia
    const total = results.records.reduce((sum: number, record: any) => {
      return sum + (record?.count ?? 0);
    }, 0);

    return total;
  } catch (error) {
    console.warn("Erro ao buscar passos do Health Connect:", error);
    return 0;
  }
};

/**
 * Busca as calorias totais queimadas hoje
 */
export const fetchHealthConnectCalories = async (): Promise<number> => {
  if (Platform.OS !== "android") return 0;

  try {
    const hc = await getHC();
    if (!hc) return 0;

    const results = await hc.readRecords("TotalCaloriesBurned", {
      timeRangeFilter: getTodayTimeRange(),
    });

    if (!results?.records || results.records.length === 0) return 0;

    const total = results.records.reduce((sum: number, record: any) => {
      const kcal = record?.energy?.inKilocalories ?? record?.energy?.kilocalories ?? 0;
      return sum + kcal;
    }, 0);

    return Math.round(total);
  } catch (error) {
    console.warn("Erro ao buscar calorias do Health Connect:", error);
    return 0;
  }
};

/**
 * Busca saturação de oxigênio (SpO2) mais recente
 */
export const fetchHealthConnectOxygen = async (): Promise<number> => {
  if (Platform.OS !== "android") return 0;

  try {
    const hc = await getHC();
    if (!hc) return 0;

    const results = await hc.readRecords("OxygenSaturation", {
      timeRangeFilter: getTodayTimeRange(),
    });

    if (!results?.records || results.records.length === 0) return 0;

    const latest = results.records[results.records.length - 1] as any;
    return latest?.percentage ?? 0;
  } catch (error) {
    console.warn("Erro ao buscar SpO2 do Health Connect:", error);
    return 0;
  }
};

/**
 * Busca horas de sono
 */
export const fetchHealthConnectSleep = async (): Promise<{ hours: number; minutes: number }> => {
  if (Platform.OS !== "android") return { hours: 0, minutes: 0 };

  try {
    const hc = await getHC();
    if (!hc) return { hours: 0, minutes: 0 };

    // Busca do dia anterior (sono da noite passada)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0);

    const results = await hc.readRecords("SleepSession", {
      timeRangeFilter: {
        operator: "between" as const,
        startTime: yesterday.toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    if (!results?.records || results.records.length === 0) return { hours: 0, minutes: 0 };

    let totalMinutes = 0;
    for (const record of results.records as any[]) {
      const start = new Date(record.startTime).getTime();
      const end = new Date(record.endTime).getTime();
      totalMinutes += (end - start) / (1000 * 60);
    }

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: Math.floor(totalMinutes % 60),
    };
  } catch (error) {
    console.warn("Erro ao buscar sono do Health Connect:", error);
    return { hours: 0, minutes: 0 };
  }
};

/**
 * Polling de BPM em tempo real (a cada X segundos)
 * Útil durante treinos ativos
 */
export const pollHealthConnectHeartRate = (
  intervalMs: number = 5000,
  callback: (bpm: number) => void
): (() => void) => {
  let isRunning = true;

  const poll = async () => {
    if (!isRunning) return;
    const bpm = await fetchHealthConnectHeartRate();
    if (bpm > 0) callback(bpm);
    if (isRunning) setTimeout(poll, intervalMs);
  };

  poll();
  return () => {
    isRunning = false;
  };
};
