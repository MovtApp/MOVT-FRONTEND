const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = function withNdkVersion(config, ndkVersion) {
  // If no ndkVersion is passed, use a sensible default (27.1.12297006)
  const targetVersion = typeof ndkVersion === "string" ? ndkVersion : "27.1.12297006";

  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    const extBlockStr = `ext {\n        ndkVersion = "${targetVersion}"\n    }`;
    if (!contents.includes("ndkVersion =")) {
      contents = contents.replace(
        "buildscript {",
        `buildscript {\n    ${extBlockStr}`
      );
    } else {
      contents = contents.replace(
        /ndkVersion = .*/,
        `ndkVersion = "${targetVersion}"`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
