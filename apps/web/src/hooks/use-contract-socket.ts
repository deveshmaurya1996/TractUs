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

    socket.on("contract.updated", refresh);
    socket.on("contract.status.changed", refresh);
    return () => {
      socket.off("contract.updated", refresh);
      socket.off("contract.status.changed", refresh);
    };
  }, [queryClient, id]);
}
