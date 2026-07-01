import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../lib/socket";

const CONTRACT_LIST_EVENTS = [
  "contract.created",
  "contract.updated",
  "contract.deleted",
  "contract.status.changed",
] as const;

export function useContractsSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    };

    CONTRACT_LIST_EVENTS.forEach((event) => socket.on(event, invalidate));
    return () => {
      CONTRACT_LIST_EVENTS.forEach((event) => socket.off(event, invalidate));
    };
  }, [queryClient]);
}

export function useContractSocket(id: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
    };

    const onDeleted = (payload: { id?: string }) => {
      if (payload?.id !== id) return;
      queryClient.removeQueries({ queryKey: ["contract", id] });
      queryClient.removeQueries({ queryKey: ["events", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    };

    socket.on("contract.updated", refresh);
    socket.on("contract.status.changed", refresh);
    socket.on("contract.deleted", onDeleted);
    return () => {
      socket.off("contract.updated", refresh);
      socket.off("contract.status.changed", refresh);
      socket.off("contract.deleted", onDeleted);
    };
  }, [queryClient, id]);
}
