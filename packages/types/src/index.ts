export type ContractStatus = "DRAFT" | "FINALIZED" | "ARCHIVED";

export interface ContractItem {
  description: string;
  quantity: number;
  quantity_unit?: string;
  unit_price: number;
  pricing_unit?: string;
  total?: number;
}

export interface ContractFieldData {
  client_name: string;
  po_ref_no: string;
  po_date: string;
  payment_terms?: string;
  delivery_terms?: string;
  items: ContractItem[];
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  organizationId: string;
  clientName: string;
  poRefNo: string;
  poDate: string;
  fieldData: ContractFieldData;
  status: ContractStatus;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  contractId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: ContractStatus;
  organizationId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateContractRequest {
  organizationId: string;
  fieldData: ContractFieldData;
}

export interface UpdateContractRequest {
  fieldData: ContractFieldData;
}

export interface UpdateStatusRequest {
  status: ContractStatus;
}
