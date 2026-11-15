import "dotenv/config";
import { setServers } from "node:dns";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";

// Fix DNS for this separate Node.js process
setServers(["8.8.8.8", "8.8.4.4"]);

const createSuperAdmin = async () => {
  try {
    const {
      MONGO_URI,
      SUPER_ADMIN_NAME,
      SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_PASSWORD,
      JWT_SECRET,
    } = process.env;

    if (
      !MONGO_URI ||
      !SUPER_ADMIN_NAME ||
      !SUPER_ADMIN_EMAIL ||
      !SUPER_ADMIN_PASSWORD ||
      !JWT_SECRET
    ) {
      throw new Error("Missing required environment variables");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully");

    const email = SUPER_ADMIN_EMAIL.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Super Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    const admin = await User.create({
      name: SUPER_ADMIN_NAME,
      email,
      password: hashedPassword,
      role: "super_admin",
      company: null,
      status: "active",
    });

    console.log("Super Admin created successfully!");
    console.log("Admin ID:", admin._id);
    console.log("Admin Email:", admin.email);
  } catch (error) {
    console.error("Super Admin creation failed:", error.message);

    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

createSuperAdmin();
