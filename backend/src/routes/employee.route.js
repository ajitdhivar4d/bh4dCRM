import express from "express";

import {
  getEmployeeCompany,
  getEmployeeDashboard,
  getEmployeeProfile,
  updateEmployeeProfile,
} from "../controllers/employee.controller.js";

import { protect, employeeOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Employee Dashboard
router.get("/dashboard", protect, employeeOnly, getEmployeeDashboard);

// Employee Profile
router.get("/profile", protect, employeeOnly, getEmployeeProfile);

// Update Employee Profile
router.put("/profile", protect, employeeOnly, updateEmployeeProfile);

// Get Employee Company Details
router.get("/company", protect, employeeOnly, getEmployeeCompany);

export default router;
