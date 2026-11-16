import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  RefreshCw,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Coffee,
  CalendarCheck,
  Eye,
  X,
} from "lucide-react";
import API from "../../api/api";

const getCurrentMonth = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  })
    .format(new Date())
    .slice(0, 7);

const statusStyles = {
  present: "bg-green-100 text-green-700",
  late: "bg-orange-100 text-orange-700",
  half_day: "bg-yellow-100 text-yellow-700",
  absent: "bg-red-100 text-red-700",
  weekly_off: "bg-blue-100 text-blue-700",
  leave: "bg-purple-100 text-purple-700",
  not_marked: "bg-gray-100 text-gray-600",
};

const formatStatus = (status) => {
  const labels = {
    present: "Present",
    late: "Late",
    half_day: "Half Day",
    absent: "Absent",
    weekly_off: "Weekly Off",
    leave: "Leave",
    not_marked: "Not Marked",
  };

  return labels[status] || status || "Unknown";
};

const formatMinutes = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

export default function MonthlyAttendanceReport() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/attendance/monthly-report", {
        params: { month },
      });

      setEmployees(response.data.employees || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load monthly attendance report.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((item) => {
      const employee = item.employee || item;
      const searchText = search.toLowerCase();

      return (
        employee.name?.toLowerCase().includes(searchText) ||
        employee.email?.toLowerCase().includes(searchText)
      );
    });
  }, [employees, search]);

  const totals = useMemo(() => {
    return employees.reduce(
      (result, item) => {
        const summary = item.summary || {};

        result.present += summary.present || 0;
        result.late += summary.late || 0;
        result.halfDay += summary.halfDay || 0;
        result.absent += summary.absent || 0;
        result.weeklyOff += summary.weeklyOff || 0;
        result.leave += summary.leave || 0;

        return result;
      },
      {
        present: 0,
        late: 0,
        halfDay: 0,
        absent: 0,
        weeklyOff: 0,
        leave: 0,
      },
    );
  }, [employees]);

  const summaryCards = [
    {
      label: "Present",
      value: totals.present,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Late",
      value: totals.late,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Half Day",
      value: totals.halfDay,
      icon: Coffee,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Absent",
      value: totals.absent,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Weekly Off",
      value: totals.weeklyOff,
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Leave",
      value: totals.leave,
      icon: CalendarDays,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Monthly Attendance Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View employee attendance summaries and daily records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <CalendarDays size={18} className="text-gray-500" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}
              >
                <Icon size={20} className={card.color} />
              </div>

              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Employee Report */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-gray-800">
              <Users size={19} />
              Employee Monthly Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredEmployees.length} employee(s) found
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading attendance report...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No employee attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Late</th>
                  <th className="px-4 py-3">Half Day</th>
                  <th className="px-4 py-3">Absent</th>
                  <th className="px-4 py-3">Weekly Off</th>
                  <th className="px-4 py-3">Leave</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((item) => {
                  const employee = item.employee || item;
                  const summary = item.summary || {};

                  return (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-800">
                          {employee.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {employee.email}
                        </p>
                      </td>

                      <td className="px-4 py-4 font-medium text-green-700">
                        {summary.present || 0}
                      </td>
                      <td className="px-4 py-4 font-medium text-orange-600">
                        {summary.late || 0}
                      </td>
                      <td className="px-4 py-4">{summary.halfDay || 0}</td>
                      <td className="px-4 py-4 font-medium text-red-600">
                        {summary.absent || 0}
                      </td>
                      <td className="px-4 py-4">{summary.weeklyOff || 0}</td>
                      <td className="px-4 py-4">{summary.leave || 0}</td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedEmployee(item)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Eye size={15} />
                          View Days
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Records Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h2 className="font-semibold text-gray-800">
                  {(selectedEmployee.employee || selectedEmployee).name}
                </h2>
                <p className="text-sm text-gray-500">
                  Daily attendance — {month}
                </p>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Day</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Working Hours</th>
                    <th className="px-3 py-3">Late Minutes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {(selectedEmployee.dailyRecords || []).map((record) => (
                    <tr key={record.date}>
                      <td className="px-3 py-3 text-gray-700">{record.date}</td>
                      <td className="px-3 py-3 text-gray-600">
                        {record.weekday}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[record.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {formatStatus(record.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {formatMinutes(record.totalWorkingMinutes)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {record.lateMinutes || 0} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(!selectedEmployee.dailyRecords ||
                selectedEmployee.dailyRecords.length === 0) && (
                <p className="py-8 text-center text-sm text-gray-500">
                  No daily records available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
