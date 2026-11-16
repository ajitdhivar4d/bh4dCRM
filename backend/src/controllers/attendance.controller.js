import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { validateAttendanceLocation } from "../utils/validateAttendanceLocation.js";
import Leave from "../models/Leave.js";

// Get today's date in India
const getTodayDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

// Get today's weekday in India
const getTodayDayInIndia = (date = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(date);

// Check whether today is a company weekly off
const isWeeklyOff = (company, date = new Date()) => {
  const weeklyOffDays = company.attendanceSettings?.weeklyOffDays ?? ["Sunday"];

  const todayDay = getTodayDayInIndia(date);

  return weeklyOffDays.includes(todayDay);
};

// Get current time in India as minutes from midnight
const getMinutesInIndia = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour").value);
  const minute = Number(parts.find((p) => p.type === "minute").value);

  return hour * 60 + minute;
};

// Convert HH:mm into minutes
const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Calculate late arrival
const getCheckInDetails = (checkInTime, settings) => {
  const actualMinutes = getMinutesInIndia(checkInTime);

  const officeStartMinutes = parseTimeToMinutes(
    settings?.officeStartTime || "10:00",
  );

  const gracePeriod = settings?.gracePeriodMinutes ?? 10;

  const isLate = actualMinutes > officeStartMinutes + gracePeriod;

  const lateMinutes = isLate ? actualMinutes - officeStartMinutes : 0;

  return {
    isLate,
    lateMinutes,
  };
};

// Calculate attendance status from working minutes
const getAttendanceStatus = (workingMinutes, settings) => {
  const absentBelowMinutes = settings?.absentBelowMinutes ?? 180;
  const requiredWorkingMinutes = settings?.requiredWorkingMinutes ?? 420;

  if (workingMinutes < absentBelowMinutes) {
    return "absent";
  }

  if (workingMinutes < requiredWorkingMinutes) {
    return "half_day";
  }

  return "present";
};

// Verify employee's office GPS location
const verifyOfficeLocation = (company, latitude, longitude) => {
  const settings = company.attendanceSettings;

  if (
    settings?.officeLocation?.latitude == null ||
    settings?.officeLocation?.longitude == null
  ) {
    throw new Error("Company office GPS location is not configured");
  }

  const result = validateAttendanceLocation(
    latitude,
    longitude,
    settings.officeLocation.latitude,
    settings.officeLocation.longitude,
    settings.allowedRadius ?? 200,
  );

  if (!result.valid) {
    throw new Error(result.message);
  }

  return result;
};

// POST: Employee Check-in
export const checkIn = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Only employees can check in",
      });
    }

    const { latitude, longitude } = req.body;

    const employee = await User.findById(req.user.id);

    if (!employee || !employee.company) {
      return res.status(404).json({
        success: false,
        message: "Employee or company not found",
      });
    }

    if (employee.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const company = await Company.findById(employee.company);

    if (!company || company.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Company is not active",
      });
    }
    // Prevent check-in on weekly off days
    if (isWeeklyOff(company)) {
      return res.status(400).json({
        success: false,
        message: "Today is a weekly off. Attendance is not required.",
      });
    }

    // Prevent check-in after office closing time
    const officeEndTime = company.attendanceSettings?.officeEndTime || "18:00";

    const currentMinutes = getMinutesInIndia(new Date());
    const officeEndMinutes = parseTimeToMinutes(officeEndTime);

    if (currentMinutes >= officeEndMinutes) {
      return res.status(400).json({
        success: false,
        message:
          "Check-in is closed for today. Office closing time has passed.",
      });
    }

    const location = verifyOfficeLocation(company, latitude, longitude);

    const date = getTodayDate();

    const existingAttendance = await Attendance.findOne({
      company: employee.company,
      employee: employee._id,
      date,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    // Use the same timestamp for calculation and database storage
    const checkInTime = new Date();

    const { isLate, lateMinutes } = getCheckInDetails(
      checkInTime,
      company.attendanceSettings,
    );

    const attendance = await Attendance.create({
      company: employee.company,
      employee: employee._id,
      date,

      checkIn: {
        time: checkInTime,
        latitude,
        longitude,
      },

      isLate,
      lateMinutes,
      status: "present",
    });

    return res.status(201).json({
      success: true,
      message: isLate ? "Late check-in successful" : "Check-in successful",
      distance: location.distance,
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH: Employee Check-out
export const checkOut = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Only employees can check out",
      });
    }

    const { latitude, longitude } = req.body;

    const employee = await User.findById(req.user.id);

    if (!employee || !employee.company) {
      return res.status(404).json({
        success: false,
        message: "Employee or company not found",
      });
    }

    if (employee.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const company = await Company.findById(employee.company);

    if (!company || company.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Company is not active",
      });
    }

    const location = verifyOfficeLocation(company, latitude, longitude);

    const attendance = await Attendance.findOne({
      company: employee.company,
      employee: employee._id,
      date: getTodayDate(),
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Please check in first",
      });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({
        success: false,
        message: "Already checked out",
      });
    }

    if (!attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: "Check-in time is missing",
      });
    }

    const checkOutTime = new Date();

    const elapsedMinutes = Math.floor(
      (checkOutTime - attendance.checkIn.time) / 60000,
    );

    const netWorkingMinutes = elapsedMinutes - attendance.breakMinutes;

    if (netWorkingMinutes < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid working time",
      });
    }

    // Automatically calculate final attendance status
    const finalStatus = getAttendanceStatus(
      netWorkingMinutes,
      company.attendanceSettings,
    );

    attendance.checkOut = {
      time: checkOutTime,
      latitude,
      longitude,
    };

    attendance.totalWorkingMinutes = netWorkingMinutes;
    attendance.status = finalStatus;

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      distance: location.distance,
      totalWorkingMinutes: attendance.totalWorkingMinutes,
      status: attendance.status,
      isLate: attendance.isLate,
      lateMinutes: attendance.lateMinutes,
      attendance,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Employee Attendance History
export const getMyAttendance = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Employee access only",
      });
    }

    const attendance = await Attendance.find({
      company: req.user.company,
      employee: req.user.id,
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Company Owner Attendance Report
export const getCompanyAttendance = async (req, res) => {
  try {
    if (req.user.role !== "company_owner") {
      return res.status(403).json({
        success: false,
        message: "Company owner access only",
      });
    }

    const { date, employeeId } = req.query;

    const filter = {
      company: req.user.company,
    };

    if (date) filter.date = date;
    if (employeeId) filter.employee = employeeId;

    const attendance = await Attendance.find(filter)
      .populate("employee", "name email")
      .sort({ date: -1 });

    const company = await Company.findById(req.user.company).select(
      "attendanceSettings.weeklyOffDays",
    );

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
      weeklyOffDays: company?.attendanceSettings?.weeklyOffDays ?? ["Sunday"],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Company Owner Monthly Attendance Report
export const getMonthlyAttendanceReport = async (req, res) => {
  try {
    if (req.user.role !== "company_owner") {
      return res.status(403).json({
        success: false,
        message: "Company owner access only",
      });
    }

    const { month } = req.query;

    // Validate YYYY-MM
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Please provide month in YYYY-MM format.",
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);

    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    // Do not count future dates
    const lastDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;
    const reportEndDate = lastDate < today ? lastDate : today;

    // If selected month is in the future
    if (`${month}-01` > today) {
      return res.status(200).json({
        success: true,
        month,
        employees: [],
      });
    }

    const company = await Company.findOne({
      _id: req.user.company,
      owner: req.user._id,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    const currentMinutes = getMinutesInIndia(new Date());

    const officeEndMinutes = parseTimeToMinutes(
      company.attendanceSettings?.officeEndTime || "18:00",
    );

    const weeklyOffDays = company.attendanceSettings?.weeklyOffDays ?? [
      "Sunday",
    ];

    // Get active and inactive employees for historical reporting
    const employees = await User.find({
      company: company._id,
      role: "employee",
    }).select("name email status");

    // Get attendance records for selected month
    const attendanceRecords = await Attendance.find({
      company: company._id,
      date: {
        $gte: `${month}-01`,
        $lte: reportEndDate,
      },
    });

    // Get approved leaves overlapping selected month
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));

    const approvedLeaves = await Leave.find({
      company: company._id,
      status: "approved",
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    }).select("employee startDate endDate");

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      attendanceMap.set(`${record.employee.toString()}_${record.date}`, record);
    });

    const leaveMap = new Map();

    approvedLeaves.forEach((leave) => {
      const current = new Date(
        Math.max(leave.startDate.getTime(), monthStart.getTime()),
      );

      const end = new Date(
        Math.min(leave.endDate.getTime(), monthEnd.getTime()),
      );

      while (current <= end) {
        const date = current.toISOString().slice(0, 10);

        leaveMap.set(`${leave.employee.toString()}_${date}`, true);

        current.setUTCDate(current.getUTCDate() + 1);
      }
    });

    const reportEmployees = employees.map((employee) => {
      const summary = {
        present: 0,
        late: 0,
        halfDay: 0,
        absent: 0,
        weeklyOff: 0,
        leave: 0,
        notMarked: 0,
      };

      const dailyRecords = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${month}-${String(day).padStart(2, "0")}`;

        // Skip future dates
        if (date > reportEndDate) break;

        const weekday = new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          weekday: "long",
        }).format(new Date(`${date}T00:00:00.000Z`));

        const key = `${employee._id.toString()}_${date}`;

        const attendance = attendanceMap.get(key);
        const isLeave = leaveMap.has(key);
        const isWeeklyOff = weeklyOffDays.includes(weekday);

        let status;

        if (isWeeklyOff) {
          status = "weekly_off";
          summary.weeklyOff++;
        } else if (isLeave) {
          status = "leave";
          summary.leave++;
        } else if (attendance) {
          status = attendance.status;

          if (attendance.status === "present" || attendance.status === "late") {
            summary.present++;
          } else if (attendance.status === "half_day") {
            summary.halfDay++;
          } else if (attendance.status === "absent") {
            summary.absent++;
          }

          // Count late arrivals independently of attendance status
          if (attendance.isLate) {
            summary.late++;
          }
        } else if (date === today && currentMinutes < officeEndMinutes) {
          status = "not_marked";
          summary.notMarked++;
        } else {
          status = "absent";
          summary.absent++;
        }

        dailyRecords.push({
          date,
          weekday,
          status,
          isLate: attendance?.isLate ?? false,
          lateMinutes: attendance?.lateMinutes ?? 0,
          totalWorkingMinutes: attendance?.totalWorkingMinutes ?? 0,
        });
      }

      return {
        employee: {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          status: employee.status,
        },
        summary,
        dailyRecords,
      };
    });

    return res.status(200).json({
      success: true,
      month,
      weeklyOffDays,
      employees: reportEmployees,
    });
  } catch (error) {
    console.error("Monthly attendance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate monthly attendance report.",
    });
  }
};
