import express from "express";

import {
  protect,
  employeeOnly,
  companyOwnerOnly,
} from "../middleware/auth.middleware.js";

import {
  applyForLeave,
  getMyLeaves,
  getCompanyLeaves,
  reviewLeave,
} from "../controllers/leaveController.js";

const router = express.Router();

// Employee routes
router.post("/apply", protect, employeeOnly, applyForLeave);
router.get("/my-leaves", protect, employeeOnly, getMyLeaves);

// Company owner routes
router.get("/company", protect, companyOwnerOnly, getCompanyLeaves);
router.patch("/:id/review", protect, companyOwnerOnly, reviewLeave);

export default router;
