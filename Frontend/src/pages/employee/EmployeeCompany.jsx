import { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
} from "lucide-react";
import API from "../../api/api";

const EmployeeCompany = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch company information
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await API.get("/employee/company");

        setCompany(response.data.company);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load company information.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-gray-500">Loading company information...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || "Company information not found."}
      </div>
    );
  }

  const companyDetails = [
    {
      label: "Company Name",
      value: company.companyName,
      icon: Building2,
    },
    {
      label: "Company Email",
      value: company.email,
      icon: Mail,
    },
    {
      label: "Phone Number",
      value: company.phone,
      icon: Phone,
    },
    {
      label: "Company Address",
      value: company.address,
      icon: MapPin,
    },
    {
      label: "Company Slug",
      value: company.slug,
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Company</h1>

        <p className="mt-1 text-sm text-gray-500">
          View information about the company you work for.
        </p>
      </div>

      {/* Company header */}
      <div className="rounded-xl bg-blue-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3">
            <Building2 size={32} />
          </div>

          <div>
            <p className="text-sm text-blue-100">Your Company</p>

            <h2 className="mt-1 text-2xl font-bold">
              {company.companyName || "Company"}
            </h2>
          </div>
        </div>
      </div>

      {/* Company status */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-600" size={24} />

          <div>
            <h3 className="font-semibold text-gray-800">Company Status</h3>

            <p className="mt-1 text-sm text-gray-500">
              Current registration status
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            company.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {company.status || "Unknown"}
        </span>
      </div>

      {/* Company details */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Company Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {companyDetails.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <Icon size={21} className="text-blue-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">{item.label}</p>

                    <p className="mt-1 break-words font-semibold text-gray-800">
                      {item.value || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeCompany;
