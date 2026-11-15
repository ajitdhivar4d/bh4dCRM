import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // Customer belongs to a particular company
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Employee or owner who created this customer
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Customer information
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Useful for company-wise customer listing
customerSchema.index({ company: 1, createdAt: -1 });

// Useful for searching customers by name or phone
customerSchema.index({ company: 1, name: 1 });
customerSchema.index({ company: 1, phone: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
