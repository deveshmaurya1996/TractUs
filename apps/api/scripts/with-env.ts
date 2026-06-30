import "../src/load-env";
import { execSync } from "child_process";
import path from "path";

const apiRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2).join(" ");

execSync(`prisma ${args}`, {
  stdio: "inherit",
  cwd: apiRoot,
  env: process.env,
});
