import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
    },

    checkIn: {
      time: {
        type: Date,
        default: null,
      },
      latitude: Number,
      longitude: Number,
    },

    checkOut: {
      time: {
        type: Date,
        default: null,
      },
      latitude: Number,
      longitude: Number,
    },

    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWorkingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tracks late arrival independently of attendance status
    isLate: {
      type: Boolean,
      default: false,
    },

    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["present", "late", "absent", "half_day"],
      default: "present",
    },
  },
  { timestamps: true },
);

// One record per employee per company per day
attendanceSchema.index({ company: 1, employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
