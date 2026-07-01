import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import prisma from "../lib/prisma";
import {
  assertNoDuplicateContract,
  DuplicateContractError,
  hashContractFieldData,
} from "../lib/contractDuplicates";
import { backfillContractContentHashes } from "../lib/backfillContentHash";
import { toPrismaFieldData } from "../lib/contractPersistence";
import type { ContractFieldData } from "@tractus/types";

const app = createApp();

const sampleFieldData: ContractFieldData = {
  client_name: "Test Client",
  po_ref_no: "PO-TEST-001",
  po_date: "2024-06-01",
  items: [
    {
      description: "Test item",
      quantity: 1,
      unit_price: 10,
      pricing_unit: "USD",
    },
  ],
};

async function insertContract(
  organizationId: string,
  fieldData: ContractFieldData,
  overrides: { poRefNo?: string; contentHash?: string } = {}
) {
  return prisma.contract.create({
    data: {
      organizationId,
      clientName: fieldData.client_name,
      poRefNo: overrides.poRefNo ?? fieldData.po_ref_no,
      poDate: fieldData.po_date,
      fieldData: toPrismaFieldData(fieldData),
      contentHash: overrides.contentHash ?? hashContractFieldData(fieldData),
    },
  });
}

describe("contractDuplicates", () => {
  let orgA: string;

  beforeEach(async () => {
    const org = await prisma.organization.create({ data: { name: "Org A" } });
    orgA = org.id;
  });

  it("returns a stable sha256 hash for normalized field data", () => {
    const first = hashContractFieldData(sampleFieldData);
    const second = hashContractFieldData({
      ...sampleFieldData,
      items: [{ ...sampleFieldData.items[0] }],
    });

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it("changes the hash when contract content changes", () => {
    const base = hashContractFieldData(sampleFieldData);
    const changed = hashContractFieldData({
      ...sampleFieldData,
      client_name: "Different Client",
    });

    expect(changed).not.toBe(base);
  });

  it("detects duplicate content when poRefNo column was changed manually", async () => {
    await insertContract(orgA, sampleFieldData, { poRefNo: "PO-LEGACY-999" });

    await expect(
      prisma.$transaction((tx) =>
        assertNoDuplicateContract(tx, orgA, sampleFieldData)
      )
    ).rejects.toMatchObject({
      name: "DuplicateContractError",
      reason: "content",
    } satisfies Partial<DuplicateContractError>);
  });

  it("rejects duplicate content via the create API", async () => {
    await insertContract(orgA, sampleFieldData, { poRefNo: "PO-LEGACY-999" });

    const res = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("identical");
    expect(res.body.errors).toContain("content");
  });

  it("rejects duplicate content on PATCH", async () => {
    const sharedContent: ContractFieldData = {
      ...sampleFieldData,
      client_name: "Shared Client",
      po_ref_no: "PO-SHARED-CONTENT",
    };
    const existing = await insertContract(orgA, sharedContent, {
      poRefNo: "PO-LEGACY-COLUMN",
    });

    const draft = await request(app)
      .post("/api/contracts")
      .send({
        organizationId: orgA,
        fieldData: {
          ...sampleFieldData,
          po_ref_no: "PO-EDIT-001",
        },
      });
    expect(draft.status).toBe(201);

    const duplicate = await request(app)
      .patch(`/api/contracts/${draft.body.data.id}`)
      .query({ organizationId: orgA })
      .send({ fieldData: sharedContent });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.errors).toContain("content");
    expect(duplicate.body.data.existingContractId).toBe(existing.id);
  });

  it("backfills empty contentHash values from fieldData", async () => {
    const contract = await insertContract(orgA, sampleFieldData, {
      contentHash: "",
    });

    await backfillContractContentHashes();

    const updated = await prisma.contract.findUniqueOrThrow({
      where: { id: contract.id },
      select: { contentHash: true },
    });

    expect(updated.contentHash).toBe(hashContractFieldData(sampleFieldData));
  });
});
