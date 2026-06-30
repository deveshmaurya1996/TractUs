import "../src/load-env";
import { execSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";

const apiRoot = path.resolve(__dirname, "..");

function resolveTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error("DATABASE_URL is required to derive the test database URL");
  }

  return base.replace(/\/([^/?]+)(\?|$)/, "/tractus_test$2");
}

async function ensureDatabaseExists(testUrl: string): Promise<void> {
  const adminUrl = testUrl.replace(/\/([^/?]+)(\?|$)/, "/postgres$2");
  const admin = new PrismaClient({
    datasources: { db: { url: adminUrl } },
  });

  try {
    const dbName = new URL(testUrl.replace(/^postgresql:/, "http:")).pathname.slice(1);
    const rows = await admin.$queryRawUnsafe<{ exists: boolean }[]>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      dbName
    );

    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`Created test database: ${dbName}`);
    }
  } finally {
    await admin.$disconnect();
  }
}

async function main() {
  const testUrl = resolveTestDatabaseUrl();
  await ensureDatabaseExists(testUrl);

  execSync("npx prisma db push --skip-generate", {
    cwd: apiRoot,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });

  console.log(`Test database ready: ${testUrl}`);
}

main().catch((error) => {
  console.error("Failed to prepare test database:", error);
  process.exit(1);
});
