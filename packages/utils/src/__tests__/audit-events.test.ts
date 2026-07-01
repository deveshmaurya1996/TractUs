import { describe, expect, it } from "vitest";
import type { AuditEvent, Contract, ContractFieldData } from "@tractus/types";
import {
  diffContractFieldData,
  findPreviousContractSnapshot,
  formatContractStatus,
  summarizeAuditEvent,
} from "../audit-events";

const baseFieldData: ContractFieldData = {
  client_name: "John Doe",
  po_ref_no: "ACME-PO-001",
  po_date: "2024-01-15",
  payment_terms: "Net 30",
  delivery_terms: "FOB",
  items: [
    {
      description: "Widget A",
      quantity: 10,
      unit_price: 29.99,
      total: 299.9,
    },
  ],
};

function makeContract(fieldData: ContractFieldData, overrides: Partial<Contract> = {}): Contract {
  return {
    id: "contract-1",
    organizationId: "org-1",
    clientName: fieldData.client_name,
    poRefNo: fieldData.po_ref_no,
    poDate: fieldData.po_date,
    fieldData,
    status: "DRAFT",
    createdAt: new Date("2026-06-30T12:46:42.508Z"),
    updatedAt: new Date("2026-06-30T12:46:42.508Z"),
    ...overrides,
  };
}

function makeEvent(
  eventType: string,
  metadata: Record<string, unknown>,
  id = "event-1"
): Pick<AuditEvent, "eventType" | "metadata"> {
  return { eventType, metadata };
}

describe("formatContractStatus", () => {
  it("formats workflow statuses for display", () => {
    expect(formatContractStatus("DRAFT")).toBe("Draft");
    expect(formatContractStatus("FINALIZED")).toBe("Finalized");
    expect(formatContractStatus("ARCHIVED")).toBe("Archived");
  });
});

describe("diffContractFieldData", () => {
  it("detects line item quantity and total changes", () => {
    const after: ContractFieldData = {
      ...baseFieldData,
      items: [
        {
          description: "Widget A",
          quantity: 50,
          unit_price: 29.99,
          total: 1499.5,
        },
      ],
    };

    const changes = diffContractFieldData(baseFieldData, after);
    const labels = changes.map((change) => change.label);

    expect(labels).toContain('Line item "Widget A" quantity');
    expect(labels).toContain('Line item "Widget A" total');

    const quantity = changes.find((change) => change.field.endsWith(".quantity"));
    expect(quantity).toMatchObject({ before: "10", after: "50" });
  });
});

describe("findPreviousContractSnapshot", () => {
  it("returns the next older contract-bearing event", () => {
    const created = makeContract(baseFieldData);
    const updatedFieldData = {
      ...baseFieldData,
      items: [{ ...baseFieldData.items[0], quantity: 50, total: 1499.5 }],
    };

    const events = [
      makeEvent("contract.updated", { contract: makeContract(updatedFieldData) }),
      makeEvent("contract.created", { contract: created }),
    ];

    const previous = findPreviousContractSnapshot(events, 0);
    expect(previous?.fieldData.items[0].quantity).toBe(10);
  });
});

describe("summarizeAuditEvent", () => {
  it("summarizes created events", () => {
    const summary = summarizeAuditEvent(
      makeEvent("contract.created", { contract: makeContract(baseFieldData) }),
      [],
      0
    );

    expect(summary.lines[0]).toBe(
      "Contract created for John Doe (PO ACME-PO-001) · 1 line item"
    );
  });

  it("summarizes update events using previousContract metadata", () => {
    const before = makeContract(baseFieldData);
    const afterFieldData = {
      ...baseFieldData,
      items: [{ ...baseFieldData.items[0], quantity: 50, total: 1499.5 }],
    };
    const after = makeContract(afterFieldData, {
      updatedAt: new Date("2026-07-01T13:34:06.368Z"),
    });

    const events = [
      makeEvent("contract.updated", {
        previousContract: before,
        contract: after,
      }),
      makeEvent("contract.created", { contract: before }),
    ];

    const summary = summarizeAuditEvent(events[0], events, 0);
    expect(summary.lines).toEqual([
      'Line item "Widget A" quantity: 10 → 50',
      'Line item "Widget A" total: $299.90 → $1499.50',
    ]);
  });

  it("summarizes status transitions", () => {
    const summary = summarizeAuditEvent(
      makeEvent("contract.status.changed", {
        oldStatus: "DRAFT",
        newStatus: "FINALIZED",
      }),
      [],
      0
    );

    expect(summary.lines[0]).toBe("Status changed: Draft → Finalized");
  });
});
