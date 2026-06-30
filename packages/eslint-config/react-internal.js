module.exports = {
  extends: ["plugin:react/recommended", "plugin:react/jsx-runtime", "prettier"],
  plugins: ["only-warn"],
  settings: { react: { version: "detect" } },
  env: {
    browser: true,
    es2021: true,
  },
};
