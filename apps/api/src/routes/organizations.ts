import express from "express";
import prisma from "../lib/prisma";
import type { ApiResponse, Organization } from "@tractus/types";

const router = express.Router();

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
