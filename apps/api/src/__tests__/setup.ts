import "../load-env";
import { afterAll, beforeEach } from "vitest";
import prisma from "../lib/prisma";

function resolveTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  return base.replace(/\/([^/?]+)(\?|$)/, "/tractus_test$2");
}

process.env.DATABASE_URL = resolveTestDatabaseUrl();

async function resetTestDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.organization.deleteMany();
}

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
