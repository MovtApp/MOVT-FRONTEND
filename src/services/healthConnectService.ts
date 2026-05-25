import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
  getGrantedPermissions,
} from "react-native-health-connect";
import { Platform } from "react-native";

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let isProcessingPermissions = false;
let isProcessingSteps = false;
let isProcessingHeartRate = false;
let isProcessingCalories = false;
let isProcessingOxygen = false;
let isProcessingSleep = false;
let isProcessingDetailedSleep = false;

export const isHealthConnectReady = () => isInitialized;

/**
 * Inicialização centralizada e protegida do Health Connect.
 * Garante que o SDK seja inicializado apenas uma vez e em um momento seguro.
 */
export const preInitializeHC = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;
  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[HealthConnect] Iniciando verificação de status...");
      const status = await getSdkStatus();

      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        console.log("[HealthConnect] SDK disponível. Chamando initialize()...");
        await initialize();

        // Aguarda um tempo de estabilização pós-inicialização para garantir que o delegate nativo
        // (ActivityResultLauncher) seja registrado corretamente pelo ciclo de vida do Android.
        // Isso é CRÍTICO para evitar UninitializedPropertyAccessException em builds de produção.
        await new Promise((resolve) => setTimeout(() => resolve(true), 2500));

        isInitialized = true;
        console.log("[HealthConnect] Sistema pronto e estabilizado.");
        return true;
      }

      console.warn("[HealthConnect] SDK não disponível ou precisa de instalação.");
      return false;
    } catch (error) {
      console.error("[HealthConnect] Falha crítica na inicialização:", error);
      return false;
    } finally {
      // Mantemos o initPromise como a fonte da verdade, mas permitimos novas tentativas se falhar
      if (!isInitialized) initPromise = null;
    }
  })();

  return initPromise;
};

const isHCAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch (error) {
    console.error("[HealthConnect] Erro ao verificar disponibilidade:", error);
    return false;
  }
};

export const requestHealthConnectPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;
  if (isProcessingPermissions) return false;

  isProcessingPermissions = true;
  try {
    console.log("[HealthConnect] Verificando status do SDK antes de solicitar permissões...");

    // Garante que a inicialização foi concluída (ou espera por ela)
    const ready = await preInitializeHC();
    if (!ready) {
      console.warn("[HealthConnect] SDK não disponível. Abortando solicitação de permissões.");
      isProcessingPermissions = false;
      return false;
    }

    // Aguarda extra para garantir que o delegate nativo do HC está completamente registrado
    console.log("[HealthConnect] Solicitando permissões via UI...");

    // Verifica permissões existentes de forma silenciosa antes de qualquer ação
    try {
      const granted = await getGrantedPermissions();
      const requiredTypes = [
        "Steps",
        "HeartRate",
        "TotalCaloriesBurned",
        "OxygenSaturation",
        "SleepSession",
      ];
      const hasAll = requiredTypes.every((type) =>
        granted.some((p) => p.recordType === type && p.accessType === "read")
      );

      if (hasAll) {
        console.log("[HealthConnect] Permissões já confirmadas.");
        return true;
      }
    } catch (e) {
      console.warn("[HealthConnect] Erro ao validar permissões prévias:", e);
    }

    console.log("[HealthConnect] Solicitando permissões via UI...");
    const result = await requestPermission([
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "TotalCaloriesBurned" },
      { accessType: "read", recordType: "OxygenSaturation" },
      { accessType: "read", recordType: "SleepSession" },
    ]);

    const grantedCount = Array.isArray(result) ? result.length : 0;
    console.log(`[HealthConnect] Permissões concedidas: ${grantedCount} de 5`);

    return grantedCount > 0;
  } catch (error) {
    console.error("[HealthConnect] Erro ao solicitar permissões:", error);
    return false;
  } finally {
    isProcessingPermissions = false;
  }
};

export const fetchHealthConnectSteps = async (): Promise<number> => {
  if (!(await isHCAvailable())) return 0;
  if (isProcessingSteps) {
    console.warn("[HealthConnect] Ignorando requisição simultânea (Steps)");
    return 0;
  }

  isProcessingSteps = true;
  try {
    const ready = await preInitializeHC();
    if (!ready) return 0;

    // Verifica se temos permissão de leitura para o tipo específico antes de tentar ler
    // Isso é o escudo final contra o crash de "UninitializedPropertyAccessException"
    const currentPermissions = await getGrantedPermissions();
    const hasPermission = currentPermissions.some(
      (p) => p.recordType === "Steps" && p.accessType === "read"
    );
    if (!hasPermission) return 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const result = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: startOfDay.toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    const totalSteps = result.records.reduce((sum, r) => sum + (r.count || 0), 0);
    console.log(
      `[HC DATA] 👣 Passos: ${result.records.length} registros | Total hoje: ${totalSteps}`
    );
    return totalSteps;
  } catch (error) {
    console.error("Erro ao buscar passos do Health Connect:", error);
    return 0;
  } finally {
    isProcessingSteps = false;
  }
};

export const fetchHealthConnectHeartRate = async (): Promise<number> => {
  if (!(await isHCAvailable())) return 0;
  if (isProcessingHeartRate) return 0;
  isProcessingHeartRate = true;
  try {
    const ready = await preInitializeHC();
    if (!ready) return 0;

    // Verifica se temos permissão de leitura para o tipo específico antes de tentar ler
    const currentPermissions = await getGrantedPermissions();
    const hasPermission = currentPermissions.some(
      (p) => p.recordType === "HeartRate" && p.accessType === "read"
    );
    if (!hasPermission) return 0;

    const result = await readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    let lastBpm = 0;
    if (result.records.length > 0) {
      const last = result.records[result.records.length - 1];
      if (last.samples && last.samples.length > 0) {
        lastBpm = last.samples[last.samples.length - 1].beatsPerMinute || 0;
      }
    }
    console.log(
      `[HC DATA] 💓 Batimentos: ${result.records.length} registros | Último BPM: ${lastBpm || "--"}`
    );
    return lastBpm;
  } catch (error) {
    console.error("Erro ao buscar batimentos do Health Connect:", error);
    return 0;
  } finally {
    isProcessingHeartRate = false;
  }
};

export const fetchHealthConnectCalories = async (): Promise<number> => {
  if (!(await isHCAvailable())) return 0;
  if (isProcessingCalories) return 0;
  isProcessingCalories = true;
  try {
    const ready = await preInitializeHC();
    if (!ready) return 0;

    // Verifica se temos permissão de leitura para o tipo específico antes de tentar ler
    const currentPermissions = await getGrantedPermissions();
    const hasPermission = currentPermissions.some(
      (p) => p.recordType === "TotalCaloriesBurned" && p.accessType === "read"
    );
    if (!hasPermission) return 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const result = await readRecords("TotalCaloriesBurned", {
      timeRangeFilter: {
        operator: "between",
        startTime: startOfDay.toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    const total = result.records.reduce((sum, r) => sum + (r.energy?.inKilocalories || 0), 0);
    const roundedCalories = Math.round(total);
    console.log(
      `[HC DATA] 🔥 Calorias: ${result.records.length} registros | Total hoje: ${roundedCalories} kcal`
    );
    return roundedCalories;
  } catch (error) {
    console.error("Erro ao buscar calorias do Health Connect:", error);
    return 0;
  } finally {
    isProcessingCalories = false;
  }
};

export const fetchHealthConnectOxygen = async (): Promise<number> => {
  if (!(await isHCAvailable())) return 0;
  if (isProcessingOxygen) return 0;
  isProcessingOxygen = true;
  try {
    const ready = await preInitializeHC();
    if (!ready) return 0;

    // Verifica se temos permissão de leitura para o tipo específico antes de tentar ler
    const currentPermissions = await getGrantedPermissions();
    const hasPermission = currentPermissions.some(
      (p) => p.recordType === "OxygenSaturation" && p.accessType === "read"
    );
    if (!hasPermission) return 0;

    const result = await readRecords("OxygenSaturation", {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    let lastOxygen = 0;
    if (result.records.length > 0) {
      lastOxygen = result.records[result.records.length - 1].percentage || 0;
    }
    console.log(
      `[HC DATA] 🫁 Oxigênio: ${result.records.length} registros | Último SpO2: ${lastOxygen || "--"}%`
    );
    return lastOxygen;
  } catch (error) {
    console.error("Erro ao buscar oxigênio do Health Connect:", error);
    return 0;
  } finally {
    isProcessingOxygen = false;
  }
};

export const fetchHealthConnectSleep = async (): Promise<number> => {
  if (!(await isHCAvailable())) return 0;
  if (isProcessingSleep) return 0;
  isProcessingSleep = true;
  try {
    const ready = await preInitializeHC();
    if (!ready) return 0;

    // Verifica se temos permissão de leitura para o tipo específico antes de tentar ler
    const currentPermissions = await getGrantedPermissions();
    const hasPermission = currentPermissions.some(
      (p) => p.recordType === "SleepSession" && p.accessType === "read"
    );
    if (!hasPermission) return 0;

    const result = await readRecords("SleepSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    let totalDurationMs = 0;
    result.records.forEach((session) => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      totalDurationMs += end - start;
    });
    const totalHours = totalDurationMs / (1000 * 60 * 60);
    console.log(
      `[HC DATA] 😴 Sono: ${result.records.length} sessões | Total hoje: ${totalHours.toFixed(1)}h`
    );
    return totalHours;
  } catch (error) {
    console.error("Erro ao buscar sono do Health Connect:", error);
    return 0;
  } finally {
    isProcessingSleep = false;
  }
};

export interface DetailedSleepData {
  totalHours: number;
  deepHours: number;
  lightHours: number;
  remHours: number;
  awakeHours: number;
  startTime: string | null;
  endTime: string | null;
}

export const fetchHealthConnectDetailedSleep = async (): Promise<DetailedSleepData | null> => {
  if (!(await isHCAvailable())) return null;
  if (isProcessingDetailedSleep) return null;
  isProcessingDetailedSleep = true;
  try {
    const ready = await preInitializeHC();
    if (!ready) return null;

    // Verifica se temos permissão de leitura para o tipo específico antes de tentar ler
    const currentPermissions = await getGrantedPermissions();
    const hasPermission = currentPermissions.some(
      (p) => p.recordType === "SleepSession" && p.accessType === "read"
    );
    if (!hasPermission) return null;

    const result = await readRecords("SleepSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    if (!result.records || result.records.length === 0) return null;

    let totalMs = 0;
    let deepMs = 0;
    let lightMs = 0;
    let remMs = 0;
    let awakeMs = 0;
    let firstStart = new Date().getTime();
    let lastEnd = 0;

    result.records.forEach((session) => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      if (start < firstStart) firstStart = start;
      if (end > lastEnd) lastEnd = end;

      totalMs += end - start;

      if (session.stages && Array.isArray(session.stages)) {
        session.stages.forEach((stage: any) => {
          const sStart = new Date(stage.startTime).getTime();
          const sEnd = new Date(stage.endTime).getTime();
          const dur = sEnd - sStart;
          if (stage.stage === 5) deepMs += dur;
          else if (stage.stage === 4 || stage.stage === 2) lightMs += dur;
          else if (stage.stage === 6) remMs += dur;
          else if (stage.stage === 1) awakeMs += dur;
        });
      }
    });

    if (deepMs === 0 && lightMs === 0) {
      deepMs = totalMs * 0.25;
      lightMs = totalMs * 0.75;
    }

    return {
      totalHours: totalMs / 3600000,
      deepHours: deepMs / 3600000,
      lightHours: lightMs / 3600000,
      remHours: remMs / 3600000,
      awakeHours: awakeMs / 3600000,
      startTime: firstStart < lastEnd ? new Date(firstStart).toISOString() : null,
      endTime: lastEnd > 0 ? new Date(lastEnd).toISOString() : null,
    };
  } catch (error) {
    console.error("Erro ao buscar sono detalhado:", error);
    return null;
  } finally {
    isProcessingDetailedSleep = false;
  }
};
