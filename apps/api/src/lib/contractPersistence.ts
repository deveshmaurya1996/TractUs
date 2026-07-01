import type { Prisma } from "@prisma/client";
import type { ContractFieldData } from "@tractus/types";
import { parseContractFieldData } from "@tractus/validation";

export function toPrismaFieldData(fieldData: ContractFieldData): Prisma.InputJsonValue {
  const parsed = parseContractFieldData(fieldData);
  return JSON.parse(JSON.stringify(parsed));
}

export function buildContractCreateInput(
  organizationId: string,
  fieldData: ContractFieldData,
  contentHash: string
): Prisma.ContractUncheckedCreateInput {
  const parsed = parseContractFieldData(fieldData);

  return {
    organizationId,
    clientName: parsed.client_name,
    poRefNo: parsed.po_ref_no,
    poDate: parsed.po_date,
    fieldData: toPrismaFieldData(parsed),
    contentHash,
  };
}

export function buildContractUpdateInput(
  fieldData: ContractFieldData,
  contentHash: string
): Prisma.ContractUncheckedUpdateInput {
  const parsed = parseContractFieldData(fieldData);

  return {
    clientName: parsed.client_name,
    poRefNo: parsed.po_ref_no,
    poDate: parsed.po_date,
    fieldData: toPrismaFieldData(parsed),
    contentHash,
  };
}
