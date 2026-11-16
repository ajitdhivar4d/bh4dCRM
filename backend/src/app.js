import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import companyRoutes from "./routes/company.route.js";
import authRoutes from "./routes/auth.route.js";
import employeeRoutes from "./routes/employee.route.js";
import superAdminRoutes from "./routes/superAdmin.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import customerRoutes from "./routes/customer.route.js";
import enquiryRoutes from "./routes/enquiry.route.js";
import followUpRoutes from "./routes/followUp.route.js";
import leaveRoutes from "./routes/leaveRoutes.js";

const app = express();

// Resolve project folders correctly in local and Render environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/company", companyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/superAdmin", superAdminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/leave", leaveRoutes);

// Uploaded enquiry images
app.use("/uploads", express.static("uploads"));

// Serve the built React frontend
app.use(express.static(frontendDistPath));

// React Router fallback
app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  // Unknown API and upload paths should not return React HTML
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }

  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default app;
