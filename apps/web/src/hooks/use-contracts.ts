import type { GridPaginationModel } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAuditEvents,
  fetchContract,
  fetchContracts,
} from "../lib/contracts-api";
import { queryKeys } from "./query-keys";

export function useContracts(params: {
  organizationId?: string;
  paginationModel: GridPaginationModel;
  search: string;
  statusFilter: string;
}) {
  const { organizationId, paginationModel, search, statusFilter } = params;

  return useQuery({
    queryKey: queryKeys.contracts({
      paginationModel,
      search,
      statusFilter,
      organizationId,
    }),
    queryFn: () =>
      fetchContracts({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search,
        status: statusFilter,
        organizationId: organizationId!,
      }),
    enabled: !!organizationId,
  });
}

export function useContract(id: string, organizationId?: string) {
  return useQuery({
    queryKey: queryKeys.contract(id, organizationId),
    queryFn: () => fetchContract(id, organizationId!),
    enabled: !!organizationId,
  });
}

export function useAuditEvents(id: string, organizationId?: string) {
  return useQuery({
    queryKey: queryKeys.events(id, organizationId),
    queryFn: () => fetchAuditEvents(id, organizationId!),
    enabled: !!organizationId,
  });
}
