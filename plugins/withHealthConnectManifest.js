const { withAndroidManifest, withMainActivity } = require("@expo/config-plugins");

module.exports = function withHealthConnectManifest(config) {
  // Apply AndroidManifest modifications
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    const mainActivity = application.activity.find((a) => a.$["android:name"] === ".MainActivity");

    if (mainActivity) {
      if (!mainActivity["intent-filter"]) {
        mainActivity["intent-filter"] = [];
      }

      // Adicionar intent obrigatório do Android 14 para o Health Connect
      const hasRationaleIntent = mainActivity["intent-filter"].some(
        (filter) =>
          filter.action &&
          filter.action.some(
            (a) => a.$["android:name"] === "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE"
          )
      );

      if (!hasRationaleIntent) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" } }],
        });
      }

      // A intenção VIEW_PERMISSION_USAGE
      const hasUsageIntent = mainActivity["intent-filter"].some(
        (filter) =>
          filter.action &&
          filter.action.some(
            (a) => a.$["android:name"] === "android.intent.action.VIEW_PERMISSION_USAGE"
          )
      );

      if (!hasUsageIntent) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.VIEW_PERMISSION_USAGE" } }],
          category: [{ $: { "android:name": "android.intent.category.HEALTH_PERMISSIONS" } }],
        });
      }
    }

    // Fix for Android 14 Foreground Service Type crashes
    if (application.service) {
      application.service.forEach((svc) => {
        if (!svc.$["android:foregroundServiceType"]) {
          // Add default foregroundServiceType for BLE or other services
          svc.$["android:foregroundServiceType"] = "connectedDevice|location";
        }
      });
    }

    return config;
  });

  // Apply MainActivity modifications to register HealthConnectPermissionDelegate
  config = withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Add import if not exists
    const importStr = "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate";
    if (!contents.includes(importStr)) {
      contents = contents.replace(
        "class MainActivity : ReactActivity() {",
        `${importStr}\n\nclass MainActivity : ReactActivity() {`
      );
    }

    // 2. Add setPermissionDelegate inside onCreate if not exists
    const delegateStr = "HealthConnectPermissionDelegate.setPermissionDelegate(this)";
    if (!contents.includes(delegateStr)) {
      if (contents.includes("super.onCreate(")) {
        contents = contents.replace(
          /super\.onCreate\(.*\)/,
          `$&` + `\n    ${delegateStr}`
        );
      } else {
        contents = contents.replace(
          "override fun onCreate(savedInstanceState: Bundle?) {",
          `override fun onCreate(savedInstanceState: Bundle?) {\n    ${delegateStr}`
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
};

