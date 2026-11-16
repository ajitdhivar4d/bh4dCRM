import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import API from "../../api/api";

const Employees = () => {
  const navigate = useNavigate();

  const { isImpersonating, enterEmployeeWorkspace } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch company employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/company/employees");

      const data = response.data;

      const employeeList = Array.isArray(data) ? data : data.employees || [];

      setEmployees(employeeList);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Search employees by name or email
  const filteredEmployees = employees.filter((employee) => {
    const searchValue = search.toLowerCase();

    return (
      employee.name?.toLowerCase().includes(searchValue) ||
      employee.email?.toLowerCase().includes(searchValue)
    );
  });

  // View employee details
  const handleView = async (employeeId) => {
    try {
      setDetailsLoading(true);
      setSelectedEmployee(null);
      setError("");

      const response = await API.get(`/company/employees/${employeeId}`);

      setSelectedEmployee(response.data.employee);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load employee details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Super Admin: Access employee workspace
  const handleViewAsEmployee = async (employee) => {
    try {
      setUpdatingId(employee._id);
      setError("");

      const response = await API.post(
        `/company/employees/${employee._id}/access`,
      );

      const { token, user } = response.data;

      const success = enterEmployeeWorkspace(user, token);

      if (!success) {
        throw new Error("Unable to access employee workspace.");
      }

      navigate("/employee/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to access employee workspace.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Activate or deactivate employee
  const handleStatusChange = async (employee) => {
    const newStatus = employee.status === "active" ? "inactive" : "active";

    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus} this employee?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingId(employee._id);
      setError("");

      const response = await API.patch(
        `/company/employees/${employee._id}/status`,
        { status: newStatus },
      );

      const updatedEmployee = response.data.employee;

      setEmployees((prev) =>
        prev.map((item) =>
          item._id === employee._id ? updatedEmployee : item,
        ),
      );

      // Update details modal if the same employee is open
      setSelectedEmployee((prev) =>
        prev?._id === employee._id ? updatedEmployee : prev,
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update employee status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Employee Management
          </h1>

          <p className="mt-2 text-gray-500">
            View and manage your company employees.
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-red-100 p-4 text-red-700">
          <p>{error}</p>

          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Employee statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          title="Total Employees"
          value={employees.length}
          icon={<Users size={25} />}
        />

        <StatCard
          title="Active Employees"
          value={
            employees.filter((employee) => employee.status === "active").length
          }
          icon={<UserCheck size={25} />}
        />

        <StatCard
          title="Inactive Employees"
          value={
            employees.filter((employee) => employee.status === "inactive")
              .length
          }
          icon={<UserX size={25} />}
        />
      </div>

      {/* Employee table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <h2 className="text-lg font-semibold text-gray-800">Employee List</h2>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No employees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-sm text-gray-600">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {employee.name}
                    </td>

                    <td className="p-4 text-gray-600">{employee.email}</td>

                    <td className="p-4">
                      <StatusBadge status={employee.status} />
                    </td>

                    <td className="p-4 text-gray-600">
                      {employee.createdAt
                        ? new Date(employee.createdAt).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isImpersonating && employee.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleViewAsEmployee(employee)}
                            disabled={updatingId === employee._id}
                            title="View as employee"
                            className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                          >
                            {updatingId === employee._id
                              ? "Opening..."
                              : "Access"}
                          </button>
                        )}
                        <button
                          onClick={() => handleView(employee._id)}
                          title="View employee"
                          className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => handleStatusChange(employee)}
                          disabled={updatingId === employee._id}
                          title={
                            employee.status === "active"
                              ? "Deactivate employee"
                              : "Activate employee"
                          }
                          className={`rounded-lg p-2 disabled:opacity-50 ${
                            employee.status === "active"
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {employee.status === "active" ? (
                            <UserX size={18} />
                          ) : (
                            <UserCheck size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee details modal */}
      {(detailsLoading || selectedEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Employee Details
              </h2>

              <button
                onClick={() => setSelectedEmployee(null)}
                disabled={detailsLoading}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={22} />
              </button>
            </div>

            {detailsLoading ? (
              <p className="py-8 text-center text-gray-500">
                Loading employee details...
              </p>
            ) : (
              <div className="space-y-4">
                <InfoItem
                  label="Employee Name"
                  value={selectedEmployee?.name}
                />

                <InfoItem label="Email" value={selectedEmployee?.email} />

                <InfoItem label="Role" value={selectedEmployee?.role} />

                <InfoItem label="Status" value={selectedEmployee?.status} />

                <InfoItem
                  label="Joined Date"
                  value={
                    selectedEmployee?.createdAt
                      ? new Date(selectedEmployee.createdAt).toLocaleDateString(
                          "en-IN",
                        )
                      : "-"
                  }
                />

                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="mt-4 w-full rounded-lg bg-gray-800 py-3 text-white hover:bg-gray-900"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Statistics card
const StatCard = ({ title, value, icon }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm">
    <div className="mb-3 text-blue-600">{icon}</div>

    <p className="text-sm text-gray-500">{title}</p>

    <h2 className="mt-1 text-2xl font-bold text-gray-800">{value}</h2>
  </div>
);

// Status badge
const StatusBadge = ({ status }) => {
  const isActive = status === "active";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

// Employee detail item
const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 font-medium text-gray-800">{value || "-"}</p>
  </div>
);

export default Employees;
