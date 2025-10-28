// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import typescriptParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      "dist/*",
      ".expo/*",
      "node_modules/*",
      "android/*",
      "ios/*",
      ".vscode/*",
      ".idea/*",
      "*.config.js",
      "*.config.cjs",
    ],
  },
  {
    files: ["metro.config.cjs"],
    languageOptions: {
      globals: { __dirname: true },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "prettier/prettier": "error",
      "import/no-unresolved": ["error", { commonjs: true, amd: true }],
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: true,
      },
    },
  },
]);
