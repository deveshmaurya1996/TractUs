import { useQuery } from "@tanstack/react-query";
import { fetchOrganizations } from "../lib/organizations-api";
import { queryKeys } from "./query-keys";

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations,
    queryFn: fetchOrganizations,
  });
}
