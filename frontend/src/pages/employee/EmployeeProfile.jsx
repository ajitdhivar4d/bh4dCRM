import { useEffect, useState } from "react";
import { Mail, UserRound, ShieldCheck, Save } from "lucide-react";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const EmployeeProfile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { updateUser } = useAuth();
  // Fetch employee profile when the page loads
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/employee/profile");

        const employeeData = response.data.employee;

        setEmployee(employeeData);

        setFormData({
          name: employeeData.name || "",
          email: employeeData.email || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load employee profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update employee profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await API.put("/employee/profile", {
        name: formData.name.trim(),
        email: formData.email.trim(),
      });

      const updatedEmployee = response.data.employee;

      updateUser(updatedEmployee);

      setEmployee(updatedEmployee);

      setFormData({
        name: updatedEmployee.name || "",
        email: updatedEmployee.email || "",
      });

      setSuccess(response.data.message || "Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update employee profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || "Employee profile not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and update your personal information.
        </p>
      </div>

      {/* Profile information */}
      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-3">
            <UserRound size={26} className="text-blue-600" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">
              Personal Information
            </h2>
            <p className="text-sm text-gray-500">
              Update your name and email address.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Employee Name
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Employee email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Read-only role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Role
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
              <ShieldCheck size={18} />
              <span>{employee.role || "employee"}</span>
            </div>
          </div>

          {/* Read-only status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Account Status
            </label>

            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                employee.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {employee.status || "Unknown"}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeProfile;
