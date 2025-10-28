import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
 * Busca dados de calorias do backend com base no timeframe selecionado
 */
export const getCaloriesData = async (
  timeframe: TimeframeType = "1d",
): Promise<CalorieStats> => {
  try {
    const sessionId = await AsyncStorage.getItem("userSessionId");

    if (!sessionId) {
      throw new Error("Sessão não encontrada. Faça login novamente.");
    }

    const response = await api.get("/dados/calories", {
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
      params: {
        timeframe,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ Erro ao buscar dados de calorias:", error);

    // Retorna dados mockados em caso de erro (para desenvolvimento)
    return getMockCaloriesData(timeframe);
  }
};

/**
 * Salva dados de calorias no backend
 */
export const saveCaloriesData = async (calories: number): Promise<void> => {
  try {
    const sessionId = await AsyncStorage.getItem("userSessionId");

    if (!sessionId) {
      throw new Error("Sessão não encontrada. Faça login novamente.");
    }

    await api.post(
      "/dados/calories",
      {
        calories,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      },
    );
  } catch (error: any) {
    console.error("❌ Erro ao salvar dados de calorias:", error);
    throw error;
  }
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
  if (data.length === 0) {
    return [0, 2000];
  }

  const values = data.map((d) => d.calories);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Adiciona 10% de padding acima e abaixo
  const padding = (max - min) * 0.1;
  const minDomain = Math.floor((min - padding) / 100) * 100;
  const maxDomain = Math.ceil((max + padding) / 100) * 100;

  return [Math.max(0, minDomain), maxDomain];
};

/**
 * Formata a data com base no timeframe
 */
export const formatDateLabel = (
  date: string,
  timeframe: TimeframeType,
): string => {
  const d = new Date(date);

  switch (timeframe) {
    case "1d":
      return d.getHours().toString().padStart(2, "0") + "h";

    case "1s":
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      return days[d.getDay()];

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
      return months[d.getMonth()];

    case "Tudo":
      return `${d.getDate()}/${d.getMonth() + 1}`;

    default:
      return date;
  }
};
