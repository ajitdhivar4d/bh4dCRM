import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "suspended"],
      default: "pending",
    },

    attendanceSettings: {
      // GPS settings
      officeLocation: {
        latitude: {
          type: Number,
          default: 27.160056,
        },
        longitude: {
          type: Number,
          default: 75.711361,
        },
      },

      allowedRadius: {
        type: Number,
        default: 200,
      },

      // Office working schedule
      officeStartTime: {
        type: String,
        default: "10:00",
      },

      officeEndTime: {
        type: String,
        default: "18:00",
      },

      // Weekly Off Settings
      weeklyOffDays: {
        type: [
          {
            type: String,
            enum: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
          },
        ],
        default: ["Sunday"],
      },

      // Break settings
      lunchBreakMinutes: {
        type: Number,
        default: 60,
        min: 0,
      },

      // Attendance rules
      requiredWorkingMinutes: {
        type: Number,
        default: 420,
        min: 1,
      },

      gracePeriodMinutes: {
        type: Number,
        default: 10,
        min: 0,
      },

      absentBelowMinutes: {
        type: Number,
        default: 180,
        min: 0,
      },

      halfDayBelowMinutes: {
        type: Number,
        default: 360,
        min: 1,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model("Company", companySchema);

export default Company;
