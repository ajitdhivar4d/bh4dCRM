import express from "express";

import {
  registerCompany,
  getCompanyDashboard,
  inviteEmployee,
  verifyInvitation,
  acceptInvitation,
  getCompanyEmployees,
  getCompanyEmployeeById,
  updateCompanyEmployee,
  updateEmployeeStatus,
  updateAttendanceSettings,
  getAttendanceSettings,
  getCompanyInvitations,
  regenerateInvitationLink,
} from "../controllers/company.controller.js";

import { protect, companyOwnerOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public company registration
router.post("/register", registerCompany);

// Public employee invitation routes
router.get("/verify-invitation", verifyInvitation);
router.post("/accept-invitation", acceptInvitation);

// Protected Company Owner Dashboard
router.get("/dashboard", protect, companyOwnerOnly, getCompanyDashboard);

// Company Owner invites employee
router.post("/employees/invite", protect, companyOwnerOnly, inviteEmployee);

// Get all company employees
router.get("/employees", protect, companyOwnerOnly, getCompanyEmployees);

// Get single employee
router.get("/employees/:id", protect, companyOwnerOnly, getCompanyEmployeeById);

// Update employee
router.put("/employees/:id", protect, companyOwnerOnly, updateCompanyEmployee);

// Activate / Deactivate employee
router.patch(
  "/employees/:id/status",
  protect,
  companyOwnerOnly,
  updateEmployeeStatus,
);

// Attendance Settings
router.get(
  "/attendance-settings",
  protect,
  companyOwnerOnly,
  getAttendanceSettings,
);

router.put(
  "/attendance-settings",
  protect,
  companyOwnerOnly,
  updateAttendanceSettings,
);

// Get company invitations
router.get("/invitations", protect, companyOwnerOnly, getCompanyInvitations);

// Regenerate invitation link
router.post(
  "/invitations/:id/regenerate",
  protect,
  companyOwnerOnly,
  regenerateInvitationLink,
);

export default router;
