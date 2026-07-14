export default function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          extensions: [".ts", ".tsx", ".jsx", ".js", ".json"],
          alias: {
            "@styles": "./src/styles",
            "@assets": "./src/assets",
            "@components": "./src/components",
            "@contexts": "./src/contexts",
            "@hooks": "./src/hooks",
            "@routes": "./src/routes",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@theme": "./src/theme",
            "@typings": "./src/@types",
            "@utils": "./src/utils",
            "@": "./src",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
    env: {
      // Em builds de produção (expo export / EAS release), remove os console.*
      // do bundle para não vazar PII (chat, auth, perfil) no logcat nem gastar
      // CPU/string-building em runtime. Mantém error/warn — o Sentry os captura.
      production: {
        plugins: [
          ["transform-remove-console", { exclude: ["error", "warn"] }],
        ],
      },
    },
  };
};
