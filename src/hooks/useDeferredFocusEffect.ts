import { useCallback, useRef } from "react";
import { InteractionManager } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

type EffectCallback = () => void | (() => void);

/**
 * Igual ao useFocusEffect, mas executa o efeito SOMENTE depois que as interações
 * e animações de navegação terminam (InteractionManager.runAfterInteractions).
 *
 * Objetivo: desacoplar navegação de carregamento de dados. A tela pinta primeiro
 * (com cache/skeleton) e o trabalho pesado (fetch/sync nativo) roda logo após a
 * transição, deixando a navegação fluida em vez de "logs primeiro, tela depois".
 *
 * Suporta cleanup: se o `effect` retornar uma função, ela é chamada ao desfocar.
 */
export function useDeferredFocusEffect(effect: EffectCallback, deps: React.DependencyList) {
  // Mantém a referência mais recente do efeito sem reexecutar o focus effect.
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useFocusEffect(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => {
      let cleanup: void | (() => void);
      const task = InteractionManager.runAfterInteractions(() => {
        cleanup = effectRef.current();
      });

      return () => {
        task.cancel();
        if (typeof cleanup === "function") cleanup();
      };
    }, deps)
  );
}
