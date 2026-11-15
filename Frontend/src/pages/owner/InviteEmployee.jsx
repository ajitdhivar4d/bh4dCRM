import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Copy, CheckCircle } from "lucide-react";
import API from "../../api/api";

const InviteEmployee = () => {
  const [formData, setFormData] = useState({
    employeeName: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invitationLink, setInvitationLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setInvitationLink("");
    setCopied(false);

    try {
      setLoading(true);

      const response = await API.post("/company/employees/invite", formData);

      setSuccess(response.data.message || "Invitation created successfully.");

      setInvitationLink(response.data.invitationLink || "");

      setFormData({
        employeeName: "",
        email: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send invitation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
    } catch {
      setError("Unable to copy the invitation link.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Invite Employee</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send an invitation to add an employee to your company.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <UserPlus className="text-blue-600" size={24} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">Employee Invitation</h2>
            <p className="text-sm text-gray-500">
              Enter the employee's details below.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="employeeName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Employee Name
            </label>

            <input
              id="employeeName"
              type="text"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              placeholder="Enter employee name"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Employee Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter employee email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus size={18} />
            {loading ? "Sending Invitation..." : "Send Invitation"}
          </button>
        </form>

        {invitationLink && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-sm font-semibold text-blue-800">
              Invitation Link
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700"
              />

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="mt-2 text-xs text-blue-700">
              Share this link with the invited employee if your backend provides
              it. The invitation expires according to the backend's expiry
              policy.
            </p>
          </div>
        )}
      </div>

      <Link
        to="/owner/employees"
        className="inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        ← Back to Employees
      </Link>
    </div>
  );
};

export default InviteEmployee;
