import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Copy,
  CheckCircle,
  RefreshCw,
  Clock,
  Users,
} from "lucide-react";
import API from "../../api/api";

const InviteEmployee = () => {
  const [formData, setFormData] = useState({
    employeeName: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  // Stores newly created or regenerated links by invitation ID
  const [invitationLinks, setInvitationLinks] = useState({});
  const [copiedId, setCopiedId] = useState("");

  const [regeneratingId, setRegeneratingId] = useState("");

  // Fetch invitation history
  const fetchInvitations = async () => {
    try {
      setLoadingInvitations(true);

      const response = await API.get("/company/invitations");

      setInvitations(response.data.invitations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load invitations.");
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Load invitations when page opens
  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create new invitation
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await API.post("/company/employees/invite", formData);

      const invitation = response.data.invitation;
      const link = response.data.invitationLink;

      setSuccess(response.data.message || "Invitation created successfully.");

      if (invitation?.id && link) {
        setInvitationLinks((prev) => ({
          ...prev,
          [invitation.id]: link,
        }));
      }

      setFormData({
        employeeName: "",
        email: "",
      });

      await fetchInvitations();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send invitation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy invitation link
  const handleCopy = async (id, link) => {
    try {
      await navigator.clipboard.writeText(link);

      setCopiedId(id);
      setError("");
    } catch {
      setError("Unable to copy the invitation link.");
    }
  };

  // Regenerate invitation link
  const handleRegenerate = async (id) => {
    try {
      setError("");
      setSuccess("");
      setRegeneratingId(id);

      const response = await API.post(`/company/invitations/${id}/regenerate`);

      setInvitationLinks((prev) => ({
        ...prev,
        [id]: response.data.invitationLink,
      }));

      setCopiedId("");

      setSuccess(
        response.data.message || "Invitation link regenerated successfully.",
      );

      await fetchInvitations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to regenerate invitation link.",
      );
    } finally {
      setRegeneratingId("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Invite Employee</h1>

        <p className="mt-1 text-sm text-gray-500">
          Send an invitation to add an employee to your company.
        </p>
      </div>

      {/* Invitation Form */}
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
      </div>

      {/* Invitation History */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-3">
              <Users className="text-indigo-600" size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Employee Invitations
              </h2>

              <p className="text-sm text-gray-500">
                Manage previously created invitations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchInvitations}
            disabled={loadingInvitations}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingInvitations ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loadingInvitations ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading invitations...
          </div>
        ) : invitations.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-10 text-center">
            <Users className="mx-auto mb-3 text-gray-400" size={32} />

            <p className="font-medium text-gray-700">No invitations found</p>

            <p className="mt-1 text-sm text-gray-500">
              Your employee invitations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const link = invitationLinks[invitation.id];

              const isPending = invitation.status === "pending";

              return (
                <div
                  key={invitation.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {invitation.employeeName}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {invitation.email}
                      </p>

                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={14} />
                        Expires:{" "}
                        {new Date(invitation.expiresAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                        isPending
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isPending ? "Pending" : "Expired"}
                    </span>
                  </div>

                  {link && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={link}
                        readOnly
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {link && (
                      <button
                        type="button"
                        onClick={() => handleCopy(invitation.id, link)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        {copiedId === invitation.id ? (
                          <CheckCircle size={16} />
                        ) : (
                          <Copy size={16} />
                        )}

                        {copiedId === invitation.id ? "Copied" : "Copy Link"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRegenerate(invitation.id)}
                      disabled={regeneratingId === invitation.id}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw
                        size={16}
                        className={
                          regeneratingId === invitation.id ? "animate-spin" : ""
                        }
                      />

                      {regeneratingId === invitation.id
                        ? "Regenerating..."
                        : "Regenerate Link"}
                    </button>
                  </div>
                </div>
              );
            })}
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
