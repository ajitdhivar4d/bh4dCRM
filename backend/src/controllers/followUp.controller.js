import mongoose from "mongoose";

import FollowUp from "../models/FollowUp.js";
import Customer from "../models/Customer.js";
import Enquiry from "../models/Enquiry.js";
import User from "../models/User.js";

// Validate that a customer belongs to the logged-in company
const validateCustomer = async (customerId, companyId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return null;
  }

  return Customer.findOne({
    _id: customerId,
    company: companyId,
  });
};

// Validate an optional enquiry and ensure it belongs to the customer
const validateEnquiry = async (enquiryId, customerId, companyId) => {
  if (!enquiryId) return null;

  if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
    return false;
  }

  const enquiry = await Enquiry.findOne({
    _id: enquiryId,
    company: companyId,
    customer: customerId,
  });

  return enquiry || false;
};

// Validate an employee assigned to the follow-up
const validateAssignedEmployee = async (employeeId, companyId) => {
  if (!employeeId) return null;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return false;
  }

  return User.findOne({
    _id: employeeId,
    company: companyId,
    role: "employee",
    status: "active",
  });
};

// Create follow-up
export const createFollowUp = async (req, res) => {
  try {
    const { customer, enquiry, assignedTo, dueAt, type, notes } = req.body;

    const companyId = req.company._id;

    if (!customer || !dueAt) {
      return res.status(400).json({
        message: "Customer and follow-up date are required.",
      });
    }

    const customerExists = await validateCustomer(customer, companyId);

    if (!customerExists) {
      return res.status(404).json({
        message: "Customer not found in your company.",
      });
    }

    if (enquiry) {
      const enquiryExists = await validateEnquiry(enquiry, customer, companyId);

      if (!enquiryExists) {
        return res.status(404).json({
          message: "Enquiry not found for this customer.",
        });
      }
    }

    if (assignedTo) {
      const employeeExists = await validateAssignedEmployee(
        assignedTo,
        companyId,
      );

      if (!employeeExists) {
        return res.status(404).json({
          message: "Assigned employee not found or inactive.",
        });
      }
    }

    const parsedDueAt = new Date(dueAt);

    if (Number.isNaN(parsedDueAt.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid follow-up date.",
      });
    }

    const followUp = await FollowUp.create({
      company: companyId,
      customer,
      enquiry: enquiry || null,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      dueAt: parsedDueAt,
      type,
      notes,
    });

    return res.status(201).json({
      message: "Follow-up created successfully.",
      followUp,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to create follow-up.",
    });
  }
};

// Get all company follow-ups
export const getFollowUps = async (req, res) => {
  try {
    const { status, customer, assignedTo, overdue } = req.query;

    const filter = {
      company: req.company._id,
    };

    if (status) {
      filter.status = status;
    }

    if (customer) {
      filter.customer = customer;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (overdue === "true") {
      filter.status = "pending";
      filter.dueAt = { $lt: new Date() };
    }

    const followUps = await FollowUp.find(filter)
      .populate("customer", "name phone email")
      .populate("enquiry", "productName status")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ dueAt: 1 });

    return res.status(200).json({
      count: followUps.length,
      followUps,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch follow-ups.",
    });
  }
};

// Get one follow-up
export const getFollowUpById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid follow-up ID.",
      });
    }

    const followUp = await FollowUp.findOne({
      _id: id,
      company: req.company._id,
    })
      .populate("customer", "name phone email")
      .populate("enquiry", "productName status")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!followUp) {
      return res.status(404).json({
        message: "Follow-up not found.",
      });
    }

    return res.status(200).json({ followUp });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch follow-up.",
    });
  }
};

// Update follow-up
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid follow-up ID.",
      });
    }

    const followUp = await FollowUp.findOne({
      _id: id,
      company: req.company._id,
    });

    if (!followUp) {
      return res.status(404).json({
        message: "Follow-up not found.",
      });
    }

    const {
      customer,
      enquiry,
      assignedTo,
      dueAt,
      type,
      notes,
      status,
      completionNote,
    } = req.body;

    const updatedCustomer = customer ?? followUp.customer.toString();
    const updatedEnquiry =
      enquiry === undefined ? followUp.enquiry?.toString() : enquiry;

    // Validate customer if it is being changed
    if (customer !== undefined) {
      const customerExists = await validateCustomer(
        updatedCustomer,
        req.company._id,
      );

      if (!customerExists) {
        return res.status(404).json({
          message: "Customer not found in your company.",
        });
      }

      followUp.customer = updatedCustomer;
    }

    // Validate enquiry if customer or enquiry is being changed
    if (customer !== undefined || enquiry !== undefined) {
      if (updatedEnquiry) {
        const enquiryExists = await validateEnquiry(
          updatedEnquiry,
          updatedCustomer,
          req.company._id,
        );

        if (!enquiryExists) {
          return res.status(404).json({
            message: "Enquiry not found for this customer.",
          });
        }
      }

      followUp.enquiry = updatedEnquiry || null;
    }

    // Validate assigned employee
    if (assignedTo !== undefined) {
      if (assignedTo) {
        const employeeExists = await validateAssignedEmployee(
          assignedTo,
          req.company._id,
        );

        if (!employeeExists) {
          return res.status(404).json({
            message: "Assigned employee not found or inactive.",
          });
        }
      }

      followUp.assignedTo = assignedTo || null;
    }

    if (dueAt !== undefined) {
      const parsedDueAt = new Date(dueAt);

      if (Number.isNaN(parsedDueAt.getTime())) {
        return res.status(400).json({
          message: "Please provide a valid follow-up date.",
        });
      }

      followUp.dueAt = parsedDueAt;
    }

    if (type !== undefined) followUp.type = type;
    if (notes !== undefined) followUp.notes = notes;

    if (status !== undefined) {
      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          message: "Invalid follow-up status.",
        });
      }

      followUp.status = status;

      followUp.completedAt = status === "completed" ? new Date() : null;
    }

    if (completionNote !== undefined) {
      followUp.completionNote = completionNote;
    }

    await followUp.save();

    return res.status(200).json({
      message: "Follow-up updated successfully.",
      followUp,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to update follow-up.",
    });
  }
};

// Delete follow-up
export const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid follow-up ID.",
      });
    }

    const followUp = await FollowUp.findOneAndDelete({
      _id: id,
      company: req.company._id,
    });

    if (!followUp) {
      return res.status(404).json({
        message: "Follow-up not found.",
      });
    }

    return res.status(200).json({
      message: "Follow-up deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to delete follow-up.",
    });
  }
};
