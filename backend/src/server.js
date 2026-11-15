import "dotenv/config";
import { setServers } from "node:dns";
import mongoose from "mongoose";
import app from "./app.js";
import { startAttendanceScheduler } from "./services/attendanceScheduler.js";

// Fix Node.js DNS resolution for MongoDB Atlas
setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    startAttendanceScheduler();
    console.log("MongoDB Atlas connected successfully");

    app.listen(PORT, () => {
      console.log(`BH4D MyCRM server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
