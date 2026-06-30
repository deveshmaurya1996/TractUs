module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier", "turbo"],
  plugins: ["@typescript-eslint", "only-warn"],
  env: {
    node: true,
  },
};
