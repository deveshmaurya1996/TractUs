import { z } from "zod";

export const ContractStatusSchema = z.enum(["DRAFT", "FINALIZED", "ARCHIVED"]);

export const ContractItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  quantity_unit: z.string().optional(),
  unit_price: z.number().min(0, "Unit price must be non-negative"),
  pricing_unit: z.string().optional(),
  total: z.number().optional(),
});

export const ContractFieldDataSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  po_ref_no: z.string().min(1, "PO reference number is required"),
  po_date: z.string().refine((date) => /^\d{4}-\d{2}-\d{2}$/.test(date), {
    message: "PO date must be in YYYY-MM-DD format",
  }),
  payment_terms: z.string().optional(),
  delivery_terms: z.string().optional(),
  items: z.array(ContractItemSchema).min(1, "At least one item is required"),
});

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
