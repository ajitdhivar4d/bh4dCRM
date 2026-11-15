import mongoose from "mongoose";
import Customer from "../models/Customer.js";

// Add a new customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, alternatePhone, email, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Customer name and phone are required.",
      });
    }

    const customer = await Customer.create({
      company: req.company._id,
      createdBy: req.user._id,
      name,
      phone,
      alternatePhone,
      email,
      address,
      notes,
    });

    return res.status(201).json({
      message: "Customer created successfully.",
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create customer.",
      error: error.message,
    });
  }
};

// Get all customers belonging to the logged-in user's company
export const getCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {
      company: req.company._id,
    };

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    const customers = await Customer.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch customers.",
      error: error.message,
    });
  }
};

// Get one customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      company: req.company._id,
    }).populate("createdBy", "name email");

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    return res.status(200).json({ customer });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch customer.",
      error: error.message,
    });
  }
};

// Update a customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "alternatePhone",
      "email",
      "address",
      "notes",
      "status",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.status !== undefined &&
      !["active", "inactive"].includes(updates.status)
    ) {
      return res.status(400).json({
        message: "Invalid customer status.",
      });
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({
        message: "Customer name cannot be empty.",
      });
    }

    if (updates.phone !== undefined && !updates.phone.trim()) {
      return res.status(400).json({
        message: "Customer phone cannot be empty.",
      });
    }

    if (updates.email !== undefined) {
      updates.email = updates.email.trim().toLowerCase();
    }

    const customer = await Customer.findOneAndUpdate(
      {
        _id: id,
        company: req.company._id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      message: "Customer updated successfully.",
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update customer.",
      error: error.message,
    });
  }
};

// Delete a customer (Company Owner only)
export const deleteCustomer = async (req, res) => {
  try {
    if (req.user.role !== "company_owner") {
      return res.status(403).json({
        message: "Only the company owner can delete customers.",
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    const customer = await Customer.findOneAndDelete({
      _id: id,
      company: req.company._id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete customer.",
      error: error.message,
    });
  }
};
