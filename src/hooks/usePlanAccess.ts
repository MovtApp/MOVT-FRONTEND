import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUpgradeSheet } from "../components/UpgradeSheetProvider";
import {
  PLAN_LIMITS,
  normalizePlan,
  type BooleanFeature,
  type CountFeature,
  type GatedFeature,
  type PlanType,
} from "../config/planLimits";

/**
 * Acesso por plano (free | premium | familia). Centraliza a regra de bloqueio.
 * premium/familia têm acesso total; só `free` é limitado.
 *
 *  - isBlocked(feature): true se a feature booleana está travada p/ o plano atual.
 *  - limitOf(feature):   limite numérico do plano (null = ilimitado).
 *  - reachedLimit(f,used): true se `used` já bateu/passou o limite (free).
 *  - goPremium():         leva para a tela de planos.
 */
export function usePlanAccess() {
  const { user } = useAuth();
  const { openUpgrade } = useUpgradeSheet();

  return useMemo(() => {
    const plan: PlanType = normalizePlan(user?.plan);
    const hasFullAccess = plan === "premium" || plan === "familia";
    const rule = PLAN_LIMITS[plan];

    const isBlocked = (feature: BooleanFeature) => {
      if (hasFullAccess) return false;
      return rule[feature] === false;
    };

    const limitOf = (feature: CountFeature): number | null => {
      if (hasFullAccess) return null;
      return rule[feature];
    };

    const reachedLimit = (feature: CountFeature, used: number) => {
      const limit = limitOf(feature);
      if (limit === null) return false; // ilimitado
      return used >= limit;
    };

    const goPremium = () => {
      navigation.navigate("PlanScreen");
    };

    return {
      plan,
      isFree: plan === "free",
      hasFullAccess,
      isBlocked,
      limitOf,
      reachedLimit,
      goPremium,
    };
  }, [user?.plan, navigation]);
}

export type { GatedFeature, BooleanFeature, CountFeature };
