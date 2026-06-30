import express from "express";
import { ZodError } from "zod";
import prisma from "../lib/prisma";
import {
  CreateContractSchema,
  UpdateContractSchema,
  UpdateStatusSchema,
  SearchContractsSchema,
  formatZodErrors,
} from "@tractus/validation";
import type {
  ApiResponse,
  Contract,
  AuditEvent,
  PaginatedResponse,
  ContractStatus,
} from "@tractus/types";
import { io } from "../index";
import {
  findContractForOrg,
  notDeleted,
  OrgScopeError,
  parseOrganizationId,
  toContract,
} from "../lib/orgScope";

const router = express.Router();

const isValidStatusTransition = (
  currentStatus: ContractStatus,
  newStatus: ContractStatus
): boolean => {
  const transitions: Record<ContractStatus, ContractStatus[]> = {
    DRAFT: ["FINALIZED"],
    FINALIZED: ["ARCHIVED"],
    ARCHIVED: [],
  };
  return transitions[currentStatus].includes(newStatus);
};

function handleRouteError(
  req: express.Request,
  res: express.Response,
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof OrgScopeError) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error instanceof ZodError) {
    return res
      .status(400)
      .json({ success: false, message: formatZodErrors(error), errors: error.errors });
  }
  req.log.error(error);
  return res.status(500).json({ success: false, message: fallbackMessage });
}

router.get("/", async (req, res) => {
  try {
    const { page, limit, search, status, organizationId } =
      SearchContractsSchema.parse(req.query);

    const where: Record<string, unknown> = {
      organizationId,
      ...notDeleted,
    };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
        { poRefNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, contracts] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const data: PaginatedResponse<Contract> = {
      data: contracts.map(toContract),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    const response: ApiResponse<PaginatedResponse<Contract>> = {
      success: true,
      data,
    };
    res.json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to fetch contracts");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = parseOrganizationId(req);
    const contract = await findContractForOrg(id, organizationId);
    if (!contract) {
      return res
        .status(404)
        .json({ success: false, message: "Contract not found" });
    }
    const response: ApiResponse<Contract> = {
      success: true,
      data: contract,
    };
    res.json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to fetch contract");
  }
});

router.post("/", async (req, res) => {
  try {
    const data = CreateContractSchema.parse(req.body);
    const contract = await prisma.contract.create({
      data: {
        organizationId: data.organizationId,
        clientName: data.fieldData.client_name,
        poRefNo: data.fieldData.po_ref_no,
        poDate: data.fieldData.po_date,
        fieldData: data.fieldData,
      },
    });
    await prisma.auditEvent.create({
      data: {
        contractId: contract.id,
        eventType: "contract.created",
        metadata: { contract },
      },
    });
    io.emit("contract.created", contract);
    const response: ApiResponse<Contract> = {
      success: true,
      data: toContract(contract),
      message: "Contract created successfully",
    };
    res.status(201).json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to create contract");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = parseOrganizationId(req);
    const existingContract = await findContractForOrg(id, organizationId);
    if (!existingContract) {
      return res
        .status(404)
        .json({ success: false, message: "Contract not found" });
    }
    if (existingContract.status !== "DRAFT") {
      return res
        .status(409)
        .json({ success: false, message: "Only draft contracts can be edited" });
    }
    const data = UpdateContractSchema.parse(req.body);
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        clientName: data.fieldData.client_name,
        poRefNo: data.fieldData.po_ref_no,
        poDate: data.fieldData.po_date,
        fieldData: data.fieldData,
      },
    });
    await prisma.auditEvent.create({
      data: {
        contractId: contract.id,
        eventType: "contract.updated",
        metadata: { contract },
      },
    });
    io.emit("contract.updated", contract);
    const response: ApiResponse<Contract> = {
      success: true,
      data: toContract(contract),
      message: "Contract updated successfully",
    };
    res.json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to update contract");
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = parseOrganizationId(req);
    const { status } = UpdateStatusSchema.parse(req.body);
    const existingContract = await findContractForOrg(id, organizationId);
    if (!existingContract) {
      return res
        .status(404)
        .json({ success: false, message: "Contract not found" });
    }
    if (!isValidStatusTransition(existingContract.status, status)) {
      return res.status(409).json({
        success: false,
        message: `Invalid status transition from ${existingContract.status} to ${status}`,
      });
    }
    const contract = await prisma.contract.update({
      where: { id },
      data: { status },
    });
    await prisma.auditEvent.create({
      data: {
        contractId: contract.id,
        eventType: "contract.status.changed",
        metadata: { oldStatus: existingContract.status, newStatus: status },
      },
    });
    io.emit("contract.status.changed", contract);
    const response: ApiResponse<Contract> = {
      success: true,
      data: toContract(contract),
      message: "Contract status updated",
    };
    res.json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to update status");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = parseOrganizationId(req);
    const existingContract = await findContractForOrg(id, organizationId);
    if (!existingContract) {
      return res
        .status(404)
        .json({ success: false, message: "Contract not found" });
    }
    if (existingContract.status !== "DRAFT") {
      return res
        .status(409)
        .json({ success: false, message: "Only draft contracts can be deleted" });
    }
    await prisma.auditEvent.create({
      data: {
        contractId: id,
        eventType: "contract.deleted",
        metadata: { contract: JSON.parse(JSON.stringify(existingContract)) },
      },
    });
    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    io.emit("contract.deleted", { id });
    const response: ApiResponse = {
      success: true,
      message: "Contract deleted",
    };
    res.json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to delete contract");
  }
});

router.get("/:id/events", async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = parseOrganizationId(req);
    const contract = await findContractForOrg(id, organizationId);
    if (!contract) {
      return res
        .status(404)
        .json({ success: false, message: "Contract not found" });
    }
    const events = await prisma.auditEvent.findMany({
      where: { contractId: id },
      orderBy: { createdAt: "desc" },
    });
    const response: ApiResponse<AuditEvent[]> = {
      success: true,
      data: events as AuditEvent[],
    };
    res.json(response);
  } catch (error) {
    return handleRouteError(req, res, error, "Failed to fetch audit events");
  }
});

export default router;
