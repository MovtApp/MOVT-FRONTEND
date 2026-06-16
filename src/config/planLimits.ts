// Fonte ÚNICA da verdade dos limites por plano. Mexer aqui muda o app inteiro.
// Convenção por feature:
//   - boolean  → false = bloqueado p/ free; true = liberado
//   - number   → limite de registros (free); premium/família = null (ilimitado)
//
// premium e familia têm acesso TOTAL (sem bloqueio). Só `free` é limitado.

export type PlanType = "free" | "premium" | "familia";

// Features booleanas (acesso ou bloqueio total)
export type BooleanFeature = "dietas" | "desafios" | "dadosAvancados";
// Features por contagem (limite de registros)
export type CountFeature = "treinos" | "agendamentos" | "comunidades";
export type GatedFeature = BooleanFeature | CountFeature;

interface PlanRule {
  // booleanas
  dietas: boolean;
  desafios: boolean;
  dadosAvancados: boolean; // Batimentos (ECG), Sono, Ciclismo (GPS)
  // contagem (null = ilimitado)
  treinos: number | null; // por semana
  agendamentos: number | null; // por mês
  comunidades: number | null; // por mês
}

const UNLIMITED: PlanRule = {
  dietas: true,
  desafios: true,
  dadosAvancados: true,
  treinos: null,
  agendamentos: null,
  comunidades: null,
};

export const PLAN_LIMITS: Record<PlanType, PlanRule> = {
  free: {
    dietas: false,
    desafios: false,
    dadosAvancados: false,
    treinos: 2, // 2 treinos por semana
    agendamentos: 2, // 2 agendamentos por mês
    comunidades: 2, // 2 comunidades por mês
  },
  premium: UNLIMITED,
  familia: UNLIMITED,
};

// Rótulos amigáveis para mensagens de upgrade (CTA do cadeado).
export const FEATURE_LABELS: Record<GatedFeature, string> = {
  dietas: "Planos de dieta",
  desafios: "Desafios",
  dadosAvancados: "Dados avançados de saúde",
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
