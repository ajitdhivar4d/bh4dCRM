import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  RefreshCw,
  UserRound,
  ClipboardList,
  CircleCheck,
  MessageSquare,
  FileCheck,
  XCircle,
} from "lucide-react";
import API from "../../api/api";

const getTodayDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
};

const formatWorkingTime = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

const formatTime = (time) => {
  if (!time) return "-";

  return new Date(time).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const OwnerDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  // Fetch dashboard and attendance data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const today = getTodayDate();

      const [
        dashboardResponse,
        attendanceResponse,
        customerResponse,
        enquiryResponse,
      ] = await Promise.all([
        API.get("/company/dashboard"),

        API.get("/attendance/company-report", {
          params: { date: today },
        }),

        API.get("/customers"),

        API.get("/enquiries"),
      ]);

      setDashboard(dashboardResponse.data);

      setAttendance(attendanceResponse.data.attendance || []);

      setCustomers(customerResponse.data.customers || []);

      setEnquiries(enquiryResponse.data.enquiries || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>

        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const { user, company, statistics } = dashboard;

  // Employees who have checked in today
  const presentEmployees = new Set(
    attendance
      .filter((record) =>
        ["present", "late", "half_day"].includes(record.status),
      )
      .map((record) => record.employee?._id || record.employee?.email)
      .filter(Boolean),
  );

  const presentCount = presentEmployees.size;

  const absentCount = Math.max(
    0,
    (statistics?.activeEmployees || 0) - presentCount,
  );

  // Customer statistics
  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "active",
  ).length;

  // Enquiry statistics
  const totalEnquiries = enquiries.length;

  const newEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "new",
  ).length;

  const convertedEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "converted",
  ).length;

  const lostEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "lost",
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Owner Dashboard</h1>

          <p className="mt-2 text-gray-500">Welcome back, {user?.name}</p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={statistics?.totalEmployees || 0}
          icon={<Users size={26} />}
        />

        <StatCard
          title="Active Employees"
          value={statistics?.activeEmployees || 0}
          icon={<UserCheck size={26} />}
        />

        <StatCard
          title="Present Today"
          value={presentCount}
          icon={<UserCheck size={26} />}
        />

        <StatCard
          title="Absent Today"
          value={absentCount}
          icon={<UserX size={26} />}
        />
      </div>

      {/* CRM Overview */}
      <div className="mt-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">CRM Overview</h2>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your customers and enquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            icon={<UserRound size={26} />}
          />

          <StatCard
            title="Active Customers"
            value={activeCustomers}
            icon={<CircleCheck size={26} />}
          />

          <StatCard
            title="Total Enquiries"
            value={totalEnquiries}
            icon={<ClipboardList size={26} />}
          />

          <StatCard
            title="New Enquiries"
            value={newEnquiries}
            icon={<MessageSquare size={26} />}
          />

          <StatCard
            title="Converted Enquiries"
            value={convertedEnquiries}
            icon={<FileCheck size={26} />}
          />

          <StatCard
            title="Lost Enquiries"
            value={lostEnquiries}
            icon={<XCircle size={26} />}
          />
        </div>
      </div>

      {/* Company Information */}
      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Building2 className="text-blue-600" size={28} />

          <h2 className="text-xl font-semibold text-gray-800">
            Company Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoItem label="Company Name" value={company?.companyName} />

          <InfoItem label="Company Email" value={company?.email} />

          <InfoItem label="Phone" value={company?.phone} />

          <InfoItem label="Address" value={company?.address} />

          <InfoItem label="Company Status" value={company?.status} />

          <InfoItem label="Owner Email" value={user?.email} />
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Today's Attendance
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Attendance records for {getTodayDate()}
          </p>
        </div>

        {attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No attendance records found for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-sm text-gray-600">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Working Time</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((record) => (
                  <tr key={record._id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium text-gray-800">
                        {record.employee?.name || "Unknown"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {record.employee?.email || ""}
                      </p>
                    </td>

                    <td className="p-4 text-gray-600">
                      {formatTime(record.checkIn?.time)}
                    </td>

                    <td className="p-4 text-gray-600">
                      {formatTime(record.checkOut?.time)}
                    </td>

                    <td className="p-4 text-gray-600">
                      {formatWorkingTime(record.totalWorkingMinutes)}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {record.status || "Unknown"}
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

// Reusable statistics card
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 text-blue-600">{icon}</div>

      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="mt-2 text-3xl font-bold text-gray-800">{value}</h2>
    </div>
  );
};

// Reusable company information item
const InfoItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 font-medium text-gray-800">{value || "-"}</p>
    </div>
  );
};

export default OwnerDashboard;
