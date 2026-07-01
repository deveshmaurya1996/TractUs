import { API_BASE_URL } from "@tractus/utils";
import type { ApiResponse, Organization } from "@tractus/types";

export function fetchOrganizations(): Promise<ApiResponse<Organization[]>> {
  return fetch(`${API_BASE_URL}/organizations`).then((res) => res.json());
}

export function createOrganization(name: string): Promise<ApiResponse<Organization>> {
  return fetch(`${API_BASE_URL}/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((res) => res.json());
}
