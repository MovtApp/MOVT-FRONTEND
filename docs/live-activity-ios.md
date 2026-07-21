# Fase 3 — Live Activity do treino no iOS (expo-live-activity)

Card do treino na **tela de bloqueio** + **Dynamic Island** (iOS 16.2+), atualizado
ao vivo durante corrida/ciclismo. Paridade com o card do Android (Fase 2).

Feito via **[`expo-live-activity`](https://github.com/software-mansion-labs/expo-live-activity)**
(Software Mansion) + **patch MOVT** (`patches/expo-live-activity+0.4.2.patch`) que
estende o schema e reescreve o SwiftUI no estilo Apple Fitness (header colorido +
3 colunas + logo MOVT).

> **Dá para fechar tudo do Windows** (sem Mac): o build iOS roda nos Macs da nuvem
> do **EAS Build**. O que ainda é obrigatório: **conta Apple Developer** (assinatura)
> e um **iPhone físico (16.2+)** para testar Live Activity (não funciona confiável
> no simulador).

## O que já está no repo

- `package.json` → dependência `expo-live-activity@0.4.2` + `postinstall` com
  `patch-package`.
- `patches/expo-live-activity+0.4.2.patch` → schema + layout SwiftUI customizados.
- `assets/liveActivity/movt_logo.png` → símbolo MOVT (≤ 4 KB); o plugin copia para
  o `Assets.xcassets` do Widget Extension no prebuild.
- `app.json` → plugin `"expo-live-activity"` na lista de `plugins`.
- `src/services/liveActivityService.ts` → wrapper que mapeia o snapshot do treino
  para o state estruturado. Guardado por plataforma/try-catch → **no-op em Android
  e em iOS antes do build**.
- `src/services/locationTrackingService.ts` → dispara start/update/end no ciclo
  do treino (update throttled a partir da task de GPS, roda mesmo bloqueado).

## Layout (estilo Apple Fitness / referência)

| Parte | Comportamento |
|---|---|
| Header | Barra colorida + texto centralizado + logo MOVT à direita. Pausado = amarelo `#FCC419` + "Em pausa automática". Ativo = verde `#BBF246` + "Corrida"/"Ciclismo". |
| Corpo | Card branco, 3 colunas: **Tempo** \| métrica principal (fonte maior) \| **Distância (km)**. |
| Métrica do meio | Corrida → Pace (min/km). Ciclismo → Velocidade média (km/h). |
| Dynamic Island | Compacto: logo + tempo. Expandido: header + título/subtítulo. |

Mapeamento enviado pelo service:
- `headerText` / `paused` / `timeText` / `primaryValue` / `primaryLabel` / `distanceText`
- `title` / `subtitle` ficam como fallback (Dynamic Island / layout legacy da lib)
- `deepLinkUrl: "movt://"` (toque no card abre o app)
- fundo do sistema `#FFFFFF` (o header pinta a cor da marca)

Sem `timeText`, o widget cai no layout original da lib (2 linhas).

## Passos para ativar / validar no device

1. `npm install` (aplica o patch automaticamente).
2. `npx expo prebuild --clean` — o plugin injeta o Widget Extension, assets e
   `NSSupportsLiveActivities`.
3. `eas build --platform ios --profile preview` — EAS assina app + LiveActivity +
   Notification Service.
4. Instalar no iPhone (link/QR) e validar (checklist abaixo).

## Nota sobre a dependência

O npm marca **todas** as versões de `expo-live-activity` como *deprecated* com a
mensagem genérica "Package no longer supported" — inclusive a alpha 0.5.0. É o
flag genérico do npm, **não** um abandono. Fixamos a versão **0.4.2** + patch.
Se subir a lib, reaplique / regenere o patch.

## Checklist de validação (iPhone físico, iOS 16.2+)

- [ ] Iniciar corrida → card com header verde "Corrida", logo MOVT e 3 colunas.
- [ ] Pace no centro (fonte maior); tempo à esquerda; distância à direita.
- [ ] Ciclismo → centro vira "Velocidade média" em km/h.
- [ ] Métricas atualizam com a tela **bloqueada**.
- [ ] Pausar → header amarelo "Em pausa automática"; Retomar → volta ao verde.
- [ ] Dynamic Island compacto mostra logo + tempo.
- [ ] Encerrar → card some.
- [ ] Relaunch do processo no meio do treino não cria card duplicado
      (`startWorkoutActivity` é idempotente).
- [ ] Tocar no card abre o app (deep link `movt://`).
