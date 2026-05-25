import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface UserMission {
  pesoAtual: number; // kg
  pesoMeta: number; // kg
  altura: number; // cm
  idade: number; // anos
  sexo: "M" | "F";
  nivelAtividade: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
}

export interface MissionBreakdown {
  // Déficit Total da Missão
  deficitTotal: number; // ex: 539.000 kcal
  kgAPerder: number; // ex: 70 kg

  // Metas por período (o quanto DEVE ser feito em cada período)
  metaTudo: number; // = deficitTotal
  metaAnual: number; // déficit por ano (velocidade OMS: 0.5kg/semana)
  metaMensal: number; // metaAnual / 12
  metaSemanal: number; // metaMensal / 4 (= 0.5kg/sem * 7700 = ~3.850 kcal)
  metaDiaria: number; // metaSemanal / 7

  // Progresso já acumulado
  deficitAcumulado: number; // kcal já eliminadas
  percentualConcluido: number; // ex: 0.45%

  // TDEE (gasto diário estimado)
  tdee: number;

  // Tempo estimado para completar a missão (em semanas)
  semanasTotais: number;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const KCAL_POR_KG = 7700;
const KG_POR_SEMANA_OMS = 0.5; // padrão OMS de emagrecimento seguro
const DEFICIT_SEMANAL = KG_POR_SEMANA_OMS * KCAL_POR_KG; // 3.850 kcal/semana

// Fatores de atividade para o TDEE
const ACTIVITY_FACTORS: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
};

const STORAGE_KEY = "@MOVT:userMission";

// ─── Cálculo de TDEE (Fórmula Mifflin-St Jeor) ────────────────────────────────

export function calcularTDEE(missao: UserMission): number {
  if (!missao) return 0;
  const { pesoAtual, altura, idade, sexo, nivelAtividade } = missao;

  // Metabolismo Basal (TMB)
  let tmb: number;
  try {
    if (sexo === "M") {
      tmb = 10 * (pesoAtual || 0) + 6.25 * (altura || 0) - 5 * (idade || 0) + 5;
    } else {
      tmb = 10 * (pesoAtual || 0) + 6.25 * (altura || 0) - 5 * (idade || 0) - 161;
    }

    const fatorAtividade = ACTIVITY_FACTORS[nivelAtividade] || 1.55;
    const result = Math.round(tmb * fatorAtividade);
    return isFinite(result) ? result : 0;
  } catch (e) {
    return 0;
  }
}

// ─── Motor Central de Missão ───────────────────────────────────────────────────

export function calcularMissao(
  missao: UserMission,
  deficitAcumulado: number = 0
): MissionBreakdown {
  if (!missao) {
    return {
      deficitTotal: 0,
      kgAPerder: 0,
      metaTudo: 0,
      metaAnual: 0,
      metaMensal: 0,
      metaSemanal: 0,
      metaDiaria: 0,
      deficitAcumulado: 0,
      percentualConcluido: 0,
      tdee: 0,
      semanasTotais: 0,
    };
  }

  // Mapeamento robusto para aceitar snake_case ou camelCase
  const pAtual = parseFloat((missao.pesoAtual ?? (missao as any).peso_atual ?? 0).toString());
  const pMeta = parseFloat((missao.pesoMeta ?? (missao as any).peso_meta ?? 0).toString());

  const kgAPerder = Math.max(0, pAtual - pMeta);
  const deficitTotal = kgAPerder * KCAL_POR_KG;

  // Velocidade OMS: 0.5 kg/semana = 3.850 kcal/semana
  const metaSemanal = DEFICIT_SEMANAL;
  const metaMensal = metaSemanal * 4; // ~15.400 kcal/mês
  const metaAnual = metaMensal * 12; // ~184.800 kcal/ano
  const metaDiaria = Math.round(metaSemanal / 7); // ~550 kcal/dia

  const semanasTotais = kgAPerder / (KG_POR_SEMANA_OMS || 0.5);

  const deficitRestante = Math.max(0, deficitTotal - deficitAcumulado);
  const percentualConcluido = deficitTotal > 0 ? (deficitAcumulado / deficitTotal) * 100 : 0;

  const tdee = calcularTDEE(missao);

  return {
    deficitTotal,
    kgAPerder,
    metaTudo: deficitRestante,
    metaAnual,
    metaMensal,
    metaSemanal,
    metaDiaria,
    deficitAcumulado,
    percentualConcluido,
    tdee: isFinite(tdee) ? tdee : 0,
    semanasTotais: isFinite(semanasTotais) ? semanasTotais : 0,
  };
}

// ─── Recuperar meta para o filtro selecionado ──────────────────────────────────

export function getMetaParaFiltro(breakdown: MissionBreakdown, filtro: string): number {
  const f = filtro.toLowerCase();
  switch (f) {
    case "1d":
      return breakdown.metaDiaria;
    case "1s":
      return breakdown.metaSemanal;
    case "1m":
      return breakdown.metaMensal;
    case "1a":
      return breakdown.metaAnual;
    case "tudo":
      return breakdown.deficitTotal; // Sempre mostra a meta total da missão no Tudo
    default:
      return breakdown.metaDiaria;
  }
}

// ─── Subtítulo dinâmico por filtro ────────────────────────────────────────────

export function getSubtituloFiltro(
  filtro: "1d" | "1s" | "1m" | "1a" | "Tudo",
  breakdown: MissionBreakdown
): string {
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")}k` : Math.round(n).toString();

  switch (filtro) {
    case "1d":
      return `Meta do dia: ${fmt(breakdown.metaDiaria)} kcal de déficit`;
    case "1s":
      return `Meta da semana: ${fmt(breakdown.metaSemanal)} kcal`;
    case "1m":
      return `Meta do mês: ${fmt(breakdown.metaMensal)} kcal`;
    case "1a":
      return `Meta do ano: ${fmt(breakdown.metaAnual)} kcal`;
    case "Tudo":
      return `${breakdown.percentualConcluido.toFixed(1)}% da missão concluída`;
    default:
      return "";
  }
}

// ─── Persistência local e backend ─────────────────────────────────────────────

export async function salvarMissaoLocal(missao: UserMission): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(missao));
}

export async function carregarMissaoLocal(): Promise<UserMission | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function salvarMissaoBackend(missao: UserMission): Promise<void> {
  await api.post("/user/mission", missao);
}

export async function carregarMissaoBackend(): Promise<UserMission | null> {
  try {
    const res = await api.get("/user/mission");
    return res.data?.mission || null;
  } catch {
    return null;
  }
}

export async function getMissao(): Promise<UserMission | null> {
  // Tenta backend primeiro, depois local
  try {
    const backend = await carregarMissaoBackend();
    if (backend) {
      await salvarMissaoLocal(backend); // sincroniza cache local
      return backend;
    }
  } catch {}
  return carregarMissaoLocal();
}
