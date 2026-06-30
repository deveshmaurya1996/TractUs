import { API_BASE_URL } from "@tractus/utils";
import type {
  ApiResponse,
  Contract,
  PaginatedResponse,
} from "@tractus/types";
import type { ContractFieldData } from "@tractus/types";

function orgQuery(organizationId: string): string {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export function fetchContracts(params: {
  page: number;
  limit: number;
  organizationId: string;
  search?: string;
  status?: string;
}): Promise<ApiResponse<PaginatedResponse<Contract>>> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", params.page.toString());
  searchParams.set("limit", params.limit.toString());
  searchParams.set("organizationId", params.organizationId);
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  return fetch(`${API_BASE_URL}/contracts?${searchParams.toString()}`).then(
    (res) => res.json()
  );
}

export function fetchContract(
  id: string,
  organizationId: string
): Promise<ApiResponse<Contract>> {
  return fetch(`${API_BASE_URL}/contracts/${id}?${orgQuery(organizationId)}`).then(
    (res) => res.json()
  );
}

export function createContract(data: {
  organizationId: string;
  fieldData: ContractFieldData;
}): Promise<ApiResponse<Contract>> {
  return fetch(`${API_BASE_URL}/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

export function updateContract(
  id: string,
  organizationId: string,
  data: { fieldData: ContractFieldData }
): Promise<ApiResponse<Contract>> {
  return fetch(`${API_BASE_URL}/contracts/${id}?${orgQuery(organizationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

export function deleteContract(
  id: string,
  organizationId: string
): Promise<ApiResponse> {
  return fetch(`${API_BASE_URL}/contracts/${id}?${orgQuery(organizationId)}`, {
    method: "DELETE",
  }).then((res) => res.json());
}

export function updateContractStatus(
  id: string,
  organizationId: string,
  status: string
): Promise<ApiResponse<Contract>> {
  return fetch(`${API_BASE_URL}/contracts/${id}/status?${orgQuery(organizationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((res) => res.json());
}

export function fetchAuditEvents(
  id: string,
  organizationId: string
): Promise<ApiResponse<import("@tractus/types").AuditEvent[]>> {
  return fetch(`${API_BASE_URL}/contracts/${id}/events?${orgQuery(organizationId)}`).then(
    (res) => res.json()
  );
}
