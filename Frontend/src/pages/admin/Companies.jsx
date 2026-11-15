import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Clock3,
  Mail,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
import API from "../../api/api";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch pending companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/superAdmin/companies/pending");

      const data = response.data;
      const companyList = Array.isArray(data) ? data : data.companies || [];

      setCompanies(companyList);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch pending companies.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Activate company
  const handleActivate = async (companyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to activate this company?",
    );

    if (!confirmed) return;

    try {
      setUpdatingId(companyId);
      setError("");

      await API.patch(`/superAdmin/companies/${companyId}/status`, {
        status: "active",
      });

      setCompanies((prev) =>
        prev.filter((company) => company._id !== companyId),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate company.");
    } finally {
      setUpdatingId(null);
    }
  };

  const ActivateButton = ({ company }) => (
    <button
      onClick={() => handleActivate(company._id)}
      disabled={updatingId === company._id}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {updatingId === company._id ? (
        <RefreshCw size={16} className="animate-spin" />
      ) : (
        <CheckCircle2 size={16} />
      )}
      {updatingId === company._id ? "Activating..." : "Approve company"}
    </button>
  );

  return (
    <div className="w-full min-w-0 space-y-6 p-5">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Company Management
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Review company registrations and manage approval requests.
          </p>
        </div>

        <button
          onClick={fetchCompanies}
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock3 size={23} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Pending companies
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {companies.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 size={23} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">Approval queue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "—" : companies.length === 0 ? "Clear" : "Active"}
            </p>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Company list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-5 sm:px-6">
          <h2 className="font-bold text-slate-900">Pending registrations</h2>
          <p className="text-sm text-slate-500">
            Review the details before approving a company.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-16">
            <RefreshCw size={25} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">
              Loading company registrations...
            </p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={30} />
            </div>

            <h3 className="font-bold text-slate-900">All caught up!</h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              There are no pending company registrations right now.
            </p>

            <button
              onClick={fetchCompanies}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <RefreshCw size={15} />
              Check again
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {companies.map((company) => (
                <article
                  key={company._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Building2 size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold text-slate-900">
                        {company.companyName}
                      </h3>

                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Clock3 size={12} />
                        Pending approval
                      </span>
                    </div>
                  </div>

                  <div className="my-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-start gap-2.5 text-sm">
                      <UserRound
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Owner</p>
                        <p className="mt-0.5 break-words font-medium text-slate-700">
                          {company.owner?.name || company.ownerName || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-sm">
                      <Mail
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="mt-0.5 break-all font-medium text-slate-700">
                          {company.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ActivateButton company={company} />
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Owner</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Building2 size={19} />
                          </div>
                          <span className="font-semibold text-slate-800">
                            {company.companyName}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {company.owner?.name || company.ownerName || "N/A"}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {company.email}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                          <Clock3 size={13} />
                          Pending
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end">
                          <ActivateButton company={company} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Companies;
