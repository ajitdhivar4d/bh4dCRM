import express from "express";

import {
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

export default router;
