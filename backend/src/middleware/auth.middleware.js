import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Company from "../models/Company.js";

// Verify login token
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or does not exist",
      });
    }

    // Check company access for owners and employees
    if (user.role === "company_owner" || user.role === "employee") {
      if (!user.company) {
        return res.status(403).json({
          success: false,
          message: "No company assigned",
        });
      }

      const company = await Company.findById(user.company);

      if (!company || company.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Company is not active. CRM access denied.",
        });
      }

      req.company = company;
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

// Allow only Super Admin
export const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super Admin access only",
    });
  }

  next();
};

// Allow only Company Owner
export const companyOwnerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "company_owner") {
    return res.status(403).json({
      success: false,
      message: "Company Owner access only",
    });
  }

  next();
};


// Allow only Employee
export const employeeOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "employee") {
    return res.status(403).json({
      success: false,
      message: "Employee access only",
    });
  }

  next();
};

// Allow company owners and employees
export const companyMemberOnly = (req, res, next) => {
  if (
    req.user &&
    ["company_owner", "employee"].includes(req.user.role)
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Company members only.",
  });
};