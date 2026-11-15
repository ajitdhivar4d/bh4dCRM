import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Company from "../models/Company.js";

import crypto from "crypto";
import EmployeeInvitation from "../models/EmployeeInvitation.js";

// POST: Register a new company
export const registerCompany = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      name,
      email,
      password,
      companyName,
      companyEmail,
      companyPhone,
      address,
    } = req.body;

    // 1. Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !companyName ||
      !companyEmail ||
      !companyPhone
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email) || !emailRegex.test(companyEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid email addresses",
      });
    }

    // 3. Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    // 4. Check whether owner email already exists
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User email already registered",
      });
    }

    // 5. Generate company slug
    const slug =
      companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now();

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let newUser;
    let newCompany;

    // 7. Create User and Company together
    await session.withTransaction(async () => {
      // Create company owner
      const users = await User.create(
        [
          {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "company_owner",
            company: null,
          },
        ],
        { session },
      );

      newUser = users[0];

      // Create company
      const companies = await Company.create(
        [
          {
            companyName: companyName.trim(),
            slug,
            owner: newUser._id,
            email: companyEmail.toLowerCase().trim(),
            phone: companyPhone.trim(),
            address: address?.trim() || "",
            status: "pending",
          },
        ],
        { session },
      );

      newCompany = companies[0];

      // Link company to owner
      await User.updateOne(
        { _id: newUser._id },
        { $set: { company: newCompany._id } },
        { session },
      );
    });

    // 8. Send successful response
    return res.status(201).json({
      success: true,
      message: "Company registered successfully. Waiting for admin approval.",
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          company: newCompany._id,
        },
        company: {
          id: newCompany._id,
          companyName: newCompany.companyName,
          slug: newCompany.slug,
          status: newCompany.status,
        },
      },
    });
  } catch (error) {
    console.error("Company registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account or company with this unique value already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    await session.endSession();
  }
};

export const getCompanyDashboard = async (req, res) => {
  try {
    const company = req.company;

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Verify company ownership
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this company",
      });
    }

    // Employee statistics
    const totalEmployees = await User.countDocuments({
      company: company._id,
      role: "employee",
    });

    const activeEmployees = await User.countDocuments({
      company: company._id,
      role: "employee",
      status: "active",
    });

    const inactiveEmployees = totalEmployees - activeEmployees;

    return res.status(200).json({
      success: true,
      message: "Company dashboard data fetched successfully",

      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },

      company: {
        id: company._id,
        companyName: company.companyName,
        slug: company.slug,
        email: company.email,
        phone: company.phone,
        address: company.address,
        status: company.status,
        createdAt: company.createdAt,
      },

      statistics: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
      },
    });
  } catch (error) {
    console.error("Company dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch company dashboard",
    });
  }
};

// POST: Company Owner invites an employee
export const inviteEmployee = async (req, res) => {
  try {
    const { employeeName, email } = req.body;

    // 1. Validate required fields
    if (
      typeof employeeName !== "string" ||
      typeof email !== "string" ||
      !employeeName.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Employee name and email are required",
      });
    }

    // Verify company ownership
    if (
      !req.company ||
      req.company.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to invite employees",
      });
    }

    // 2. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const normalizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // 3. Check whether employee already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    // 4. Check whether a pending invitation already exists
    const existingInvitation = await EmployeeInvitation.findOne({
      company: req.user.company,
      email: normalizedEmail,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return res.status(409).json({
        success: false,
        message: "An active invitation already exists for this email",
      });
    }

    // 5. Generate a secure random invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // Store only the token hash in MongoDB
    const tokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    // 6. Invitation expires after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 7. Save invitation
    const invitation = await EmployeeInvitation.create({
      company: req.user.company,
      invitedBy: req.user._id,
      employeeName: employeeName.trim(),
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    });

    // 8. Return invitation details
    const response = {
      success: true,
      message: "Employee invitation created successfully",
      invitation: {
        id: invitation._id,
        employeeName: invitation.employeeName,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    };

    // Show the invitation link only during development.
    if (process.env.NODE_ENV !== "production") {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      response.invitationLink = `${frontendUrl}/accept-invitation?token=${invitationToken}`;
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error("Employee invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee invitation",
    });
  }
};

// GET: Verify employee invitation
export const verifyInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    // 1. Validate token
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation token",
      });
    }

    // 2. Hash received token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 3. Find valid invitation
    const invitation = await EmployeeInvitation.findOne({
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).populate("company", "companyName status");

    // 4. Check invitation and company
    if (
      !invitation ||
      !invitation.company ||
      invitation.company.status !== "active"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invitation is invalid, expired, or unavailable",
      });
    }

    // 5. Return invitation details
    return res.status(200).json({
      success: true,
      message: "Invitation is valid",
      invitation: {
        employeeName: invitation.employeeName,
        email: invitation.email,
        companyName: invitation.company.companyName,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify invitation",
    });
  }
};

// POST: Accept invitation and create employee account
export const acceptInvitation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { token, password } = req.body;

    // 1. Validate input
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid invitation token and password are required. Password must contain at least 8 characters.",
      });
    }

    // 2. Hash invitation token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    let createdEmployee;

    // 3. Start transaction
    await session.withTransaction(async () => {
      // Find unused, non-expired invitation
      const invitation = await EmployeeInvitation.findOne({
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!invitation) {
        const error = new Error(
          "Invitation is invalid, expired, or already used",
        );
        error.statusCode = 400;
        throw error;
      }

      // Check company status
      const company = await Company.findById(invitation.company).session(
        session,
      );

      if (!company || company.status !== "active") {
        const error = new Error("Company is not active");
        error.statusCode = 400;
        throw error;
      }

      // Check existing user
      const existingUser = await User.findOne({
        email: invitation.email,
      }).session(session);

      if (existingUser) {
        const error = new Error("An account with this email already exists");
        error.statusCode = 409;
        throw error;
      }

      // Hash employee password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create employee
      const employees = await User.create(
        [
          {
            name: invitation.employeeName,
            email: invitation.email,
            password: hashedPassword,
            role: "employee",
            company: invitation.company,
            status: "active",
          },
        ],
        { session },
      );

      createdEmployee = employees[0];

      // Mark invitation as accepted
      const updateResult = await EmployeeInvitation.updateOne(
        {
          _id: invitation._id,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            acceptedAt: new Date(),
          },
        },
        { session },
      );

      if (updateResult.modifiedCount !== 1) {
        throw new Error("Invitation could not be accepted");
      }
    });

    // 4. Send successful response
    return res.status(201).json({
      success: true,
      message: "Employee account created successfully",
      employee: {
        id: createdEmployee._id,
        name: createdEmployee.name,
        email: createdEmployee.email,
        role: createdEmployee.role,
        company: createdEmployee.company,
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to accept invitation",
    });
  } finally {
    await session.endSession();
  }
};

// GET: Get all employees of logged-in company
export const getCompanyEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      company: req.user.company,
      role: "employee",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

// GET: Get single employee details
export const getCompanyEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await User.findOne({
      _id: id,
      company: req.user.company,
      role: "employee",
    }).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Get employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
};

// PUT: Update employee details
export const updateCompanyEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    // Validate input
    if (
      (name !== undefined && (typeof name !== "string" || !name.trim())) ||
      (email !== undefined &&
        (typeof email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid name and email",
      });
    }

    if (name === undefined && email === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide name or email to update",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      updateData.email = email.trim().toLowerCase();
    }

    const employee = await User.findOneAndUpdate(
      {
        _id: id,
        company: req.user.company,
        role: "employee",
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
      },
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};

// PATCH: Activate or deactivate employee
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate employee ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    // Validate status
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive",
      });
    }

    // Find and update employee belonging to owner's company
    const employee = await User.findOneAndUpdate(
      {
        _id: id,
        company: req.user.company,
        role: "employee",
      },
      {
        $set: {
          status: status,
        },
      },
      {
        returnDocument: "after",
      },
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Employee ${status} successfully`,
      employee,
    });
  } catch (error) {
    console.error("Update employee status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee status",
    });
  }
};



// GET: Get Company Attendance Settings
export const getAttendanceSettings = async (req, res) => {
  try {
    if (req.user.role !== "company_owner") {
      return res.status(403).json({
        success: false,
        message: "Company owner access only",
      });
    }

    const company = await Company.findOne({
      _id: req.user.company,
      owner: req.user._id,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance settings fetched successfully",
      attendanceSettings: company.attendanceSettings,
    });
  } catch (error) {
    console.error("Get attendance settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance settings",
    });
  }
};



// PUT: Update Company Attendance Settings
export const updateAttendanceSettings = async (req, res) => {
  try {
    if (req.user.role !== "company_owner") {
      return res.status(403).json({
        success: false,
        message: "Company owner access only",
      });
    }

    const company = await Company.findOne({
      _id: req.user.company,
      owner: req.user._id,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const settings = company.attendanceSettings;

    const {
      latitude,
      longitude,
      allowedRadius,
      officeLocation,
      officeStartTime,
      officeEndTime,
      lunchBreakMinutes,
      requiredWorkingMinutes,
      gracePeriodMinutes,
      absentBelowMinutes,
      halfDayBelowMinutes,
    } = req.body;

    // 1. Validate office timings
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (
      officeStartTime !== undefined &&
      (typeof officeStartTime !== "string" ||
        !timeRegex.test(officeStartTime))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid office start time. Use HH:mm format",
      });
    }

    if (
      officeEndTime !== undefined &&
      (typeof officeEndTime !== "string" ||
        !timeRegex.test(officeEndTime))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid office end time. Use HH:mm format",
      });
    }

    // 2. Validate numeric settings
    const numericUpdates = {
      allowedRadius,
      lunchBreakMinutes,
      requiredWorkingMinutes,
      gracePeriodMinutes,
      absentBelowMinutes,
      halfDayBelowMinutes,
    };

    for (const [field, value] of Object.entries(numericUpdates)) {
      if (
        value !== undefined &&
        (!Number.isSafeInteger(value) || value < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${field}`,
        });
      }
    }

    // 3. Validate GPS location
    let newLocation;

    if (officeLocation !== undefined) {
      if (
        !officeLocation ||
        typeof officeLocation.latitude !== "number" ||
        typeof officeLocation.longitude !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid office latitude and longitude are required",
        });
      }

      newLocation = officeLocation;
    } else if (latitude !== undefined || longitude !== undefined) {
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude must be provided together",
        });
      }

      newLocation = { latitude, longitude };
    }

    if (
      newLocation &&
      (newLocation.latitude < -90 ||
        newLocation.latitude > 90 ||
        newLocation.longitude < -180 ||
        newLocation.longitude > 180)
    ) {
      return res.status(400).json({
        success: false,
        message: "GPS coordinates are out of range",
      });
    }

    // 4. Prepare updated settings without saving yet
    const updated = {
      officeStartTime: officeStartTime ?? settings.officeStartTime,
      officeEndTime: officeEndTime ?? settings.officeEndTime,
      lunchBreakMinutes: lunchBreakMinutes ?? settings.lunchBreakMinutes,
      requiredWorkingMinutes:
        requiredWorkingMinutes ?? settings.requiredWorkingMinutes,
      gracePeriodMinutes:
        gracePeriodMinutes ?? settings.gracePeriodMinutes,
      absentBelowMinutes:
        absentBelowMinutes ?? settings.absentBelowMinutes,
      halfDayBelowMinutes:
        halfDayBelowMinutes ?? settings.halfDayBelowMinutes,
      allowedRadius: allowedRadius ?? settings.allowedRadius,
    };

    // 5. Validate attendance thresholds
    if (
      updated.requiredWorkingMinutes < 1 ||
      updated.allowedRadius < 1 ||
      updated.absentBelowMinutes >= updated.halfDayBelowMinutes ||
      updated.halfDayBelowMinutes >= updated.requiredWorkingMinutes
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance thresholds",
      });
    }

    // 6. Update only provided settings
    if (officeStartTime !== undefined) {
      settings.officeStartTime = officeStartTime;
    }

    if (officeEndTime !== undefined) {
      settings.officeEndTime = officeEndTime;
    }

    if (lunchBreakMinutes !== undefined) {
      settings.lunchBreakMinutes = lunchBreakMinutes;
    }

    if (requiredWorkingMinutes !== undefined) {
      settings.requiredWorkingMinutes = requiredWorkingMinutes;
    }

    if (gracePeriodMinutes !== undefined) {
      settings.gracePeriodMinutes = gracePeriodMinutes;
    }

    if (absentBelowMinutes !== undefined) {
      settings.absentBelowMinutes = absentBelowMinutes;
    }

    if (halfDayBelowMinutes !== undefined) {
      settings.halfDayBelowMinutes = halfDayBelowMinutes;
    }

    if (allowedRadius !== undefined) {
      settings.allowedRadius = allowedRadius;
    }

    if (newLocation) {
      settings.officeLocation = newLocation;
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Attendance settings updated successfully",
      attendanceSettings: settings,
    });
  } catch (error) {
    console.error("Update attendance settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update attendance settings",
    });
  }
};
