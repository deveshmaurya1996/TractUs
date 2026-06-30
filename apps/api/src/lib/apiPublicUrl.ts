import type { Request } from "express";

export const DEFAULT_API_PUBLIC_URL = "http://localhost:3001";

export function normalizeApiPublicUrl(url: string): string {
  return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export function resolveApiPublicUrl(req: Request): string {
  const fromEnv = process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
  if (fromEnv) {
    return normalizeApiPublicUrl(fromEnv);
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host");
  if (host) {
    return `${protocol}://${host}`;
  }

  return DEFAULT_API_PUBLIC_URL;
}
