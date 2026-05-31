import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

/**
 * Retorna `false` no primeiro frame e `true` somente depois que as interações e
 * animações de navegação terminam (InteractionManager.runAfterInteractions).
 *
 * Use para adiar a MONTAGEM de subárvores pesadas: a tela pinta um shell leve
 * instantaneamente e o conteúdo pesado entra no frame seguinte, eliminando o
 * "stutter" de montagem que acontece durante a transição de navegação.
 *
 * @example
 * const mounted = useDeferredMount();
 * return (
 *   <View>
 *     <Header />
 *     {mounted ? <ConteudoPesado /> : <Placeholder />}
 *   </View>
 * );
 */
export function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return ready;
}
