import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    // Company that owns this follow-up
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Customer associated with this follow-up
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Optional related enquiry
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      default: null,
    },

    // User who created the follow-up
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Employee responsible for the follow-up
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Follow-up date and time
    dueAt: {
      type: Date,
      required: true,
    },

    // How the customer will be contacted
    type: {
      type: String,
      enum: ["call", "whatsapp", "email", "visit", "other"],
      default: "call",
    },

    // Follow-up notes
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // Follow-up status
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },

    // When the follow-up was completed
    completedAt: {
      type: Date,
      default: null,
    },

    // Notes about the result of the follow-up
    completionNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Useful indexes for company-specific queries
followUpSchema.index({ company: 1, dueAt: 1 });
followUpSchema.index({ company: 1, status: 1 });
followUpSchema.index({ company: 1, customer: 1 });
followUpSchema.index({ company: 1, assignedTo: 1 });

const FollowUp = mongoose.model("FollowUp", followUpSchema);

export default FollowUp;
