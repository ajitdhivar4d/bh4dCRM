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

    // Validate temporary Super Admin access
    if (decoded.impersonatedBy) {
      const admin = await User.findOne({
        _id: decoded.impersonatedBy,
        role: "super_admin",
        status: "active",
      });

      if (!admin) {
        return res.status(403).json({
          success: false,
          message: "Super Admin account is no longer active",
        });
      }

      req.actor = admin;

      if (!user.company || decoded.companyId !== user.company.toString()) {
        return res.status(403).json({
          success: false,
          message: "Invalid company access token",
        });
      }

      // Super Admin accessing Company Owner workspace
      if (user.role === "company_owner") {
        if (decoded.impersonatedOwnerId) {
          return res.status(403).json({
            success: false,
            message: "Invalid owner access token",
          });
        }
      }

      // Super Admin accessing Employee workspace
      else if (user.role === "employee") {
        if (!decoded.impersonatedOwnerId) {
          return res.status(403).json({
            success: false,
            message: "Invalid employee access token",
          });
        }

        const owner = await User.findOne({
          _id: decoded.impersonatedOwnerId,
          role: "company_owner",
          company: user.company,
          status: "active",
        });

        if (!owner) {
          return res.status(403).json({
            success: false,
            message: "Company Owner access is no longer valid",
          });
        }

        req.impersonatedOwner = owner;
      } else {
        return res.status(403).json({
          success: false,
          message: "Invalid impersonation role",
        });
      }
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
          message: "Company is not active",
        });
      }

      // Verify company ownership during impersonation
      if (decoded.impersonatedBy) {
        const expectedOwnerId =
          user.role === "company_owner"
            ? user._id.toString()
            : decoded.impersonatedOwnerId;

        if (company.owner.toString() !== expectedOwnerId) {
          return res.status(403).json({
            success: false,
            message: "Company access is invalid",
          });
        }
      }

      req.company = company;
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

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
  if (req.user && ["company_owner", "employee"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Company members only.",
  });
};
