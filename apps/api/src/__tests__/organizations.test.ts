import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import prisma from "../lib/prisma";

const app = createApp();

describe("Organizations API", () => {
  beforeEach(async () => {
    await prisma.auditEvent.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.organization.deleteMany();
  });

  afterEach(async () => {
    await prisma.auditEvent.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.organization.deleteMany();
  });

  it("lists organizations", async () => {
    await prisma.organization.create({ data: { name: "Acme Corp" } });

    const res = await request(app).get("/api/organizations");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Acme Corp");
  });

  it("creates an organization", async () => {
    const res = await request(app)
      .post("/api/organizations")
      .send({ name: "Globex Inc" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Globex Inc");
    expect(res.body.data.id).toBeDefined();

    const listed = await request(app).get("/api/organizations");
    expect(listed.body.data).toHaveLength(1);
  });

  it("rejects empty organization name", async () => {
    const res = await request(app).post("/api/organizations").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
