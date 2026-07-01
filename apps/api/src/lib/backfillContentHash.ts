import prisma from "./prisma";
import { hashContractFieldData } from "./contractDuplicates";
import { parseContractFieldData } from "@tractus/validation";

export async function backfillContractContentHashes(): Promise<number> {
  const contracts = await prisma.contract.findMany({
    where: { contentHash: "" },
    select: { id: true, fieldData: true },
  });

  for (const contract of contracts) {
    const contentHash = hashContractFieldData(
      parseContractFieldData(contract.fieldData)
    );
    await prisma.contract.update({
      where: { id: contract.id },
      data: { contentHash },
    });
  }

  return contracts.length;
}
