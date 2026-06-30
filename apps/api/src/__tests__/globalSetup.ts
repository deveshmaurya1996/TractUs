import { execSync } from "child_process";
import path from "path";

export default function globalSetup() {
  const apiRoot = path.resolve(__dirname, "../..");
  execSync("tsx scripts/ensure-test-db.ts", {
    cwd: apiRoot,
    stdio: "inherit",
    env: process.env,
  });
}


