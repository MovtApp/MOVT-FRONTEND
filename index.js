import { registerRootComponent } from "expo";
import { Buffer } from "buffer";
import App from "./App"; // eslint-disable-line import/no-unresolved
global.Buffer = Buffer; // eslint-disable-line import/no-unresolved

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
