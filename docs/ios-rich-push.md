# Frente 4 — Foto na notificação do iOS (Notification Service Extension)

Faz a **foto** aparecer no push do iOS (avatar de quem interagiu, ou a imagem do
post) — paridade com o Android, onde a foto já funciona *out of the box*.

## Por que precisa de uma extensão

O iOS **ignora** URL de imagem no payload. Só uma **Notification Service Extension**
(NSE) pode interceptar a notificação, baixar o arquivo e anexá-lo antes de ela ser
exibida. É o que Instagram e WhatsApp fazem. O `expo-notifications` **não** traz esse
target — o `attachments` que ele expõe é só para notificação **local** (`Records.swift`
não trata `richContent`). Por isso o target é criado aqui, no `prebuild`, pelo config
plugin do [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets)
(v4.0.7, mantido, do Evan Bacon — Expo), **sem ejetar**.

## O que já está pronto

- `package.json` → `@bacons/apple-targets`; `app.json` → plugin na lista.
- `targets/notification-service/expo-target.config.js` → `type: "notification-service"`.
- `targets/notification-service/NotificationService.swift` → baixa e anexa a imagem.
- **Backend já manda `mutableContent: true`** junto do `richContent.image`
  (`services/pushService.js`). Sem esse flag o iOS **nem chama** a extensão. Ou seja:
  nada a mudar no backend.

## ⚠️ O ponto incerto: a chave do payload

O servidor do Expo Push traduz o nosso `richContent.image` para o payload do APNs,
mas **essa tradução não é documentada e não existe no SDK**. Evidência: no Android o
Expo nem usa chave própria — o `RemoteNotificationContent.kt:26` lê
`remoteMessage.notification?.imageUrl`, o campo **nativo do FCM**. No APNs não há
campo padrão equivalente (é justamente por isso que a NSE é necessária).

Em vez de fixar uma chave no chute, o Swift **procura** a URL:
`richContent.image` → `body.richContent.image` → `data.richContent.image` → `image`
→ `body.image` → `data.image`, e por fim varre o payload (profundidade ≤ 3) atrás de
uma chave com "image" cujo valor seja uma URL http(s).

**Se nada for encontrado, a notificação é entregue sem foto — ela nunca some.**

### Como ter certeza da chave (recomendado no 1º teste)

No app já buildado, o listener de push expõe o payload cru do APNs no iOS. Adicione
temporariamente em `usePushNotifications.ts`, dentro do `addNotificationReceivedListener`:

```ts
if (__DEV__) console.log("APNS payload:", JSON.stringify(notification.request.trigger, null, 2));
```

Mande um push com imagem, leia o log e confirme onde a URL aparece. Se for um caminho
que a busca já cobre, ótimo — não muda nada. Se for outro, é uma linha no array
`candidates` do Swift.

## Passos para ativar

1. `npm install`
2. `npx expo prebuild -p ios --clean` — o plugin injeta o target no Xcode.
3. `eas build --platform ios` — o EAS cria/assina o bundle id da extensão
   (`com.dsvmTechnology.movtapp.NotificationService`). Precisa da conta Apple
   Developer configurada (Team `Tiago Matsukura`).
4. Instalar no iPhone físico e validar (checklist abaixo).

## Riscos assumidos (leia antes de mergear)

- **Mexe num build iOS que hoje funciona.** Um target novo muda assinatura e
  provisioning. Por isso isto está num PR **separado** — dá para reverter sem levar
  junto o resto das notificações (PR #10).
- **Nada aqui foi compilado.** Swift não compila no Windows; o `prebuild` não foi
  rodado. O que está verificado é só: o config carrega, e `app.json`/`package.json`
  seguem válidos.
- A extensão **degrada com elegância**: se a busca falhar, se o download falhar, ou
  se estourar o tempo (~30 s), a notificação chega **sem imagem** — não some.
- Convive com o `useFrameworks: "static"` (do fix do RNFirebase) e com a
  `expo-live-activity`, que também cria target — **não validado juntos**.

## Checklist de validação (iPhone físico)

- [ ] Receber uma **curtida** → foto de quem curtiu aparece na notificação.
- [ ] Receber uma **mensagem** → foto de quem mandou aparece.
- [ ] Receber um **post de quem você segue** → a **imagem do post** aparece.
- [ ] **Ocultar prévia** ligado → mensagem chega **sem** a foto (por design).
- [ ] Usuário **sem avatar** → notificação chega normal, só sem imagem.
- [ ] URL de imagem quebrada → notificação chega sem imagem (não some, não trava).
- [ ] O build iOS **continua passando** e o app abre normalmente.
