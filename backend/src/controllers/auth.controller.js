import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Company from "../models/Company.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    console.log("Login email:", email.trim().toLowerCase());
    console.log("User found:", !!user);

    if (user) {
      console.log("User ID:", user._id);
      console.log("User role:", user.role);
      console.log("Password hash exists:", !!user.password);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Check password
    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log("Password matched:", passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Check user status
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // 5. Validate role
    const allowedRoles = ["super_admin", "company_owner", "employee"];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // 6. Check company access
    let company = null;

    if (user.role === "company_owner" || user.role === "employee") {
      if (!user.company) {
        return res.status(403).json({
          success: false,
          message: "User is not assigned to a company",
        });
      }

      company = await Company.findById(user.company);

      if (!company || company.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your company is not activated by Super Admin",
        });
      }
    }

    // 7. Check JWT secret
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // 8. Generate token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        companyId: company?._id.toString() || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // 9. Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company?._id || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
