import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, Organization } from "@tractus/types";
import { createOrganization } from "../lib/organizations-api";
import { queryKeys } from "./query-keys";

interface MutationCallbacks {
  onSuccess?: (organizationId: string) => void;
  onError?: (error: unknown) => void;
}

export function useCreateOrganization(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createOrganization(name);
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to create organization");
      }
      return result.data;
    },
    onSuccess: (organization) => {
      queryClient.setQueryData<ApiResponse<Organization[]>>(
        queryKeys.organizations,
        (prev) => {
          if (!prev?.data) return prev;
          if (prev.data.some((org) => org.id === organization.id)) return prev;
          return { ...prev, data: [...prev.data, organization] };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
      callbacks?.onSuccess?.(organization.id);
    },
    onError: callbacks?.onError,
  });
}
