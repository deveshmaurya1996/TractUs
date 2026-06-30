import "../src/load-env";
import { PrismaClient, ContractStatus } from "@prisma/client";

const prisma = new PrismaClient();

const organizations = [{ name: "Acme Corp" }, { name: "Globex Inc" }] as const;

const contracts = [
  {
    orgIndex: 0,
    clientName: "John Doe",
    poRefNo: "PO-001",
    poDate: "2024-01-15",
    status: "DRAFT" as ContractStatus,
    fieldData: {
      client_name: "John Doe",
      po_ref_no: "PO-001",
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
    poRefNo: "PO-002",
    poDate: "2024-02-20",
    status: "FINALIZED" as ContractStatus,
    fieldData: {
      client_name: "Jane Smith",
      po_ref_no: "PO-002",
      po_date: "2024-02-20",
      payment_terms: "Net 15",
      items: [
        { description: "Gadget B", quantity: 5, unit_price: 99.99, total: 499.95 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "Bob Johnson",
    poRefNo: "PO-003",
    poDate: "2024-03-10",
    status: "DRAFT" as ContractStatus,
    fieldData: {
      client_name: "Bob Johnson",
      po_ref_no: "PO-003",
      po_date: "2024-03-10",
      items: [
        { description: "Tool C", quantity: 25, unit_price: 15.5, total: 387.5 },
      ],
    },
  },
  {
    orgIndex: 1,
    clientName: "Alice Williams",
    poRefNo: "PO-004",
    poDate: "2023-11-05",
    status: "ARCHIVED" as ContractStatus,
    fieldData: {
      client_name: "Alice Williams",
      po_ref_no: "PO-004",
      po_date: "2023-11-05",
      items: [
        { description: "Part D", quantity: 100, unit_price: 1.99, total: 199.0 },
      ],
    },
  },
  {
    orgIndex: 0,
    clientName: "Charlie Brown",
    poRefNo: "PO-005",
    poDate: "2024-04-25",
    status: "FINALIZED" as ContractStatus,
    fieldData: {
      client_name: "Charlie Brown",
      po_ref_no: "PO-005",
      po_date: "2024-04-25",
      delivery_terms: "CIF",
      items: [
        { description: "Equipment E", quantity: 2, unit_price: 499.99, total: 999.98 },
      ],
    },
  },
];

async function clearDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.organization.deleteMany();
}

async function seedDatabase() {
  const orgs = await Promise.all(
    organizations.map((org) => prisma.organization.create({ data: org }))
  );

  for (const seed of contracts) {
    const contract = await prisma.contract.create({
      data: {
        organizationId: orgs[seed.orgIndex].id,
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

  return { organizations: orgs.length, contracts: contracts.length };
}

async function main() {
  const force = process.argv.includes("--force");

  const existingOrgs = await prisma.organization.count();
  if (existingOrgs > 0 && !force) {
    console.log("Database already has data — skipping seed. Run with --force to reset and reseed.");
    return;
  }

  if (force) {
    console.log("Clearing existing data...");
    await clearDatabase();
  }

  const result = await seedDatabase();
  console.log(
    `Seeded ${result.organizations} organizations and ${result.contracts} contracts with audit events.`
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
