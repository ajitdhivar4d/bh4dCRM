import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users, RefreshCw, Search } from "lucide-react";
import API from "../../api/api";

// Get today's date in India
const getTodayDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

// Format date for display
const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T00:00:00+05:30`));
};

// Format timestamp
const formatTime = (time) => {
  if (!time) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(time));
};

// Convert minutes into hours and minutes
const formatDuration = (minutes) => {
  if (minutes == null) return "—";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

const OwnerAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weeklyOffDays, setWeeklyOffDays] = useState(["Sunday"]);

  // Fetch company attendance report
  const fetchAttendance = async (date = selectedDate) => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/attendance/company-report", {
        params: { date },
      });

      setAttendance(response.data.attendance || []);
      setWeeklyOffDays(response.data.weeklyOffDays ?? ["Sunday"]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load attendance report.",
      );
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  // Load today's report when page opens
  useEffect(() => {
    fetchAttendance(getTodayDate());
  }, []);

  // Calculate statistics from returned records
  const totalRecords = attendance.length;

  const presentCount = attendance.filter((record) =>
    ["present", "late", "half_day"].includes(record.status),
  ).length;

  const lateCount = attendance.filter(
    (record) => record.status === "late",
  ).length;

  const halfDayCount = attendance.filter(
    (record) => record.status === "half_day",
  ).length;

  // Check whether selected date is a weekly off
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const selectedDay = selectedDate
    ? dayNames[new Date(`${selectedDate}T00:00:00Z`).getUTCDay()]
    : null;

  const isSelectedDateWeeklyOff =
    selectedDay && weeklyOffDays.includes(selectedDay);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Attendance Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor employee attendance and daily working hours.
        </p>
      </div>

      {/* Date filter */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="attendanceDate"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Select Attendance Date
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="attendanceDate"
              type="date"
              value={selectedDate}
              max={getTodayDate()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchAttendance(selectedDate)}
            disabled={loading || !selectedDate}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:flex-none"
          >
            <Search size={17} />
            View Report
          </button>

          <button
            type="button"
            onClick={() => fetchAttendance(selectedDate)}
            disabled={loading}
            className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh report"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Weekly Off message */}
      {isSelectedDateWeeklyOff && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" size={24} />

            <div>
              <h3 className="font-semibold text-blue-800">Weekly Off</h3>

              <p className="mt-1 text-sm text-blue-700">
                {selectedDay} is a weekly holiday for your company. Employees
                are not required to mark attendance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Records"
          value={totalRecords}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Present / Late / Half Day"
          value={presentCount}
          icon={CalendarDays}
          color="green"
        />

        <StatCard
          title="Late Employees"
          value={lateCount}
          icon={Clock}
          color="yellow"
        />

        <StatCard
          title="Half Day"
          value={halfDayCount}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Attendance table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800">
            Employee Attendance Report
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Attendance for {formatDate(selectedDate)}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading attendance report...
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {isSelectedDateWeeklyOff
              ? "Weekly Off — No attendance is required today."
              : "No attendance records found for this date."}{" "}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Check In</th>
                  <th className="px-5 py-3 font-semibold">Check Out</th>
                  <th className="px-5 py-3 font-semibold">Working Hours</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {attendance.map((record) => (
                  <tr key={record._id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {record.employee?.name || "Unknown"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {record.employee?.email || "—"}
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
                      <StatusBadge status={record.status} />
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

// Statistics card
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
        </div>

        <div className={`rounded-lg p-3 ${colors[color]}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
};

// Attendance status badge
const StatusBadge = ({ status }) => {
  const styles = {
    present: "bg-green-100 text-green-700",
    late: "bg-yellow-100 text-yellow-700",
    half_day: "bg-orange-100 text-orange-700",
    absent: "bg-red-100 text-red-700",
    weekly_off: "bg-blue-100 text-blue-700",
  };

  const normalizedStatus = status || "unknown";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[normalizedStatus] || "bg-gray-100 text-gray-600"
      }`}
    >
      {normalizedStatus === "weekly_off"
        ? "Weekly Off"
        : normalizedStatus.replace("_", " ")}
    </span>
  );
};

export default OwnerAttendance;
