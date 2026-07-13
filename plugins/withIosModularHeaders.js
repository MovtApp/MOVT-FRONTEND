const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Fix iOS: @react-native-firebase (v24) + use_frameworks (static, exigido pelo
 * Firebase) faz o Xcode tratar includes de headers NÃO-MODULARES do React-Core
 * como erro:
 *   include of non-modular header inside framework module 'RNFBApp...'
 *   [-Werror,-Wnon-modular-include-in-framework-module]
 *
 * Como não há pasta ios/ commitada (prebuild/CNG), o Podfile é gerado no build.
 * Este plugin aplica as DUAS correções conhecidas, de forma idempotente:
 *
 *  1. `$RNFirebaseAsStaticFramework = true` (fix OFICIAL do react-native-firebase
 *     para use_frameworks) — antes do primeiro `target`, faz o RNFirebase compilar
 *     como static framework e resolve os módulos.
 *  2. `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` no post_install
 *     para todos os targets dos Pods — libera os includes não-modulares restantes.
 *
 * Só iOS, sem efeito no Android.
 */
module.exports = function withIosModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");

      // 1) Global do RNFirebase (antes do primeiro `target ... do`).
      if (!contents.includes("$RNFirebaseAsStaticFramework")) {
        contents = contents.replace(
          /^(target\s+['"].*['"]\s+do)/m,
          "$RNFirebaseAsStaticFramework = true\n\n$1"
        );
      }

      // 2) Build setting no post_install (belt & suspenders).
      if (!contents.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        const snippet = [
          "",
          "    installer.pods_project.targets.each do |target|",
          "      target.build_configurations.each do |bc|",
          "        bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'",
          "      end",
          "    end",
          "",
        ].join("\n");
        contents = contents.replace(/post_install do \|installer\|\n/, (m) => m + snippet);
      }

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
