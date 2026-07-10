const { withAndroidManifest } = require("@expo/config-plugins");

// Amplia o android:configChanges do MainActivity para o SO tratar as mudanças de
// configuração EM RUNTIME em vez de destruir e recriar a Activity (o que faz o
// app passar pela splash de novo). O React Native lida com todas essas mudanças
// sem recriação; sem declará-las, eventos comuns ao bloquear/desbloquear a tela
// ou trocar de app (densidade, fontScale, teclado, navegação) matam a Activity.
//
// Base do template Expo + extras defensivos (smallestScreenSize, density,
// fontScale, navigation, touchscreen). Idempotente: sempre reescreve o atributo.
const CONFIG_CHANGES = [
  "keyboard",
  "keyboardHidden",
  "orientation",
  "screenSize",
  "screenLayout",
  "uiMode",
  "locale",
  "layoutDirection",
  "smallestScreenSize",
  "density",
  "fontScale",
  "navigation",
  "touchscreen",
].join("|");

module.exports = function withConfigChanges(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    const mainActivity = application?.activity?.find(
      (a) => a.$["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      mainActivity.$["android:configChanges"] = CONFIG_CHANGES;
    }

    return config;
  });
};
