import type { ContractStatus } from "@tractus/types";
import { format } from "date-fns";

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(date: Date): string {
  return format(date, "MMM d, yyyy, h:mm a");
}

export function getStatusColor(
  status: ContractStatus
): "default" | "primary" | "success" | "error" | "warning" | "info" {
  switch (status) {
    case "DRAFT":
      return "default";
    case "FINALIZED":
      return "success";
    case "ARCHIVED":
      return "warning";
    default:
      return "default";
  }
}

export function getStatusActionColor(
  status: ContractStatus
): "primary" | "success" | "warning" | "error" | "info" {
  const color = getStatusColor(status);
  return color === "default" ? "primary" : color;
}

export { getNextStatus, getStatusActionLabel } from "./status";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
