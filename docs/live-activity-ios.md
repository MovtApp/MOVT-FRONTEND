# Fase 3 — Live Activity do treino no iOS (expo-live-activity)

Card do treino na **tela de bloqueio** + **Dynamic Island** (iOS 16.2+), atualizado
ao vivo durante corrida/ciclismo. Paridade com o card do Android (Fase 2).

Feito via **[`expo-live-activity`](https://github.com/software-mansion-labs/expo-live-activity)**
(Software Mansion) — o config plugin da lib cria o Widget Extension no Xcode
automaticamente durante o `prebuild`, então **não escrevemos SwiftUI**.

> **Dá para fechar tudo do Windows** (sem Mac): o build iOS roda nos Macs da nuvem
> do **EAS Build**. O que ainda é obrigatório: **conta Apple Developer** (assinatura)
> e um **iPhone físico (16.2+)** para testar Live Activity (não funciona confiável
> no simulador).

## O que já está no repo (este PR)

- `package.json` → dependência `expo-live-activity`.
- `app.json` → plugin `"expo-live-activity"` na lista de `plugins`.
- `src/services/liveActivityService.ts` → wrapper que mapeia o snapshot do treino
  para o `LiveActivityState` (schema fixo: `title`/`subtitle` + `config` de cores).
  Guardado por plataforma/try-catch → **no-op em Android e em iOS antes do build**.
- `src/services/locationTrackingService.ts` → já dispara start/update/end no ciclo
  do treino (update throttled a partir da task de GPS, roda mesmo bloqueado).

Mapeamento atual (schema fixo da lib 0.4.2 — `progressBar` só tem `date`/`progress`,
sem timer de contagem; por isso o tempo vai como texto, atualizado a cada ~2 s):
- `title`  = "🏃 3,21 km" (ícone + distância)
- `subtitle` = "18:45 · 5:50 /km" (+ " · pausado" quando pausado)
- cores de marca via `config` (fundo #192126, título branco, subtítulo #BBF246),
  `deepLinkUrl: "movt://"` (toque no card abre o app).

## Passos para ativar (quem tiver a conta Apple)

1. `npm install` (instala a `expo-live-activity` já declarada).
2. `npx expo prebuild --clean` — o plugin injeta o Widget Extension e liga
   `NSSupportsLiveActivities` no Info.plist.
3. `eas build --platform ios` — o EAS guia a assinatura da nova extensão (precisa da
   conta Apple Developer configurada no projeto).
4. Instalar no iPhone (TestFlight/ad-hoc) e validar (checklist abaixo).

## Ajustes opcionais (depois do 1º funcionar)

- **Ícone/imagem** no card: `imageName`/`dynamicIslandImageName` no state + arquivo em
  `assets/liveActivity` (≤ 4 KB). Hoje não usamos imagem.
- **Push updates (APNs)** para atualização mais confiável em background profundo:
  plugin `["expo-live-activity", { "enablePushNotifications": true }]` +
  `addActivityTokenListener`. Não necessário para a v1 (atualizamos com o app vivo
  em background via `UIBackgroundModes: location`, já presente).

## Nota sobre a dependência

O npm marca **todas** as versões de `expo-live-activity` como *deprecated* com a
mensagem genérica "Package no longer supported" — inclusive a alpha 0.5.0 recém
publicada. É o flag genérico do npm, **não** um abandono: o repo (Software Mansion,
mesma dona de reanimated/gesture-handler/screens que já usamos) foi atualizado em
2026-06. Se preferir não depender de pacote marcado assim, a alternativa é **vendar**
(copiar) o módulo para dentro do repo. Fixamos a versão **0.4.2** (última estável).

## Checklist de validação (iPhone físico, iOS 16.2+)

- [ ] Iniciar corrida → card aparece na tela de bloqueio e no Dynamic Island.
- [ ] Distância/tempo/pace atualizam com a tela **bloqueada**.
- [ ] Pausar → "· pausado" no subtítulo; Retomar → some.
- [ ] Encerrar → card some.
- [ ] Relaunch do processo no meio do treino não cria card duplicado
      (`startWorkoutActivity` é idempotente).
- [ ] Tocar no card abre o app (deep link `movt://`).
