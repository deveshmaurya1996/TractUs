import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { parseContractFieldData } from "@tractus/validation";
import type { ContractFieldData } from "@tractus/types";

export type DuplicateContractReason = "po_ref" | "content";

export class DuplicateContractError extends Error {
  readonly reason: DuplicateContractReason;
  readonly existingContractId: string;

  constructor(
    message: string,
    reason: DuplicateContractReason,
    existingContractId: string
  ) {
    super(message);
    this.name = "DuplicateContractError";
    this.reason = reason;
    this.existingContractId = existingContractId;
  }
}

export function hashContractFieldData(fieldData: ContractFieldData): string {
  const normalized = parseContractFieldData(fieldData);
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function activeContractWhere(
  organizationId: string,
  excludeContractId: string | undefined,
  match: { poRefNo: string } | { contentHash: string }
): Prisma.ContractWhereInput {
  if (excludeContractId) {
    return {
      organizationId,
      deletedAt: null,
      id: { not: excludeContractId },
      ...match,
    };
  }

  return {
    organizationId,
    deletedAt: null,
    ...match,
  };
}

export async function assertNoDuplicateContract(
  tx: Prisma.TransactionClient,
  organizationId: string,
  fieldData: ContractFieldData,
  excludeContractId?: string
): Promise<string> {
  const contentHash = hashContractFieldData(fieldData);

  const duplicatePoRef = await tx.contract.findFirst({
    where: activeContractWhere(organizationId, excludeContractId, {
      poRefNo: fieldData.po_ref_no,
    }),
    select: { id: true },
  });

  if (duplicatePoRef) {
    throw new DuplicateContractError(
      `A contract with PO reference "${fieldData.po_ref_no}" already exists for this organization`,
      "po_ref",
      duplicatePoRef.id
    );
  }

  const duplicateContent = await tx.contract.findFirst({
    where: activeContractWhere(organizationId, excludeContractId, {
      contentHash,
    }),
    select: { id: true },
  });

  if (duplicateContent) {
    throw new DuplicateContractError(
      "A contract with identical data already exists for this organization",
      "content",
      duplicateContent.id
    );
  }

  return contentHash;
}
