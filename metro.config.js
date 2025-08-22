const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

let config = getDefaultConfig(__dirname);

// Apply NativeWind configuration
config = withNativeWind(config, { input: "./src/styles/global.css" });

// Wrap with Reanimated configuration
config = wrapWithReanimatedMetroConfig(config);

module.exports = config;
