import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
} from "lucide-react";
import API from "../../api/api";

// Get today's date in India as YYYY-MM-DD
const getTodayDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

// Format a date for display
const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T00:00:00+05:30`));
};

// Format a timestamp for display
const formatTime = (time) => {
  if (!time) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(time));
};

// Convert working minutes into hours and minutes
const formatDuration = (minutes) => {
  if (minutes == null) return "—";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

// Get the employee's current location
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

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch attendance history
  const fetchAttendance = useCallback(async () => {
    try {
      setError("");

      const response = await API.get("/attendance/my-attendance");

      setAttendance(response.data.attendance || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load attendance history.",
      );
    } finally {
      setLoading(false);
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
    setError("");
    setSuccess("");

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

      setSuccess(
        response.data.message ||
          `${action === "check-in" ? "Check-in" : "Check-out"} successful.`,
      );

      // Reload attendance history after the action
      await fetchAttendance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Attendance operation failed.",
      );
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>

          <p className="mt-1 text-sm text-gray-500">
            Check in, check out, and view your attendance history.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAttendance}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Today's attendance */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <CalendarCheck className="text-blue-600" size={24} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">Today's Attendance</h2>

            <p className="text-sm text-gray-500">
              {formatDate(getTodayDate())}
            </p>
          </div>
        </div>

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

        {/* Attendance action buttons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleAttendanceAction("check-in")}
            disabled={loading || Boolean(actionLoading) || hasCheckedIn}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              loading ||
              Boolean(actionLoading) ||
              !hasCheckedIn ||
              hasCheckedOut
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={19} />

            {actionLoading === "check-out"
              ? "Checking Out..."
              : hasCheckedOut
                ? "Already Checked Out"
                : "Check Out"}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <MapPin size={15} className="mt-0.5 shrink-0" />

          <p>
            Your browser will request your current location. Attendance is
            accepted only if your backend's company-location validation
            succeeds.
          </p>
        </div>
      </div>

      {/* Attendance history */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800">Attendance History</h2>

          <p className="mt-1 text-sm text-gray-500">
            Your recorded attendance entries.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading attendance history...
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock size={32} className="mx-auto mb-3 text-gray-400" />
            No attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Check In</th>
                  <th className="px-5 py-3 font-semibold">Check Out</th>
                  <th className="px-5 py-3 font-semibold">Working Hours</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {attendance.map((record) => (
                  <tr key={record._id || record.date}>
                    <td className="px-5 py-4 text-gray-700">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatTime(record.checkIn?.time)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatTime(record.checkOut?.time)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatDuration(record.totalWorkingMinutes)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          record.status === "present"
                            ? "bg-green-100 text-green-700"
                            : record.status === "late"
                              ? "bg-yellow-100 text-yellow-700"
                              : record.status === "half_day"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {(record.status || "unknown").replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendance;
