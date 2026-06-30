import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const apiRoot = path.resolve(__dirname, "..");
const monorepoRoot = path.resolve(apiRoot, "../..");
const rootEnv = path.join(monorepoRoot, ".env");
const localEnv = path.join(apiRoot, ".env");

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}

if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv, override: true });
}
