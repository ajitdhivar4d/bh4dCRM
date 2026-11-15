import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api/api";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read token from the invitation URL
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Verify invitation when the page opens
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await API.get("/company/verify-invitation", {
          params: { token },
        });

        setInvitation(response.data.invitation);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "This invitation is invalid or expired.",
        );
      } finally {
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  // Create employee account
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post("/company/accept-invitation", {
        token,
        password,
      });

      setSuccess(
        response.data.message || "Employee account created successfully.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to accept invitation. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Verifying your invitation...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          Accept Employee Invitation
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Create your password to activate your employee account.
        </p>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        ) : invitation ? (
          <>
            <div className="mt-5 space-y-2 rounded-lg bg-blue-50 p-4 text-sm">
              <p>
                <strong>Employee:</strong> {invitation.employeeName}
              </p>
              <p>
                <strong>Email:</strong> {invitation.email}
              </p>
              <p>
                <strong>Company:</strong> {invitation.companyName}
              </p>
              <p>
                <strong>Invitation expires:</strong>{" "}
                {new Date(invitation.expiresAt).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Create Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter at least 8 characters"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-5">
            <p className="text-sm text-gray-600">
              Please ask your company owner to send you a new invitation.
            </p>

            <Link
              to="/login"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
