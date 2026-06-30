import { z } from "zod";

export const ContractStatusSchema = z.enum(["DRAFT", "FINALIZED", "ARCHIVED"]);

function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  return value;
}

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional()
);

const optionalTotal = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const num = Number(value);
  return typeof num === "number" && !isNaN(num) ? num : undefined;
}, z.number().optional());

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export const ContractItemSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    quantity_unit: optionalString,
    unit_price: z.coerce.number().min(0, "Unit price must be non-negative"),
    pricing_unit: optionalString,
    total: optionalTotal,
  })
  .strict()
  .transform((item) => ({
    ...item,
    total: calculateItemTotal(item.quantity, item.unit_price),
  }));

export const ContractFieldDataSchema = z
  .object({
    client_name: z.string().min(1, "Client name is required"),
    po_ref_no: z.string().min(1, "PO reference number is required"),
    po_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "PO date must be in YYYY-MM-DD format"),
    payment_terms: optionalString,
    delivery_terms: optionalString,
    items: z.array(ContractItemSchema).min(1, "At least one item is required"),
  })
  .strict();

export type ParsedContractFieldData = z.infer<typeof ContractFieldDataSchema>;
export type ParsedContractItem = z.infer<typeof ContractItemSchema>;

export const CreateContractSchema = z.object({
  organizationId: z.string().uuid(),
  fieldData: ContractFieldDataSchema,
});

export const UpdateContractSchema = z.object({
  fieldData: ContractFieldDataSchema,
});

export const UpdateStatusSchema = z.object({
  status: ContractStatusSchema,
});

export const SearchContractsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: ContractStatusSchema.optional(),
  organizationId: z.string().uuid(),
});

export const OrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export function parseContractFieldData(data: unknown): ParsedContractFieldData {
  return ContractFieldDataSchema.parse(data);
}
