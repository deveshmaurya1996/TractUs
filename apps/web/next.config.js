const path = require("path");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(path.join(__dirname, "../.."));
loadEnvConfig(__dirname);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@tractus/ui",
    "@tractus/utils",
    "@tractus/types",
    "@tractus/validation",
  ],
};

module.exports = nextConfig;
