/**
 * Notification Service Extension — faz a FOTO aparecer no push do iOS.
 *
 * O iOS ignora URL de imagem no payload: só um NSE pode baixar o arquivo e
 * anexá-lo antes de a notificação ser exibida. O `expo-notifications` NÃO traz
 * esse target (o `attachments` dele é só p/ notificação local), então ele é
 * criado aqui pelo config plugin do `@bacons/apple-targets` durante o prebuild
 * — sem ejetar.
 *
 * O backend já manda `mutableContent: true` junto do `richContent.image`; sem
 * esse flag o iOS nem chama esta extensão.
 *
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: "notification-service",
  displayName: "MOVT Notification Service",
  // Igual ao alvo do app (Expo SDK 54). Extensão não pode exigir iOS mais novo
  // que o app, senão o build reclama.
  deploymentTarget: "15.1",
};
