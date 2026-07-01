import type { ContractStatus } from "@tractus/types";

const STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus | null> = {
  DRAFT: "FINALIZED",
  FINALIZED: "ARCHIVED",
  ARCHIVED: null,
};

export function getNextStatus(currentStatus: ContractStatus): ContractStatus | null {
  return STATUS_TRANSITIONS[currentStatus] ?? null;
}

const STATUS_ACTION_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Draft",
  FINALIZED: "Finalize",
  ARCHIVED: "Archive",
};

export function getStatusActionLabel(status: ContractStatus): string {
  return STATUS_ACTION_LABELS[status];
}
