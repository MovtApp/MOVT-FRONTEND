const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

let config = getDefaultConfig(__dirname);

// Apply NativeWind configuration
config = withNativeWind(config, { input: "./global.css" });

// Configure module resolver for aliases
config.resolver.alias = {
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
};

// Wrap with Reanimated configuration
config = wrapWithReanimatedMetroConfig(config);

module.exports = config;
