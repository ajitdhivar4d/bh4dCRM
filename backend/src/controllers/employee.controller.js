import Company from "../models/Company.js";
import User from "../models/User.js";

// GET: Employee Dashboard
export const getEmployeeDashboard = async (req, res) => {
  try {
    // Employee information comes from protect middleware
    const employee = req.user;

    // Company information also comes from protect middleware
    const company = req.company;

    return res.status(200).json({
      success: true,
      message: "Employee dashboard fetched successfully",

      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
      },

      company: {
        id: company._id,
        companyName: company.companyName,
      },
    });
  } catch (error) {
    console.error("Employee dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee dashboard",
    });
  }
};

// GET: Employee Profile
export const getEmployeeProfile = async (req, res) => {
  try {
    const employee = await User.findById(req.user.id).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee profile fetched successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT: Update Employee Profile
export const updateEmployeeProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Find logged-in employee
    const employee = await User.findById(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      employee.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      employee.email = email.trim().toLowerCase();
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee profile updated successfully",
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        company: employee.company,
        status: employee.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Employee Company Details
export const getEmployeeCompany = async (req, res) => {
  try {
    // Find logged-in employee and get company ID
    const employee = await User.findById(req.user.id).select("company");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (!employee.company) {
      return res.status(404).json({
        success: false,
        message: "Employee is not associated with any company",
      });
    }

    // Find employee's company
    const company = await Company.findById(employee.company).select(
      "companyName slug email phone address status",
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company details fetched successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
