/**
 * withInstagramStories — visibilidade de pacote (Android 11+) para compartilhar
 * nos Stories do Instagram via react-native-share.
 *
 * No Android 11+, para iniciar uma Activity de outro app (o Instagram) o nosso
 * app precisa declarar `<queries>` com o pacote alvo; sem isso o sistema "esconde"
 * o Instagram e o share falha. (No iOS o LSApplicationQueriesSchemes fica no
 * app.json.)
 */
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withInstagramStories(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!Array.isArray(manifest.queries)) manifest.queries = [];

    const alreadyDeclared = manifest.queries.some(
      (q) =>
        Array.isArray(q.package) &&
        q.package.some((p) => p.$ && p.$["android:name"] === "com.instagram.android")
    );

    if (!alreadyDeclared) {
      manifest.queries.push({
        package: [{ $: { "android:name": "com.instagram.android" } }],
      });
    }

    return config;
  });
};
