# Fase 3 — Live Activity do treino no iOS (ActivityKit)

Card do treino na **tela de bloqueio** + **Dynamic Island** (iOS 16.1+), atualizado
ao vivo durante corrida/ciclismo. Paridade com o card do Android (Fase 2).

> **Status:** app-side PRONTO e cablado (`src/services/liveActivityService.ts` +
> fiação no `locationTrackingService.ts`, tudo no-op até o módulo nativo existir).
> A parte nativa abaixo **precisa de Mac + Xcode + conta Apple** e ainda NÃO foi
> feita — está bloqueada pelo setup Apple pendente (ver memória `ios-parity-work`).
> **Nada aqui afeta os builds atuais** (Android/iOS) enquanto o módulo não existe.

## Contrato já definido pelo app (não mudar sem alinhar o JS)

O JS chama `MOVTLiveActivity.{isSupported,start,update,end}` com este payload
(`LiveActivityData` em `liveActivityService.ts`) — o `ContentState` do Swift deve
casar 1:1:

| campo       | tipo    | ex.          |
|-------------|---------|--------------|
| `type`      | String  | "Corrida"    |
| `distance`  | String  | "3,21"       |
| `time`      | String  | "18:45"      |
| `pace`      | String  | "5:50 /km"   |
| `paceLabel` | String  | "pace"/"km/h"|
| `paused`    | Bool    | false        |

Ciclo de vida (já disparado pelo tracker): `start` no início do treino, `update`
throttled (~2 s) a partir da task de GPS — **inclusive com a tela bloqueada** — e
`end` no Encerrar. `start` deve ser **idempotente** (se já houver Activity, dar
update em vez de criar outra) para o caso de relaunch do processo.

## Passos da implementação nativa

1. **Recomendado: avaliar `expo-live-activity`** (ou similar mantido) antes de
   hand-roll. O pedaço frágil é o config plugin que injeta o Widget Extension no
   Xcode — uma lib madura evita isso. Se não servir, seguir manual (abaixo).

2. **Widget Extension (SwiftUI)** — novo target `MOVTWidgets`:
   - `WorkoutAttributes: ActivityAttributes` com `ContentState` = os 6 campos acima.
   - `WorkoutLiveActivity: Widget` com `ActivityConfiguration`:
     - Lock screen / banner: distância (destaque) + tempo + pace/`paceLabel`; selo
       "Pausado" quando `paused`. Cor de marca `#BBF246` sobre fundo `#192126`.
     - Dynamic Island: `compactLeading` = ícone (🏃/🚴), `compactTrailing` = tempo;
       `expanded` = as 3 métricas.
   - `@available(iOS 16.1, *)` em tudo.

3. **Módulo nativo** `MOVTLiveActivity` (Expo Module Swift ou RN bridge) expondo:
   - `isSupported` → `ActivityAuthorizationInfo().areActivitiesEnabled`.
   - `start(data)` → `Activity.request(attributes:contentState:)` (guardar o handle;
     se já existir, faz `update`).
   - `update(data)` → `activity.update(using:)`.
   - `end()` → `activity.end(dismissalPolicy: .immediate)`.
   - Tudo atrás de `if #available(iOS 16.1, *)`; no-op abaixo disso.

4. **Config plugin** `plugins/withLiveActivity.js` (rodar no prebuild):
   - Adiciona o target do Widget Extension ao `.pbxproj` (ou usa o da lib).
   - `Info.plist` do app: `NSSupportsLiveActivities = true`.
   - Registra o plugin no `app.json` (array `plugins`).

5. **Info.plist** (via plugin): `NSSupportsLiveActivities` = `YES`.

## Notas de confiabilidade

- Updates a partir do app rodando em background dependem do `UIBackgroundModes:
  location` (já presente no `app.json`). Para robustez em background profundo,
  ActivityKit suporta **push updates (APNs)** — opcional numa v2.
- Não há como validar isto sem device iOS: **rodar em iPhone físico** (Live
  Activities não aparecem no simulador de forma confiável) após `eas build`.

## Checklist de validação (device iOS)

- [ ] Iniciar corrida → card aparece na tela de bloqueio e no Dynamic Island.
- [ ] km/tempo/pace atualizam ao vivo com a tela **bloqueada**.
- [ ] Pausar → selo "Pausado"; Retomar → some.
- [ ] Encerrar → card some.
- [ ] Relaunch do processo no meio do treino não cria Activity duplicada.
