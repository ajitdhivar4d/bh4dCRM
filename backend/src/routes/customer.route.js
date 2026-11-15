import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import {
  protect,
  companyOwnerOnly,
  companyMemberOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Owner and employees: Add and view customers
router.post("/", protect, companyMemberOnly, createCustomer);
router.get("/", protect, companyMemberOnly, getCustomers);
router.get("/:id", protect, companyMemberOnly, getCustomerById);

// Owner and employees: Edit customers
router.put("/:id", protect, companyMemberOnly, updateCustomer);

// Only company owner: Delete customers
router.delete("/:id", protect, companyOwnerOnly, deleteCustomer);

export default router;
