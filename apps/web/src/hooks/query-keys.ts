import type { GridPaginationModel } from "@mui/x-data-grid";

export const queryKeys = {
  organizations: ["organizations"] as const,
  contracts: (filters: {
    paginationModel: GridPaginationModel;
    search: string;
    statusFilter: string;
    organizationId?: string;
  }) => ["contracts", filters] as const,
  contract: (id: string, organizationId?: string) =>
    ["contract", id, organizationId] as const,
  events: (id: string, organizationId?: string) =>
    ["events", id, organizationId] as const,
};
