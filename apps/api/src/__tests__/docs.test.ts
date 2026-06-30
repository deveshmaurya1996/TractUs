import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("API docs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("serves pretty-printed OpenAPI JSON", async () => {
    const res = await request(app).get("/api/openapi.json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.openapi).toMatch(/^3\.0\./);
    expect(res.body.paths["/api/organizations"]).toBeDefined();
    expect(res.body.paths["/api/contracts"]).toBeDefined();
    expect(res.body.paths["/api/contracts/{id}/pdf"]).toBeDefined();
    expect(res.body.components.schemas.ApiErrorResponse).toBeDefined();
    expect(res.body.servers[0].url).toBeTruthy();
  });

  it("uses API_PUBLIC_URL for the OpenAPI server when set", async () => {
    vi.stubEnv("API_PUBLIC_URL", "https://api.example.com/api/");

    const res = await request(app).get("/api/openapi.json");

    expect(res.body.servers[0].url).toBe("https://api.example.com");
  });

  it("serves Swagger UI at /api/docs", async () => {
    const res = await request(app).get("/api/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("swagger");
  });
});
