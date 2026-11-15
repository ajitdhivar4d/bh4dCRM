import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

const Register = () => {
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerEmail: "",
    password: "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Map frontend fields to backend fields
      const registrationData = {
        name: formData.ownerName,
        email: formData.ownerEmail,
        password: formData.password,
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone,
        address: formData.companyAddress,
      };

      const response = await API.post("/company/register", registrationData);

      setSuccess(
        response.data.message ||
          "Company registration successful. Please wait for admin approval.",
      );

      // Reset form after successful registration
      setFormData({
        ownerName: "",
        ownerEmail: "",
        password: "",
        companyName: "",
        companyEmail: "",
        companyPhone: "",
        companyAddress: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-center text-3xl font-bold text-gray-800">
          BH4D CRM
        </h1>
        <h4 className=" text-center text-gray-700">
          Business Management Platform
        </h4>

        <p className="mb-2 mt-5 text-left text-gray-500">
          Register your company
        </p>

        <form onSubmit={handleSubmit}>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            Owner Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="Owner name"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />

            <input
              type="email"
              name="ownerEmail"
              value={formData.ownerEmail}
              onChange={handleChange}
              placeholder="Owner email"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 sm:col-span-2"
            />
          </div>

          <h2 className="mb-4 mt-8 text-lg font-semibold text-gray-700">
            Company Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Company name"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />

            <input
              type="email"
              name="companyEmail"
              value={formData.companyEmail}
              onChange={handleChange}
              placeholder="Company email"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />

            <input
              type="tel"
              name="companyPhone"
              value={formData.companyPhone}
              onChange={handleChange}
              placeholder="Company phone"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />

            <input
              type="text"
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleChange}
              placeholder="Company address"
              required
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="mt-5 rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-5 rounded-lg bg-green-100 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register Company"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
