import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import prisma from "../lib/prisma";

const app = createApp();

const sampleFieldData = {
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

describe("Contracts API", () => {
  let orgA: string;
  let orgB: string;

  beforeEach(async () => {
    await prisma.auditEvent.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.organization.deleteMany();

    const [a, b] = await Promise.all([
      prisma.organization.create({ data: { name: "Org A" } }),
      prisma.organization.create({ data: { name: "Org B" } }),
    ]);
    orgA = a.id;
    orgB = b.id;
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.$disconnect();
  });

  it("creates a contract with valid JSON", async () => {
    const res = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clientName).toBe("Test Client");
    expect(res.body.data.status).toBe("DRAFT");
  });

  it("rejects invalid contract JSON", async () => {
    const res = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: { client_name: "" } });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects camelCase pricingUnit in items (JSON key must be pricing_unit)", async () => {
    const res = await request(app)
      .post("/api/contracts")
      .send({
        organizationId: orgA,
        fieldData: {
          ...sampleFieldData,
          items: [
            {
              description: "Test item",
              quantity: 1,
              unit_price: 10,
              pricingUnit: "USD",
            },
          ],
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("stores optional pricing_unit on items using schema JSON key", async () => {
    const res = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    expect(res.status).toBe(201);
    expect(res.body.data.fieldData.items[0]).toMatchObject({
      description: "Test item",
      quantity: 1,
      unit_price: 10,
      pricing_unit: "USD",
      total: 10,
    });
  });

  it("auto-calculates item total when omitted from JSON", async () => {
    const res = await request(app)
      .post("/api/contracts")
      .send({
        organizationId: orgA,
        fieldData: {
          client_name: "Calc Client",
          po_ref_no: "PO-CALC-001",
          po_date: "2024-06-01",
          items: [{ description: "Widget", quantity: 10, unit_price: 29.99 }],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.fieldData.items[0].total).toBe(299.9);
  });

  it("scopes contracts to organization", async () => {
    const created = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    const contractId = created.body.data.id;

    const wrongOrg = await request(app)
      .get(`/api/contracts/${contractId}`)
      .query({ organizationId: orgB });

    expect(wrongOrg.status).toBe(404);

    const correctOrg = await request(app)
      .get(`/api/contracts/${contractId}`)
      .query({ organizationId: orgA });

    expect(correctOrg.status).toBe(200);
  });

  it("enforces status workflow with 409 on invalid transition", async () => {
    const created = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    const contractId = created.body.data.id;

    const invalid = await request(app)
      .patch(`/api/contracts/${contractId}/status`)
      .query({ organizationId: orgA })
      .send({ status: "ARCHIVED" });

    expect(invalid.status).toBe(409);

    const finalize = await request(app)
      .patch(`/api/contracts/${contractId}/status`)
      .query({ organizationId: orgA })
      .send({ status: "FINALIZED" });

    expect(finalize.status).toBe(200);
    expect(finalize.body.data.status).toBe("FINALIZED");
  });

  it("supports search, filter, and pagination", async () => {
    await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    await request(app).post("/api/contracts").send({
      organizationId: orgA,
      fieldData: {
        ...sampleFieldData,
        client_name: "Other Client",
        po_ref_no: "PO-OTHER",
      },
    });

    const search = await request(app)
      .get("/api/contracts")
      .query({ organizationId: orgA, search: "Test Client", page: 1, limit: 10 });

    expect(search.status).toBe(200);
    expect(search.body.data.total).toBe(1);
    expect(search.body.data.data[0].clientName).toBe("Test Client");

    const paginated = await request(app)
      .get("/api/contracts")
      .query({ organizationId: orgA, page: 1, limit: 1 });

    expect(paginated.body.data.data).toHaveLength(1);
    expect(paginated.body.data.total).toBe(2);
  });

  it("records audit events on create and status change", async () => {
    const created = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    const contractId = created.body.data.id;

    await request(app)
      .patch(`/api/contracts/${contractId}/status`)
      .query({ organizationId: orgA })
      .send({ status: "FINALIZED" });

    const events = await request(app)
      .get(`/api/contracts/${contractId}/events`)
      .query({ organizationId: orgA });

    expect(events.status).toBe(200);
    expect(events.body.data.length).toBeGreaterThanOrEqual(2);
    expect(events.body.data.some((e: { eventType: string }) => e.eventType === "contract.created")).toBe(true);
    expect(events.body.data.some((e: { eventType: string }) => e.eventType === "contract.status.changed")).toBe(true);
  });

  it("only allows deleting draft contracts", async () => {
    const created = await request(app)
      .post("/api/contracts")
      .send({ organizationId: orgA, fieldData: sampleFieldData });

    const contractId = created.body.data.id;

    await request(app)
      .patch(`/api/contracts/${contractId}/status`)
      .query({ organizationId: orgA })
      .send({ status: "FINALIZED" });

    const deleteRes = await request(app)
      .delete(`/api/contracts/${contractId}`)
      .query({ organizationId: orgA });

    expect(deleteRes.status).toBe(409);
  });
});
