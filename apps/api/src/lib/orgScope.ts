import type { Request } from "express";
import { z } from "zod";
import prisma from "./prisma";
import type { Contract, ContractFieldData, ContractStatus } from "@tractus/types";

export const OrganizationIdQuerySchema = z.object({
  organizationId: z.string().uuid(),
});

export function parseOrganizationId(req: Request): string {
  const result = OrganizationIdQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new OrgScopeError("organizationId query parameter is required");
  }
  return result.data.organizationId;
}

export class OrgScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrgScopeError";
  }
}

export function toContract(record: {
  id: string;
  organizationId: string;
  clientName: string;
  poRefNo: string;
  poDate: string;
  fieldData: unknown;
  status: ContractStatus;
  deletedAt: Date | null;
  pdfFileName?: string | null;
  pdfSize?: number | null;
  createdAt: Date;
  updatedAt: Date;
}): Contract {
  return {
    ...record,
    fieldData: record.fieldData as ContractFieldData,
    pdfFileName: record.pdfFileName ?? null,
    pdfSize: record.pdfSize ?? null,
  };
}

export async function findContractForOrg(
  id: string,
  organizationId: string
): Promise<Contract | null> {
  const contract = await prisma.contract.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  return contract ? toContract(contract) : null;
}

export const notDeleted = { deletedAt: null };
