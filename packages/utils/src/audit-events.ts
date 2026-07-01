import type {
  AuditEvent,
  Contract,
  ContractFieldData,
  ContractItem,
  ContractStatus,
} from "@tractus/types";

export interface AuditFieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

const CONTRACT_SNAPSHOT_EVENT_TYPES = new Set([
  "contract.created",
  "contract.updated",
  "contract.deleted",
]);

const STATUS_DISPLAY: Record<ContractStatus, string> = {
  DRAFT: "Draft",
  FINALIZED: "Finalized",
  ARCHIVED: "Archived",
};

const EVENT_LABELS: Record<string, string> = {
  "contract.created": "Created",
  "contract.updated": "Updated",
  "contract.status.changed": "Status Changed",
  "contract.deleted": "Deleted",
  "contract.pdf.uploaded": "PDF Uploaded",
};

export function getAuditEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function formatContractStatus(status: ContractStatus | string): string {
  return STATUS_DISPLAY[status as ContractStatus] ?? String(status);
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function itemTotal(item: ContractItem): number {
  return item.total ?? item.quantity * item.unit_price;
}

function isContract(value: unknown): value is Contract {
  return (
    typeof value === "object" &&
    value !== null &&
    "fieldData" in value &&
    typeof (value as Contract).fieldData === "object"
  );
}

function getContractFromMetadata(
  metadata: Record<string, unknown>,
  key: "contract" | "previousContract"
): Contract | null {
  const value = metadata[key];
  return isContract(value) ? value : null;
}

export function findPreviousContractSnapshot(
  events: Pick<AuditEvent, "eventType" | "metadata">[],
  index: number
): Contract | null {
  for (let i = index + 1; i < events.length; i += 1) {
    const event = events[i];
    if (!CONTRACT_SNAPSHOT_EVENT_TYPES.has(event.eventType)) continue;
    const contract = getContractFromMetadata(event.metadata, "contract");
    if (contract) return contract;
  }
  return null;
}

function pushChange(
  changes: AuditFieldChange[],
  field: string,
  label: string,
  before: string,
  after: string
) {
  if (before === after) return;
  changes.push({ field, label, before, after });
}

function formatOptional(value: string | undefined, empty = "—"): string {
  return value?.trim() ? value : empty;
}

export function diffContractFieldData(
  before: ContractFieldData,
  after: ContractFieldData
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];

  pushChange(
    changes,
    "client_name",
    "Client name",
    before.client_name,
    after.client_name
  );
  pushChange(changes, "po_ref_no", "PO reference", before.po_ref_no, after.po_ref_no);
  pushChange(changes, "po_date", "PO date", before.po_date, after.po_date);
  pushChange(
    changes,
    "payment_terms",
    "Payment terms",
    formatOptional(before.payment_terms),
    formatOptional(after.payment_terms)
  );
  pushChange(
    changes,
    "delivery_terms",
    "Delivery terms",
    formatOptional(before.delivery_terms),
    formatOptional(after.delivery_terms)
  );

  const maxItems = Math.max(before.items.length, after.items.length);
  for (let index = 0; index < maxItems; index += 1) {
    const beforeItem = before.items[index];
    const afterItem = after.items[index];
    const lineLabel = (item: ContractItem | undefined, position: number) =>
      item?.description?.trim()
        ? `Line item "${item.description}"`
        : `Line item ${position + 1}`;

    if (!beforeItem && afterItem) {
      changes.push({
        field: `items.${index}`,
        label: lineLabel(afterItem, index),
        before: "—",
        after: "added",
      });
      continue;
    }

    if (beforeItem && !afterItem) {
      changes.push({
        field: `items.${index}`,
        label: lineLabel(beforeItem, index),
        before: "present",
        after: "removed",
      });
      continue;
    }

    if (!beforeItem || !afterItem) continue;

    const prefix = lineLabel(afterItem, index);

    pushChange(
      changes,
      `items.${index}.description`,
      `${prefix} description`,
      beforeItem.description,
      afterItem.description
    );
    pushChange(
      changes,
      `items.${index}.quantity`,
      `${prefix} quantity`,
      String(beforeItem.quantity),
      String(afterItem.quantity)
    );
    pushChange(
      changes,
      `items.${index}.unit_price`,
      `${prefix} unit price`,
      formatMoney(beforeItem.unit_price),
      formatMoney(afterItem.unit_price)
    );
    pushChange(
      changes,
      `items.${index}.total`,
      `${prefix} total`,
      formatMoney(itemTotal(beforeItem)),
      formatMoney(itemTotal(afterItem))
    );
  }

  return changes;
}

function formatChangeLine(change: AuditFieldChange): string {
  if (change.after === "added") {
    return `${change.label} added`;
  }
  if (change.after === "removed") {
    return `${change.label} removed`;
  }
  return `${change.label}: ${change.before} → ${change.after}`;
}

export function summarizeAuditEvent(
  event: Pick<AuditEvent, "eventType" | "metadata">,
  events: Pick<AuditEvent, "eventType" | "metadata">[],
  index: number
): { lines: string[] } {
  switch (event.eventType) {
    case "contract.created": {
      const contract = getContractFromMetadata(event.metadata, "contract");
      if (!contract) {
        return { lines: ["Contract created"] };
      }
      const itemCount = contract.fieldData.items.length;
      const itemLabel = itemCount === 1 ? "1 line item" : `${itemCount} line items`;
      return {
        lines: [
          `Contract created for ${contract.clientName} (PO ${contract.poRefNo}) · ${itemLabel}`,
        ],
      };
    }
    case "contract.updated": {
      const current = getContractFromMetadata(event.metadata, "contract");
      const previous =
        getContractFromMetadata(event.metadata, "previousContract") ??
        findPreviousContractSnapshot(events, index);

      if (!current) {
        return { lines: ["Contract fields updated"] };
      }

      if (!previous) {
        return { lines: ["Contract fields updated"] };
      }

      const changes = diffContractFieldData(previous.fieldData, current.fieldData);
      if (changes.length === 0) {
        return { lines: ["Contract fields updated"] };
      }

      return { lines: changes.map(formatChangeLine) };
    }
    case "contract.status.changed": {
      const oldStatus = event.metadata.oldStatus as ContractStatus | undefined;
      const newStatus = event.metadata.newStatus as ContractStatus | undefined;
      if (!oldStatus || !newStatus) {
        return { lines: ["Contract status changed"] };
      }
      return {
        lines: [
          `Status changed: ${formatContractStatus(oldStatus)} → ${formatContractStatus(newStatus)}`,
        ],
      };
    }
    case "contract.deleted": {
      const contract = getContractFromMetadata(event.metadata, "contract");
      if (!contract) {
        return { lines: ["Contract deleted"] };
      }
      return {
        lines: [
          `Contract deleted while in ${formatContractStatus(contract.status)} status`,
        ],
      };
    }
    case "contract.pdf.uploaded": {
      const fileName =
        typeof event.metadata.fileName === "string" ? event.metadata.fileName : "file";
      const size =
        typeof event.metadata.size === "number"
          ? ` (${(event.metadata.size / 1024).toFixed(1)} KB)`
          : "";
      return { lines: [`PDF attached: ${fileName}${size}`] };
    }
    default:
      return { lines: [getAuditEventLabel(event.eventType)] };
  }
}
