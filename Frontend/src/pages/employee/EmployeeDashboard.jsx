import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Mail,
  ShieldCheck,
  UserRound,
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
} from "lucide-react";
import API from "../../api/api";

// Get today's date in India
const getTodayDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

// Format time in Indian timezone
const formatTime = (time) => {
  if (!time) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(time));
};

// Get employee's current GPS location
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Unable to get your location.";

        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please allow location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Your current location is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
};

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Attendance states
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSuccess, setAttendanceSuccess] = useState("");

  // Fetch employee dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await API.get("/employee/dashboard");

        setEmployee(response.data.employee);
        setCompany(response.data.company);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load employee dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Fetch employee attendance
  const fetchAttendance = useCallback(async () => {
    try {
      setAttendanceError("");

      const response = await API.get("/attendance/my-attendance");

      setAttendance(response.data.attendance || []);
    } catch (err) {
      setAttendanceError(
        err.response?.data?.message || "Unable to load today's attendance.",
      );
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Find today's attendance record
  const todayRecord = attendance.find(
    (record) => record.date === getTodayDate(),
  );

  const hasCheckedIn = Boolean(todayRecord?.checkIn?.time);
  const hasCheckedOut = Boolean(todayRecord?.checkOut?.time);

  // Handle check-in and check-out
  const handleAttendanceAction = async (action) => {
    setAttendanceError("");
    setAttendanceSuccess("");

    try {
      setActionLoading(action);

      // Get current GPS coordinates
      const location = await getCurrentLocation();

      let response;

      if (action === "check-in") {
        response = await API.post("/attendance/check-in", location);
      } else {
        response = await API.patch("/attendance/check-out", location);
      }

      setAttendanceSuccess(
        response.data.message ||
          `${action === "check-in" ? "Check-in" : "Check-out"} successful.`,
      );

      // Refresh attendance after successful action
      await fetchAttendance();
    } catch (err) {
      setAttendanceError(
        err.response?.data?.message ||
          err.message ||
          "Attendance operation failed.",
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
        Employee information is not available.
      </div>
    );
  }

  const details = [
    {
      label: "Employee Name",
      value: employee.name,
      icon: UserRound,
    },
    {
      label: "Email Address",
      value: employee.email,
      icon: Mail,
    },
    {
      label: "Role",
      value: employee.role,
      icon: ShieldCheck,
    },
    {
      label: "Company",
      value: company?.companyName || "Not available",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="rounded-xl bg-blue-600 p-6 text-white">
        <p className="text-sm text-blue-100">Employee Dashboard</p>

        <h1 className="mt-2 text-2xl font-bold">Welcome, {employee.name}!</h1>

        <p className="mt-2 text-sm text-blue-100">
          Here is an overview of your employee account.
        </p>
      </div>

      {/* Today's Attendance - Check In / Check Out */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <CalendarCheck className="text-blue-600" size={24} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Today's Attendance
              </h2>

              <p className="text-sm text-gray-500">
                {new Intl.DateTimeFormat("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                }).format(new Date())}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAttendance}
            disabled={attendanceLoading || Boolean(actionLoading)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Attendance messages */}
        {attendanceError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {attendanceError}
          </div>
        )}

        {attendanceSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {attendanceSuccess}
          </div>
        )}

        {attendanceLoading ? (
          <div className="py-6 text-center text-gray-500">
            Loading attendance...
          </div>
        ) : (
          <>
            {/* Today's attendance information */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Status</p>

                <p className="mt-2 font-semibold capitalize text-gray-800">
                  {todayRecord?.status || "Not marked"}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Check In</p>

                <p className="mt-2 font-semibold text-gray-800">
                  {formatTime(todayRecord?.checkIn?.time)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Check Out</p>

                <p className="mt-2 font-semibold text-gray-800">
                  {formatTime(todayRecord?.checkOut?.time)}
                </p>
              </div>
            </div>

            {/* Check In and Check Out buttons */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleAttendanceAction("check-in")}
                disabled={
                  Boolean(actionLoading) ||
                  hasCheckedIn ||
                  employee.status !== "active"
                }
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={19} />

                {actionLoading === "check-in"
                  ? "Checking In..."
                  : hasCheckedIn
                    ? "Already Checked In"
                    : "Check In"}
              </button>

              <button
                type="button"
                onClick={() => handleAttendanceAction("check-out")}
                disabled={
                  Boolean(actionLoading) ||
                  !hasCheckedIn ||
                  hasCheckedOut ||
                  employee.status !== "active"
                }
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={19} />

                {actionLoading === "check-out"
                  ? "Checking Out..."
                  : hasCheckedOut
                    ? "Already Checked Out"
                    : "Check Out"}
              </button>
            </div>
          </>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <MapPin size={15} className="mt-0.5 shrink-0" />

          <p>
            Your browser will request your current location. Attendance is
            accepted only if your location passes the company's GPS validation.
          </p>
        </div>
      </div>

      {/* Account status */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="font-semibold text-gray-800">Account Status</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your current employee account status
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            employee.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {employee.status || "Unknown"}
        </span>
      </div>

      {/* Employee details */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          My Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {details.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <Icon size={21} className="text-blue-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">{item.label}</p>

                    <p className="mt-1 wrap-break-word font-semibold text-gray-800">
                      {item.value || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
