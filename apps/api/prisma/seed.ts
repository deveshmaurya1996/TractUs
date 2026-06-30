import "../src/load-env";
import { PrismaClient, ContractStatus } from "@prisma/client";

const prisma = new PrismaClient();

const organizations = [{ name: "Acme Corp" }, { name: "Globex Inc" }] as const;

const contracts = [
  // Acme Corp
  {
    orgIndex: 0,
    clientName: "John Doe",
    poRefNo: "ACME-PO-001",
    poDate: "2024-01-15",
    status: "DRAFT" as ContractStatus,
    fieldData: {
      client_name: "John Doe",
      po_ref_no: "ACME-PO-001",
      po_date: "2024-01-15",
      payment_terms: "Net 30",
      delivery_terms: "FOB",
      items: [
        { description: "Widget A", quantity: 10, unit_price: 29.99, total: 299.9 },
      ],
    },
  },
  {
    orgIndex: 0,
    clientName: "Jane Smith",
    poRefNo: "ACME-PO-002",
    poDate: "2024-02-20",
    status: "FINALIZED" as ContractStatus,
    fieldData: {
      client_name: "Jane Smith",
      po_ref_no: "ACME-PO-002",
      po_date: "2024-02-20",
      payment_terms: "Net 15",
      items: [
        { description: "Gadget B", quantity: 5, unit_price: 99.99, total: 499.95 },
      ],
    },
  },
  {
    orgIndex: 0,
    clientName: "Charlie Brown",
    poRefNo: "ACME-PO-003",
    poDate: "2024-04-25",
    status: "FINALIZED" as ContractStatus,
    fieldData: {
      client_name: "Charlie Brown",
      po_ref_no: "ACME-PO-003",
      po_date: "2024-04-25",
      delivery_terms: "CIF",
      items: [
        { description: "Equipment E", quantity: 2, unit_price: 499.99, total: 999.98 },
      ],
    },
  },
  {
    orgIndex: 0,
    clientName: "Diana Prince",
    poRefNo: "ACME-PO-004",
    poDate: "2023-09-12",
    status: "ARCHIVED" as ContractStatus,
    fieldData: {
      client_name: "Diana Prince",
      po_ref_no: "ACME-PO-004",
      po_date: "2023-09-12",
      payment_terms: "Net 45",
      items: [
        { description: "Supply Kit F", quantity: 20, unit_price: 12.5, total: 250 },
      ],
    },
  },
  {
    orgIndex: 0,
    clientName: "Ethan Hunt",
    poRefNo: "ACME-PO-005",
    poDate: "2024-05-10",
    status: "DRAFT" as ContractStatus,
    fieldData: {
      client_name: "Ethan Hunt",
      po_ref_no: "ACME-PO-005",
      po_date: "2024-05-10",
      delivery_terms: "EXW",
      items: [
        { description: "Sensor G", quantity: 8, unit_price: 75, total: 600 },
        { description: "Cable H", quantity: 50, unit_price: 4.5, total: 225 },
      ],
    },
  },
  {
    orgIndex: 0,
    clientName: "Fiona Green",
    poRefNo: "ACME-PO-006",
    poDate: "2024-03-01",
    status: "ARCHIVED" as ContractStatus,
    fieldData: {
      client_name: "Fiona Green",
      po_ref_no: "ACME-PO-006",
      po_date: "2024-03-01",
      items: [
        { description: "Office Chairs", quantity: 12, unit_price: 149.99, total: 1799.88 },
      ],
    },
  },
  // Globex Inc
  {
    orgIndex: 1,
    clientName: "Bob Johnson",
    poRefNo: "GLOBEX-PO-001",
    poDate: "2024-03-10",
    status: "DRAFT" as ContractStatus,
    fieldData: {
      client_name: "Bob Johnson",
      po_ref_no: "GLOBEX-PO-001",
      po_date: "2024-03-10",
      payment_terms: "Net 30",
      items: [
        { description: "Tool C", quantity: 25, unit_price: 15.5, total: 387.5 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "Alice Williams",
    poRefNo: "GLOBEX-PO-002",
    poDate: "2023-11-05",
    status: "ARCHIVED" as ContractStatus,
    fieldData: {
      client_name: "Alice Williams",
      po_ref_no: "GLOBEX-PO-002",
      po_date: "2023-11-05",
      items: [
        { description: "Part D", quantity: 100, unit_price: 1.99, total: 199.0 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "George Miller",
    poRefNo: "GLOBEX-PO-003",
    poDate: "2024-06-18",
    status: "FINALIZED" as ContractStatus,
    fieldData: {
      client_name: "George Miller",
      po_ref_no: "GLOBEX-PO-003",
      po_date: "2024-06-18",
      payment_terms: "Net 60",
      delivery_terms: "DDP",
      items: [
        { description: "Steel Beams", quantity: 15, unit_price: 320, total: 4800 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "Hannah Lee",
    poRefNo: "GLOBEX-PO-004",
    poDate: "2024-02-14",
    status: "DRAFT" as ContractStatus,
    fieldData: {
      client_name: "Hannah Lee",
      po_ref_no: "GLOBEX-PO-004",
      po_date: "2024-02-14",
      items: [
        { description: "Packaging Material", quantity: 200, unit_price: 3.25, total: 650 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "Ian Cooper",
    poRefNo: "GLOBEX-PO-005",
    poDate: "2024-07-02",
    status: "FINALIZED" as ContractStatus,
    fieldData: {
      client_name: "Ian Cooper",
      po_ref_no: "GLOBEX-PO-005",
      po_date: "2024-07-02",
      payment_terms: "Net 30",
      items: [
        { description: "Hydraulic Pump", quantity: 3, unit_price: 890, total: 2670 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "Julia Adams",
    poRefNo: "GLOBEX-PO-006",
    poDate: "2023-12-20",
    status: "ARCHIVED" as ContractStatus,
    fieldData: {
      client_name: "Julia Adams",
      po_ref_no: "GLOBEX-PO-006",
      po_date: "2023-12-20",
      delivery_terms: "FOB",
      items: [
        { description: "Control Panel", quantity: 4, unit_price: 1250, total: 5000 },
      ],
    },
  },
];

async function clearDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.organization.deleteMany();
}

async function seedContract(
  organizationId: string,
  seed: (typeof contracts)[number]
) {
  const contract = await prisma.contract.create({
    data: {
      organizationId,
      clientName: seed.clientName,
      poRefNo: seed.poRefNo,
      poDate: seed.poDate,
      status: seed.status,
      fieldData: seed.fieldData,
    },
  });

  await prisma.auditEvent.create({
    data: {
      contractId: contract.id,
      eventType: "contract.created",
      metadata: { contract },
    },
  });

  if (seed.status !== "DRAFT") {
    await prisma.auditEvent.create({
      data: {
        contractId: contract.id,
        eventType: "contract.status.changed",
        metadata: { oldStatus: "DRAFT", newStatus: seed.status },
      },
    });
  }
}

async function seedDatabase() {
  const orgs = await Promise.all(
    organizations.map((org) => prisma.organization.create({ data: org }))
  );

  for (const seed of contracts) {
    await seedContract(orgs[seed.orgIndex].id, seed);
  }

  const acmeCount = contracts.filter((c) => c.orgIndex === 0).length;
  const globexCount = contracts.filter((c) => c.orgIndex === 1).length;

  return {
    organizations: orgs.length,
    contracts: contracts.length,
    acmeCount,
    globexCount,
  };
}

async function main() {
  const force = process.argv.includes("--force");
  const expectedContracts = contracts.length;

  const [orgCount, contractCount] = await Promise.all([
    prisma.organization.count(),
    prisma.contract.count(),
  ]);

  if (!force && contractCount >= expectedContracts) {
    console.log(
      `Database already seeded (${orgCount} organizations, ${contractCount} contracts). Run with --force to reset and reseed.`
    );
    return;
  }

  if (force || orgCount > 0 || contractCount > 0) {
    console.log("Clearing existing data...");
    await clearDatabase();
  }

  const result = await seedDatabase();
  console.log(
    `Seeded ${result.organizations} organizations and ${result.contracts} contracts (${result.acmeCount} Acme Corp, ${result.globexCount} Globex Inc).`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
