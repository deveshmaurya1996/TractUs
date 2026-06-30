import type { OpenAPIV3 } from "openapi-types";
import {
  DEFAULT_API_PUBLIC_URL,
  normalizeApiPublicUrl,
} from "../lib/apiPublicUrl";

const organizationIdParam: OpenAPIV3.ParameterObject = {
  name: "organizationId",
  in: "query",
  required: true,
  description: "Organization UUID. Obtain from GET /api/organizations.",
  schema: { type: "string", format: "uuid" },
};

const contractIdParam: OpenAPIV3.ParameterObject = {
  name: "id",
  in: "path",
  required: true,
  description: "Contract UUID",
  schema: { type: "string", format: "uuid" },
};

const error400: OpenAPIV3.ResponseObject = {
  description: "Bad request — missing organizationId, validation error, or missing PDF",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiErrorResponse" },
      examples: {
        missingOrgId: {
          value: {
            success: false,
            message: "organizationId query parameter is required",
          },
        },
        validation: {
          value: {
            success: false,
            message: "fieldData.client_name: Client name is required",
            errors: [
              {
                code: "too_small",
                minimum: 1,
                type: "string",
                inclusive: true,
                exact: false,
                message: "Client name is required",
                path: ["fieldData", "client_name"],
              },
            ],
          },
        },
        missingPdf: {
          value: { success: false, message: "PDF file is required" },
        },
      },
    },
  },
};

const error404: OpenAPIV3.ResponseObject = {
  description: "Resource not found",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiErrorResponse" },
      example: { success: false, message: "Contract not found" },
    },
  },
};

const error409: OpenAPIV3.ResponseObject = {
  description: "Conflict — invalid status transition or non-draft mutation",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiErrorResponse" },
      examples: {
        editNonDraft: {
          value: { success: false, message: "Only draft contracts can be edited" },
        },
        invalidTransition: {
          value: {
            success: false,
            message: "Invalid status transition from DRAFT to ARCHIVED",
          },
        },
      },
    },
  },
};

const error500: OpenAPIV3.ResponseObject = {
  description: "Internal server error",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiErrorResponse" },
      example: { success: false, message: "Failed to fetch contracts" },
    },
  },
};

const openApiSpecBase: Omit<OpenAPIV3.Document, "servers"> = {
  openapi: "3.0.3",
  info: {
    title: "Tract-Us Contract Operations API",
    version: "1.0.0",
    description:
      "Organization-scoped contract management API. No API keys — scope requests with `organizationId` (query param or POST body). Call GET /api/organizations first to obtain organization IDs.",
  },
  tags: [
    { name: "Organizations", description: "Organization listing" },
    { name: "Contracts", description: "Contract CRUD, status workflow, PDF, audit" },
  ],
  paths: {
    "/api/organizations": {
      get: {
        tags: ["Organizations"],
        summary: "List organizations",
        operationId: "listOrganizations",
        responses: {
          "200": {
            description: "Organizations retrieved",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Organization" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "500": error500,
        },
      },
    },
    "/api/contracts": {
      get: {
        tags: ["Contracts"],
        summary: "List contracts",
        operationId: "listContracts",
        parameters: [
          organizationIdParam,
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: "search",
            in: "query",
            description: "Search by client name, contract ID, or PO ref",
            schema: { type: "string" },
          },
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/ContractStatus" },
          },
        ],
        responses: {
          "200": {
            description: "Paginated contract list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/PaginatedContracts" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "500": error500,
        },
      },
      post: {
        tags: ["Contracts"],
        summary: "Create contract",
        operationId: "createContract",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateContractRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Contract created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Contract" },
                        message: { type: "string", example: "Contract created successfully" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "500": error500,
        },
      },
    },
    "/api/contracts/{id}": {
      get: {
        tags: ["Contracts"],
        summary: "Get contract by ID",
        operationId: "getContract",
        parameters: [contractIdParam, organizationIdParam],
        responses: {
          "200": {
            description: "Contract details",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Contract" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "404": error404,
          "500": error500,
        },
      },
      patch: {
        tags: ["Contracts"],
        summary: "Update draft contract",
        operationId: "updateContract",
        parameters: [contractIdParam, organizationIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateContractRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Contract updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Contract" },
                        message: { type: "string", example: "Contract updated successfully" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "404": error404,
          "409": error409,
          "500": error500,
        },
      },
      delete: {
        tags: ["Contracts"],
        summary: "Soft-delete draft contract",
        operationId: "deleteContract",
        parameters: [contractIdParam, organizationIdParam],
        responses: {
          "200": {
            description: "Contract deleted",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        message: { type: "string", example: "Contract deleted" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "404": error404,
          "409": error409,
          "500": error500,
        },
      },
    },
    "/api/contracts/{id}/status": {
      patch: {
        tags: ["Contracts"],
        summary: "Transition contract status",
        description:
          "DRAFT → FINALIZED → ARCHIVED. Invalid transitions return 409.",
        operationId: "updateContractStatus",
        parameters: [contractIdParam, organizationIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateStatusRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Contract" },
                        message: { type: "string", example: "Contract status updated" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "404": error404,
          "409": error409,
          "500": error500,
        },
      },
    },
    "/api/contracts/{id}/events": {
      get: {
        tags: ["Contracts"],
        summary: "Get contract audit trail",
        operationId: "getContractEvents",
        parameters: [contractIdParam, organizationIdParam],
        responses: {
          "200": {
            description: "Audit events",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/AuditEvent" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "404": error404,
          "500": error500,
        },
      },
    },
    "/api/contracts/{id}/pdf": {
      get: {
        tags: ["Contracts"],
        summary: "Download contract PDF",
        operationId: "getContractPdf",
        parameters: [contractIdParam, organizationIdParam],
        responses: {
          "200": {
            description: "PDF file",
            content: {
              "application/pdf": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          "400": error400,
          "404": {
            description: "PDF not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                example: { success: false, message: "PDF not found" },
              },
            },
          },
          "500": error500,
        },
      },
      post: {
        tags: ["Contracts"],
        summary: "Upload contract PDF",
        description: "Draft contracts only. Multipart field name must be `pdf`.",
        operationId: "uploadContractPdf",
        parameters: [contractIdParam, organizationIdParam],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["pdf"],
                properties: {
                  pdf: { type: "string", format: "binary", description: "PDF file" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "PDF uploaded",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Contract" },
                        message: { type: "string", example: "PDF uploaded successfully" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": error400,
          "404": error404,
          "409": error409,
          "500": error500,
        },
      },
    },
  },
  components: {
    schemas: {
      ContractStatus: {
        type: "string",
        enum: ["DRAFT", "FINALIZED", "ARCHIVED"],
      },
      ContractItem: {
        type: "object",
        required: ["description", "quantity", "unit_price"],
        properties: {
          description: { type: "string" },
          quantity: { type: "number", minimum: 0, exclusiveMinimum: true },
          quantity_unit: { type: "string" },
          unit_price: { type: "number", minimum: 0 },
          pricing_unit: { type: "string" },
          total: { type: "number" },
        },
      },
      ContractFieldData: {
        type: "object",
        required: ["client_name", "po_ref_no", "po_date", "items"],
        properties: {
          client_name: { type: "string" },
          po_ref_no: { type: "string" },
          po_date: { type: "string", format: "date", example: "2024-06-01" },
          payment_terms: { type: "string" },
          delivery_terms: { type: "string" },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/ContractItem" },
          },
        },
      },
      Organization: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Contract: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          organizationId: { type: "string", format: "uuid" },
          clientName: { type: "string" },
          poRefNo: { type: "string" },
          poDate: { type: "string" },
          fieldData: { $ref: "#/components/schemas/ContractFieldData" },
          status: { $ref: "#/components/schemas/ContractStatus" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          pdfFileName: { type: "string", nullable: true },
          pdfSize: { type: "integer", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuditEvent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          contractId: { type: "string", format: "uuid" },
          eventType: { type: "string", example: "contract.created" },
          metadata: { type: "object", additionalProperties: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PaginatedContracts: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Contract" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      ApiSuccessResponse: {
        type: "object",
        required: ["success"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: {},
          message: { type: "string" },
        },
      },
      ApiErrorResponse: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { type: "boolean", enum: [false] },
          message: { type: "string" },
          errors: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
        },
      },
      CreateContractRequest: {
        type: "object",
        required: ["organizationId", "fieldData"],
        properties: {
          organizationId: { type: "string", format: "uuid" },
          fieldData: { $ref: "#/components/schemas/ContractFieldData" },
        },
      },
      UpdateContractRequest: {
        type: "object",
        required: ["fieldData"],
        properties: {
          fieldData: { $ref: "#/components/schemas/ContractFieldData" },
        },
      },
      UpdateStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/ContractStatus" },
        },
      },
    },
  },
};

export function buildOpenApiSpec(
  serverUrl: string = DEFAULT_API_PUBLIC_URL
): OpenAPIV3.Document {
  const base = normalizeApiPublicUrl(serverUrl);
  return {
    ...openApiSpecBase,
    servers: [{ url: base, description: "API origin for this environment" }],
  };
}
