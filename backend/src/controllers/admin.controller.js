import mongoose from "mongoose";
import Company from "../models/Company.js";

// Get all pending companies
export const getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.find({
      status: "pending",
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending companies",
    });
  }
};

// router.patch("/companies/:companyId/status",
//localhost:5000/api/admin/companies/COMPANY_ID/status
// Activate or deactivate a company
export const updateCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status } = req.body;

    // Validate company ID
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    // Only allow these status changes
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or suspended",
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    company.status = status;

    await company.save();

    return res.status(200).json({
      success: true,
      message:
        status === "active"
          ? "Company activated successfully"
          : "Company deactivated successfully",
      company: {
        id: company._id,
        companyName: company.companyName,
        slug: company.slug,
        status: company.status,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to update company status",
    });
  }
};
