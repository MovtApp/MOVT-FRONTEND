import React from "react";
import { usePlanAccess } from "../hooks/usePlanAccess";
import PremiumLockedScreen from "./PremiumLockedScreen";
import type { BooleanFeature } from "../config/planLimits";

/**
 * Envolve uma TELA inteira com bloqueio por plano. Para o plano free (feature
 * bloqueada), renderiza o PremiumLockedScreen; senão, a tela normal.
 *
 * Seguro quanto às regras de hooks: o componente embrulhado só monta quando
 * liberado (a decisão fica neste wrapper, não dentro da tela).
 *
 *   export default withPremiumGate(DietScreen, "dietas", "Dietas");
 */
export function withPremiumGate<P extends object>(
  Component: React.ComponentType<P>,
  feature: BooleanFeature,
  title: string,
  message?: string,
  backTo?: { name: string; params?: Record<string, unknown> }
) {
  return function PremiumGatedScreen(props: P) {
    const { isBlocked } = usePlanAccess();
    if (isBlocked(feature)) {
      return <PremiumLockedScreen title={title} message={message} backTo={backTo} />;
    }
    return <Component {...props} />;
  };
}

export default withPremiumGate;
