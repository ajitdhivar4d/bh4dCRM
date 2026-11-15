import express from "express";

import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  uploadEnquiryImage,
} from "../controllers/enquiry.controller.js";

import {
  protect,
  companyOwnerOnly,
  companyMemberOnly,
} from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Company Owner and Employees
router.post("/", protect, companyMemberOnly, createEnquiry);
router.get("/", protect, companyMemberOnly, getEnquiries);
router.get("/:id", protect, companyMemberOnly, getEnquiryById);
router.put("/:id", protect, companyMemberOnly, updateEnquiry);

// Company Owner only
router.delete("/:id", protect, companyOwnerOnly, deleteEnquiry);

router.post(
  "/:id/image",
  protect,
  companyMemberOnly,
  upload.single("referenceImage"),
  uploadEnquiryImage,
);

export default router;
