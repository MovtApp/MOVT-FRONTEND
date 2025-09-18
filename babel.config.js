module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@assets": "./src/assets",
            "@components": "./src/components",
            "@config": "./src/config",
            "@contexts": "./src/contexts",
            "@hooks": "./src/hooks",
            "@lib": "./src/lib",
            "@routes": "./src/routes",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@styles": "./src/styles",
          },
        },
      ],
      "react-native-reanimated/plugin", // Manter este plugin
    ],
  };
};