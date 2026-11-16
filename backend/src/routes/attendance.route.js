import express from "express";

import {
  checkIn,
  checkOut,
  getMyAttendance,
  getCompanyAttendance,
  getMonthlyAttendanceReport,
} from "../controllers/attendance.controller.js";

import { protect, companyOwnerOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Employee attendance
router.post("/check-in", protect, checkIn);
router.patch("/check-out", protect, checkOut);
router.get("/my-attendance", protect, getMyAttendance);

// Company owner attendance
router.get("/company-report", protect, getCompanyAttendance);

router.get(
  "/monthly-report",
  protect,
  companyOwnerOnly,
  getMonthlyAttendanceReport,
);

export default router;
