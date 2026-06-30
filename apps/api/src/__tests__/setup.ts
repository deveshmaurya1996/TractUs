import "../load-env";

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
