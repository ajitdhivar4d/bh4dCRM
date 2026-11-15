import express from "express";

import {
  getAllCompanies,
  getDashboardStats,
  getPendingCompanies,
  updateCompanyStatus,
} from "../controllers/admin.controller.js";

import { protect, superAdminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Super Admin authentication
router.use(protect, superAdminOnly);

// Get pending companies
router.get("/companies/pending", getPendingCompanies);

// Activate or suspend company
router.patch("/companies/:companyId/status", updateCompanyStatus);

// Get Super Admin Dashboard Statistics
router.get("/dashboard", getDashboardStats);

// Get all registered companies
router.get("/companies", getAllCompanies);

export default router;
