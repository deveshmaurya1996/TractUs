import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContractFieldData } from "@tractus/types";
import {
  createContract,
  deleteContract,
  updateContract,
  updateContractStatus,
} from "../lib/contracts-api";

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useCreateContract(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      callbacks?.onSuccess?.();
    },
    onError: () => {
      callbacks?.onError?.();
    },
  });
}

export function useDeleteContract(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId: string }) =>
      deleteContract(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      callbacks?.onSuccess?.();
    },
    onError: () => {
      callbacks?.onError?.();
    },
  });
}

export function useUpdateContractStatus(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      organizationId,
      status,
    }: {
      id: string;
      organizationId: string;
      status: string;
    }) => updateContractStatus(id, organizationId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({
        queryKey: ["contract", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["events", variables.id],
      });
      callbacks?.onSuccess?.();
    },
    onError: () => {
      callbacks?.onError?.();
    },
  });
}

export function useUpdateContract(
  id: string,
  organizationId: string | undefined,
  callbacks?: MutationCallbacks
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fieldData: ContractFieldData }) => {
      if (!organizationId) {
        throw new Error("Organization is required");
      }
      return updateContract(id, organizationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      callbacks?.onSuccess?.();
    },
    onError: () => {
      callbacks?.onError?.();
    },
  });
}
