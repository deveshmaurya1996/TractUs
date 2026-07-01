import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
      callbacks?.onSuccess?.(organization.id);
    },
    onError: callbacks?.onError,
  });
}
