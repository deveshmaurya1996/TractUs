import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const apiRoot = path.resolve(__dirname, "../..");

describe("production build output", () => {
  it("emits dist/index.js for the start script", () => {
    const distDir = path.join(apiRoot, "dist");
    rmSync(distDir, { recursive: true, force: true });

    execSync("pnpm exec tsc -p tsconfig.build.json", {
      cwd: apiRoot,
      stdio: "pipe",
    });

    expect(existsSync(path.join(distDir, "index.js"))).toBe(true);
  });
});
