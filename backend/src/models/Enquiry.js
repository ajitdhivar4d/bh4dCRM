import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Product details (optional)
    productName: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Dimensions (optional)
    dimensions: {
      width: { type: Number, default: null, min: 0 },
      height: { type: Number, default: null, min: 0 },
      thickness: { type: Number, default: null, min: 0 },
      unit: {
        type: String,
        enum: ["mm", "cm", "inch", "feet"],
        default: "mm",
      },
    },

    material: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      min: 1,
      default: null,
    },

    referenceImage: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "converted", "lost"],
      default: "new",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

enquirySchema.index({ company: 1, createdAt: -1 });
enquirySchema.index({ company: 1, customer: 1 });
enquirySchema.index({ company: 1, status: 1 });

const Enquiry = mongoose.model("Enquiry", enquirySchema);

export default Enquiry;
