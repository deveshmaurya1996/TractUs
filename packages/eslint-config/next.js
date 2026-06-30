module.exports = {
  extends: ["plugin:@next/next/recommended", "prettier"],
  plugins: ["only-warn"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
};
