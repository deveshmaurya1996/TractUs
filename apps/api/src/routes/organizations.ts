import express from "express";
import { ZodError } from "zod";
import prisma from "../lib/prisma";
import { OrganizationSchema, formatZodErrors } from "@tractus/validation";
import type { ApiResponse, Organization } from "@tractus/types";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const data = OrganizationSchema.parse(req.body);
    const organization = await prisma.organization.create({ data });
    const response: ApiResponse<Organization> = {
      success: true,
      data: organization,
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const response: ApiResponse = {
        success: false,
        message: "Validation failed",
        errors: [formatZodErrors(error)],
      };
      return res.status(400).json(response);
    }
    req.log.error(error);
    const response: ApiResponse = {
      success: false,
      message: "Failed to create organization",
    };
    res.status(500).json(response);
  }
});

router.get("/", async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany();
    const response: ApiResponse<Organization[]> = {
      success: true,
      data: organizations,
    };
    res.json(response);
  } catch (error) {
    req.log.error(error);
    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch organizations",
    };
    res.status(500).json(response);
  }
});

export default router;
