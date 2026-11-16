import mongoose from "mongoose";

import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import Company from "../models/Company.js";

// Convert a date into YYYY-MM-DD using India timezone
const getIndiaDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);

// Get weekday in India timezone
const getIndiaWeekday = (date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(date);

// Convert YYYY-MM-DD to a UTC date for safe date iteration
const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (date.toISOString().slice(0, 10) !== value) return null;

  return date;
};

// Calculate leave days excluding weekly off days
const calculateLeaveDays = (startDate, endDate, weeklyOffDays = ["Sunday"]) => {
  let totalDays = 0;

  const current = new Date(startDate);

  while (current <= endDate) {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
    }).format(current);

    if (!weeklyOffDays.includes(weekday)) {
      totalDays++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return totalDays;
};

export const applyForLeave = async (req, res) => {
  try {
    const {
      leaveType,
      startDate: startDateValue,
      endDate: endDateValue,
      reason,
    } = req.body;

    // Validate leave type
    const validLeaveTypes = ["casual", "sick", "emergency", "other"];

    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type.",
      });
    }

    // Validate reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a leave reason.",
      });
    }

    // Parse and validate dates
    const startDate = parseDate(startDateValue);
    const endDate = parseDate(endDateValue);

    if (!startDate || !endDate || endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid leave dates.",
      });
    }

    // Prevent past leave applications
    const today = parseDate(getIndiaDate(new Date()));

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply for leave for past dates.",
      });
    }

    const company = req.company;

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    const weeklyOffDays = company.attendanceSettings?.weeklyOffDays ?? [
      "Sunday",
    ];

    const totalDays = calculateLeaveDays(startDate, endDate, weeklyOffDays);

    if (totalDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected dates contain only weekly off days.",
      });
    }

    // Prevent overlapping pending or approved leave
    const overlappingLeave = await Leave.findOne({
      company: company._id,
      employee: req.user._id,
      status: { $in: ["pending", "approved"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (overlappingLeave) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending or approved leave for these dates.",
      });
    }

    // Prevent leave on dates with existing attendance
    const existingAttendance = await Attendance.findOne({
      company: company._id,
      employee: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for one or more selected dates.",
      });
    }

    const leave = await Leave.create({
      company: company._id,
      employee: req.user._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      leave,
    });
  } catch (error) {
    console.error("Apply leave error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit leave application.",
    });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      company: req.user.company,
      employee: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error("Get my leaves error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your leave requests.",
    });
  }
};

export const getCompanyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      company: req.user.company,
    })
      .sort({ createdAt: -1 })
      .populate("employee", "name email")
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error("Get company leaves error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch company leave requests.",
    });
  }
};


export const reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote = "" } = req.body;
    const { id } = req.params;

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    if (typeof reviewNote !== "string" || reviewNote.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Review note must not exceed 500 characters.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID.",
      });
    }

    // Find leave belonging to this company
    const leave = await Leave.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    // Only pending requests can be reviewed
    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This leave request has already been reviewed.",
      });
    }

    // Do not approve leave if attendance already exists
    if (status === "approved") {
      const existingAttendance = await Attendance.findOne({
        company: req.user.company,
        employee: leave.employee,
        date: {
          $gte: leave.startDate,
          $lte: leave.endDate,
        },
      });

      if (existingAttendance) {
        return res.status(409).json({
          success: false,
          message:
            "Attendance already exists during this leave period. Cannot approve this request.",
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote.trim();

    await leave.save();

    return res.status(200).json({
      success: true,
      message: `Leave ${status} successfully.`,
      leave,
    });
  } catch (error) {
    console.error("Review leave error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to review leave request.",
    });
  }
};
