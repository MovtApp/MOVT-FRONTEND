// Fonte ÚNICA da verdade dos limites por plano. Mexer aqui muda o app inteiro.
// Convenção por feature:
//   - boolean  → false = bloqueado p/ free; true = liberado
//   - number   → limite de registros no período; null = ilimitado
//
// `familia` tem acesso TOTAL. `premium` é quase total, mas tem TETO em dietas
// (8/mês) — por isso premium não é mais idêntico a UNLIMITED. Ver ADR-0013.

export type PlanType = "free" | "premium" | "familia";

// Features booleanas (acesso ou bloqueio total)
export type BooleanFeature = "expectativaRealidade";
// Features por contagem (limite de registros no período)
export type CountFeature = "dietas" | "desafios" | "treinos" | "agendamentos" | "comunidades";
export type GatedFeature = BooleanFeature | CountFeature;

interface PlanRule {
  // booleanas
  // Só a tela Expectativa × Realidade é Premium. Batimentos/Sono/Ciclismo são livres.
  expectativaRealidade: boolean;
  // contagem (null = ilimitado)
  dietas: number | null; // criar por mês
  desafios: number | null; // participar por mês
  treinos: number | null; // por semana
  agendamentos: number | null; // por mês
  comunidades: number | null; // por mês
}

const UNLIMITED: PlanRule = {
  expectativaRealidade: true,
  dietas: null,
  desafios: null,
  treinos: null,
  agendamentos: null,
  comunidades: null,
};

export const PLAN_LIMITS: Record<PlanType, PlanRule> = {
  free: {
    expectativaRealidade: false,
    dietas: 2, // 2 dietas por mês
    desafios: 2, // 2 desafios por mês
    treinos: 2, // 2 treinos por semana
    agendamentos: 2, // 2 agendamentos por mês
    comunidades: 2, // 2 comunidades por mês
  },
  premium: {
    expectativaRealidade: true,
    dietas: 8, // 8 dietas por mês (teto do premium)
    desafios: 8, // 8 desafios por mês (teto do premium)
    treinos: null,
    agendamentos: null,
    comunidades: null,
  },
  familia: UNLIMITED,
};

// Rótulos amigáveis para mensagens de upgrade (CTA do cadeado).
export const FEATURE_LABELS: Record<GatedFeature, string> = {
  dietas: "Planos de dieta",
  desafios: "Desafios",
  expectativaRealidade: "Expectativa × Realidade",
  treinos: "Treinos",
  agendamentos: "Agendamentos",
  comunidades: "Comunidades",
};

export function normalizePlan(plan?: string | null): PlanType {
  const p = (plan || "free").toLowerCase();
  if (p === "premium") return "premium";
  if (p === "familia" || p === "family") return "familia";
  return "free";
}
