// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier", "@rocketseat/eslint-config/react"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json", // Certifique-se de que o caminho para o tsconfig está correto
      },
    },
  },
};
