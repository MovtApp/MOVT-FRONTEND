import { api } from "./api";
import { secureGet } from "./secureStore";
import { enqueue, registerSyncHandler } from "./syncQueue";

export interface CalorieData {
  date: string;
  calories: number;
  timestamp: string;
}

export interface CalorieStats {
  totalCalories: number;
  remainingCalories: number;
  dailyGoal: number;
  data: CalorieData[];
}

export type TimeframeType = "1d" | "1s" | "1m" | "1a" | "Tudo";

/**
 * Busca dados de qualquer métrica de saúde do backend
 */
export const getHealthMetricData = async (
  metric: string,
  timeframe: TimeframeType = "1d",
  date?: string
): Promise<CalorieStats> => {
  try {
    const sessionId = await secureGet("userSessionId");

    if (!sessionId) {
      throw new Error("Sessão não encontrada. Faça login novamente.");
    }

    const response = await api.get(`/dados/${metric}`, {
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
      params: {
        timeframe,
        date, // Passa a data específica se fornecida
      },
    });

    const rawData = response.data?.data || [];
    const safeData = Array.isArray(rawData) ? rawData : [];

    // Mapeia o campo 'value' da API genérica para o campo 'calories' usado pelas interfaces existentes
    const formattedData = safeData.map((item: any) => ({
      ...item,
      calories: Number(item?.value) || 0,
    }));

    const totalVal = Number(response.data?.totalValue) || 0;
    const dailyGoal = Number(response.data?.dailyGoal) || 10000;

    return {
      totalCalories: Math.round(totalVal),
      remainingCalories: Math.max(0, dailyGoal - totalVal),
      dailyGoal: dailyGoal,
      data: formattedData,
    };
  } catch (error: any) {
    console.error(`❌ Erro ao buscar dados de ${metric}:`, error);
    return {
      totalCalories: 0,
      remainingCalories: 10000,
      dailyGoal: 10000,
      data: [],
    };
  }
};

/**
 * Busca dados de calorias do backend com base no timeframe selecionado
 */
export const getCaloriesData = (
  timeframe: TimeframeType = "1d",
  date?: string
): Promise<CalorieStats> => getHealthMetricData("calories", timeframe, date);

/** Payload enfileirado para uma escrita de métrica de saúde. */
interface HealthMetricJob {
  metric: string;
  value: number;
  timestamp: string;
  date: string; // YYYY-MM-DD local
}

/**
 * Despacha de fato a métrica para o backend. Manda o `clientId` para o backend
 * deduplicar (ON CONFLICT) — assim o reenvio offline-first nunca duplica linha.
 * Registrado no syncQueue sob o kind "healthMetric".
 */
const postHealthMetric = async (job: HealthMetricJob, clientId: string): Promise<void> => {
  await api.post(`/dados/${job.metric}`, {
    value: job.value,
    timestamp: job.timestamp,
    date: job.date, // Garante que o backend usa a data local, não UTC
    clientId, // idempotência
  });
};

registerSyncHandler("healthMetric", (payload, clientId) =>
  postHealthMetric(payload as HealthMetricJob, clientId)
);

/**
 * Salva qualquer métrica de saúde de forma offline-first: enfileira a escrita
 * (gravada no disco na hora) e tenta empurrar para o backend. Se estiver offline,
 * fica pendente e sincroniza quando a conexão voltar — não lança erro de rede.
 */
export const saveHealthMetricData = async (
  metric: string,
  value: number,
  targetDate?: Date
): Promise<void> => {
  const now = targetDate || new Date();
  if (isNaN(now.getTime())) return; // Proteção contra data inválida

  // Gera a data local no formato YYYY-MM-DD de forma robusta
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const localDateStr = `${year}-${month}-${day}`;

  await enqueue("healthMetric", {
    metric,
    value,
    timestamp: now.toISOString(),
    date: localDateStr,
  } as HealthMetricJob);
};

/**
 * Salva dados de calorias no backend
 */
export const saveCaloriesData = async (calories: number, targetDate?: Date): Promise<void> => {
  return saveHealthMetricData("calories", calories, targetDate);
};

/**
 * Dados mockados para desenvolvimento e fallback
 */
const getMockCaloriesData = (timeframe: TimeframeType): CalorieStats => {
  const now = new Date();
  let data: CalorieData[] = [];

  switch (timeframe) {
    case "1d":
      // Dados de um dia (por hora)
      data = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(now);
        date.setHours(i, 0, 0, 0);
        return {
          date: date.toISOString(),
          calories: Math.floor(1400 + Math.random() * 600),
          timestamp: date.toISOString(),
        };
      });
      break;

    case "1s":
      // Dados de uma semana (7 dias)
      data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString(),
          calories: Math.floor(1500 + Math.random() * 500),
          timestamp: date.toISOString(),
        };
      });
      break;

    case "1m":
      // Dados de um mês (30 dias)
      data = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString(),
          calories: Math.floor(1400 + Math.random() * 700),
          timestamp: date.toISOString(),
        };
      });
      break;

    case "1a":
      // Dados de um ano (12 meses)
      data = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (11 - i));
        return {
          date: date.toISOString(),
          calories: Math.floor(1600 + Math.random() * 400),
          timestamp: date.toISOString(),
        };
      });
      break;

    case "Tudo":
      // Dados de todos os tempos (últimos 60 dias)
      data = Array.from({ length: 60 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (59 - i));
        return {
          date: date.toISOString(),
          calories: Math.floor(1300 + Math.random() * 800),
          timestamp: date.toISOString(),
        };
      });
      break;
  }

  const totalCalories = data[data.length - 1]?.calories || 0;
  const dailyGoal = 2000;

  return {
    totalCalories,
    remainingCalories: Math.max(0, dailyGoal - totalCalories),
    dailyGoal,
    data,
  };
};

/**
 * Calcula o domínio dinâmico do gráfico (min e max)
 */
export const calculateChartDomain = (data: CalorieData[]): [number, number] => {
  const values = (data || [])
    .map((d) => d.calories)
    .filter((v) => typeof v === "number" && isFinite(v) && !isNaN(v));

  if (values.length === 0) {
    return [0, 2000];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  // Adiciona 10% de padding acima e abaixo
  const diff = max - min;
  const padding = diff > 0 ? diff * 0.1 : 500;

  const minDomain = Math.floor((min - padding) / 100) * 100;
  const maxDomain = Math.ceil((max + padding) / 100) * 100;

  const resultMin = Math.max(0, isFinite(minDomain) ? minDomain : 0);
  const resultMax = isFinite(maxDomain) ? maxDomain : 2000;

  return [resultMin, Math.max(resultMin + 100, resultMax)];
};

/**
 * Formata a data com base no timeframe
 */
export const formatDateLabel = (date: string, timeframe: TimeframeType): string => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    switch (timeframe) {
      case "1d":
        return d.getHours().toString().padStart(2, "0") + "h";

      case "1s":
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        return days[d.getDay()] || "";

      case "1m":
        return d.getDate().toString();

      case "1a":
        const months = [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ];
        return months[d.getMonth()] || "";

      case "Tudo":
        return `${d.getDate()}/${d.getMonth() + 1}`;

      default:
        return "";
    }
  } catch (e) {
    return "";
  }
};
