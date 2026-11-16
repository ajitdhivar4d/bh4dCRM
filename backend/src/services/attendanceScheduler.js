import cron from "node-cron";

import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Company from "../models/Company.js";

import Leave from "../models/Leave.js";

// Current date in India: YYYY-MM-DD
const getTodayDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
};

// Current weekday in India
const getTodayDayInIndia = () => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(new Date());
};

// Current time in India: minutes from midnight
const getCurrentMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hours = Number(parts.find((p) => p.type === "hour").value);
  const minutes = Number(parts.find((p) => p.type === "minute").value);

  return hours * 60 + minutes;
};

// Convert HH:mm into minutes
const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

// Mark employees absent
export const markDailyAbsences = async () => {
  const date = getTodayDate();
  const todayDay = getTodayDayInIndia();
  const currentMinutes = getCurrentMinutes();

  // Find active companies
  const companies = await Company.find({
    status: "active",
  }).select("_id attendanceSettings");

  let totalMarked = 0;

  for (const company of companies) {
    const settings = company.attendanceSettings;

    // Skip company weekly off days
    const weeklyOffDays = settings?.weeklyOffDays ?? ["Sunday"];

    if (weeklyOffDays.includes(todayDay)) {
      console.log(
        `[Attendance] Skipping ${company._id}: ${todayDay} is a weekly off`,
      );
      continue;
    }

    // Company office closing time
    const officeEndTime = settings?.officeEndTime || "18:00";

    const officeEndMinutes = parseTimeToMinutes(officeEndTime);

    // Wait until company's office closing time
    if (currentMinutes < officeEndMinutes) {
      continue;
    }

    // Find active employees belonging to this company
    const employees = await User.find({
      company: company._id,
      role: "employee",
      status: "active",
    }).select("_id");

    // Get today's date boundaries (India date stored as UTC date)
    const todayStart = new Date(`${date}T00:00:00.000Z`);
    const todayEnd = new Date(`${date}T23:59:59.999Z`);

    // Find employees who have approved leave today
    const approvedLeaves = await Leave.find({
      company: company._id,
      status: "approved",
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
    }).select("employee");

    const employeesOnLeave = new Set(
      approvedLeaves.map((leave) => leave.employee.toString()),
    );

    // Exclude employees who are on approved leave
    const employeesToMarkAbsent = employees.filter(
      (employee) => !employeesOnLeave.has(employee._id.toString()),
    );

    if (employees.length === 0) {
      continue;
    }
    if (employeesToMarkAbsent.length === 0) {
      console.log(
        `[Attendance] All employees are present or on approved leave for ${date}`,
      );
      continue;
    }

    // Create absent records only if today's record does not exist
    const operations = employeesToMarkAbsent.map((employee) => ({
      updateOne: {
        filter: {
          company: company._id,
          employee: employee._id,
          date,
        },
        update: {
          $setOnInsert: {
            company: company._id,
            employee: employee._id,
            date,
            status: "absent",
            breakMinutes: 0,
            totalWorkingMinutes: 0,
            isLate: false,
            lateMinutes: 0,
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(operations, {
      ordered: false,
    });

    totalMarked += result.upsertedCount;
  }

  if (totalMarked > 0) {
    console.log(
      `[Attendance] ${totalMarked} absent records created for ${date}`,
    );
  }
};

// Run every minute
export const startAttendanceScheduler = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await markDailyAbsences();
      } catch (error) {
        console.error("[Attendance Scheduler Error]:", error.message);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log("[Attendance] Automatic absence scheduler started");
};
