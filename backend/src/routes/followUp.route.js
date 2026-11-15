import express from "express";

import {
  createFollowUp,
  getFollowUps,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
} from "../controllers/followUp.controller.js";

import {
  protect,
  companyOwnerOnly,
  companyMemberOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Company Owner and Employees
router.post("/", protect, companyMemberOnly, createFollowUp);
router.get("/", protect, companyMemberOnly, getFollowUps);
router.get("/:id", protect, companyMemberOnly, getFollowUpById);
router.put("/:id", protect, companyMemberOnly, updateFollowUp);

// Company Owner only
router.delete("/:id", protect, companyOwnerOnly, deleteFollowUp);

export default router;
