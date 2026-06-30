import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContractFieldData } from "@tractus/types";
import {
  createContract,
  deleteContract,
  updateContract,
  updateContractStatus,
  uploadContractPdf,
} from "../lib/contracts-api";

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useCreateContract(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      organizationId: string;
      fieldData: ContractFieldData;
      pdfFile?: File;
    }) => {
      const result = await createContract(vars);
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to create contract");
      }

      if (vars.pdfFile) {
        const pdfResult = await uploadContractPdf(
          result.data.id,
          vars.organizationId,
          vars.pdfFile
        );
        if (!pdfResult.success) {
          throw new Error(
            pdfResult.message || "Contract created but PDF upload failed"
          );
        }
        return pdfResult;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      callbacks?.onSuccess?.();
    },
    onError: (error) => {
      callbacks?.onError?.(error);
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
    onError: (error) => {
      callbacks?.onError?.(error);
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
    onError: (error) => {
      callbacks?.onError?.(error);
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
    onError: (error) => {
      callbacks?.onError?.(error);
    },
  });
}

export function useUploadContractPdf(
  id: string,
  organizationId: string | undefined,
  callbacks?: MutationCallbacks
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      if (!organizationId) {
        throw new Error("Organization is required");
      }
      return uploadContractPdf(id, organizationId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      callbacks?.onSuccess?.();
    },
    onError: (error) => {
      callbacks?.onError?.(error);
    },
  });
}
