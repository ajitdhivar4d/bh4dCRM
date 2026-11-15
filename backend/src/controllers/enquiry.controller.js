import mongoose from "mongoose";
import Enquiry from "../models/Enquiry.js";
import Customer from "../models/Customer.js";

// Create Enquiry
export const createEnquiry = async (req, res) => {
  try {
    const {
      customer,
      productName,
      description,
      dimensions,
      material,
      quantity,
      referenceImage,
      notes,
    } = req.body;

    if (!customer || !mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({
        message: "A valid customer is required.",
      });
    }

    // Verify customer belongs to logged-in user's company
    const existingCustomer = await Customer.findOne({
      _id: customer,
      company: req.company._id,
    });

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found in your company.",
      });
    }

    const enquiry = await Enquiry.create({
      company: req.company._id,
      customer,
      createdBy: req.user._id,
      productName,
      description,
      dimensions,
      material,
      quantity,
      referenceImage,
      notes,
    });

    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate("customer", "name phone email")
      .populate("createdBy", "name role");

    return res.status(201).json({
      message: "Enquiry created successfully.",
      enquiry: populatedEnquiry,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create enquiry.",
      error: error.message,
    });
  }
};

// Get All Company Enquiries
export const getEnquiries = async (req, res) => {
  try {
    const { search, status, customer } = req.query;

    const filter = {
      company: req.company._id,
    };

    if (status) {
      filter.status = status;
    }

    if (customer) {
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({
          message: "Invalid customer ID.",
        });
      }

      filter.customer = customer;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      filter.$or = [
        { productName: searchRegex },
        { description: searchRegex },
        { notes: searchRegex },
        { material: searchRegex },
      ];
    }

    const enquiries = await Enquiry.find(filter)
      .populate("customer", "name phone email")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch enquiries.",
      error: error.message,
    });
  }
};

// Get Single Enquiry
export const getEnquiryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      company: req.company._id,
    })
      .populate("customer", "name phone email")
      .populate("createdBy", "name role");

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({ enquiry });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch enquiry.",
      error: error.message,
    });
  }
};

// Update Enquiry
export const updateEnquiry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found.",
      });
    }

    const allowedFields = [
      "productName",
      "description",
      "dimensions",
      "material",
      "quantity",
      "referenceImage",
      "notes",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        enquiry[field] = req.body[field];
      }
    }

    // If customer is changed, verify the new customer belongs to this company
    if (req.body.customer !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(req.body.customer)) {
        return res.status(400).json({
          message: "Invalid customer ID.",
        });
      }

      const existingCustomer = await Customer.findOne({
        _id: req.body.customer,
        company: req.company._id,
      });

      if (!existingCustomer) {
        return res.status(404).json({
          message: "Customer not found in your company.",
        });
      }

      enquiry.customer = req.body.customer;
    }

    await enquiry.save();

    const updatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate("customer", "name phone email")
      .populate("createdBy", "name role");

    return res.status(200).json({
      message: "Enquiry updated successfully.",
      enquiry: updatedEnquiry,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update enquiry.",
      error: error.message,
    });
  }
};

// Delete Enquiry (Company Owner only - enforced in routes)
export const deleteEnquiry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found.",
      });
    }

    await enquiry.deleteOne();

    return res.status(200).json({
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete enquiry.",
      error: error.message,
    });
  }
};


export const uploadEnquiryImage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (req.file) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }

      return res.status(400).json({
        message: "Invalid enquiry ID.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload.",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!enquiry) {
      await fs.promises.unlink(req.file.path).catch(() => {});

      return res.status(404).json({
        message: "Enquiry not found.",
      });
    }

    // Save the image URL in the enquiry
    enquiry.referenceImage = `/uploads/enquiries/${req.file.filename}`;

    await enquiry.save();

    return res.status(200).json({
      message: "Enquiry image uploaded successfully.",
      referenceImage: enquiry.referenceImage,
      enquiry,
    });
  } catch (error) {
    if (req.file) {
      await fs.promises.unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      message: "Failed to upload enquiry image.",
      error: error.message,
    });
  }
};
