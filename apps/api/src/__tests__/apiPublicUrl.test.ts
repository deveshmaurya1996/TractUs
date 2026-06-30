import { describe, expect, it, vi, afterEach } from "vitest";
import type { Request } from "express";
import {
  DEFAULT_API_PUBLIC_URL,
  normalizeApiPublicUrl,
  resolveApiPublicUrl,
} from "../lib/apiPublicUrl";

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    protocol: "http",
    get(name: string) {
      if (name === "host") return "203.0.113.10:3001";
      if (name === "x-forwarded-proto") return undefined;
      if (name === "x-forwarded-host") return undefined;
      return undefined;
    },
    ...overrides,
  } as Request;
}

describe("resolveApiPublicUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes API_PUBLIC_URL", () => {
    vi.stubEnv("API_PUBLIC_URL", "https://api.example.com/api/");
    expect(resolveApiPublicUrl(mockRequest())).toBe("https://api.example.com");
  });

  it("falls back to NEXT_PUBLIC_SOCKET_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SOCKET_URL", "http://203.0.113.10:3001");
    expect(resolveApiPublicUrl(mockRequest())).toBe("http://203.0.113.10:3001");
  });

  it("derives URL from the request when env is unset", () => {
    vi.stubEnv("API_PUBLIC_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SOCKET_URL", "");
    expect(resolveApiPublicUrl(mockRequest())).toBe("http://203.0.113.10:3001");
  });

  it("honours X-Forwarded headers", () => {
    vi.stubEnv("API_PUBLIC_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SOCKET_URL", "");
    const req = mockRequest({
      get(name: string) {
        if (name === "x-forwarded-proto") return "https";
        if (name === "x-forwarded-host") return "api.example.com";
        return undefined;
      },
    } as Partial<Request>);
    expect(resolveApiPublicUrl(req)).toBe("https://api.example.com");
  });

  it("uses default when host is missing", () => {
    vi.stubEnv("API_PUBLIC_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SOCKET_URL", "");
    const req = mockRequest({
      get() {
        return undefined;
      },
    } as Partial<Request>);
    expect(resolveApiPublicUrl(req)).toBe(DEFAULT_API_PUBLIC_URL);
  });
});

describe("normalizeApiPublicUrl", () => {
  it("strips trailing slashes and /api suffix", () => {
    expect(normalizeApiPublicUrl("http://localhost:3001/")).toBe(
      "http://localhost:3001"
    );
    expect(normalizeApiPublicUrl("http://localhost:3001/api")).toBe(
      "http://localhost:3001"
    );
  });
});
