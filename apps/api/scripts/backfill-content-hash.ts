import "../src/load-env";
import prisma from "../src/lib/prisma";
import { backfillContractContentHashes } from "../src/lib/backfillContentHash";

async function main() {
  const count = await backfillContractContentHashes();
  if (count > 0) {
    console.log(`Backfilled contentHash for ${count} contract(s)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
