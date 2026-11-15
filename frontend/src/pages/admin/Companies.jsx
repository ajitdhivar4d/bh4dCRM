import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Clock3,
  Mail,
  UserRound,
  Ban,
  Search,
  Filter,
  XCircle,
  CalendarDays,
} from "lucide-react";
import API from "../../api/api";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-orange-50 text-orange-700",
  rejected: "bg-red-50 text-red-700",
};

const statusIcons = {
  active: CheckCircle2,
  pending: Clock3,
  suspended: Ban,
  rejected: XCircle,
};

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/superAdmin/companies");

      setCompanies(response.data.companies || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filter and search companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        company.companyName?.toLowerCase().includes(searchText) ||
        company.owner?.name?.toLowerCase().includes(searchText) ||
        company.owner?.email?.toLowerCase().includes(searchText) ||
        company.email?.toLowerCase().includes(searchText) ||
        company.phone?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" || company.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [companies, search, statusFilter]);

  // Update company status
  const handleStatusChange = async (company) => {
    const nextStatus =
      company.status === "pending"
        ? "active"
        : company.status === "active"
          ? "suspended"
          : company.status === "suspended"
            ? "active"
            : null;

    if (!nextStatus) return;

    const actionLabels = {
      active: "activate",
      suspended: "suspend",
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabels[nextStatus]} ${company.companyName}?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingId(company._id);
      setError("");

      await API.patch(`/superAdmin/companies/${company._id}/status`, {
        status: nextStatus,
      });

      // Update local company list
      setCompanies((prev) =>
        prev.map((item) =>
          item._id === company._id ? { ...item, status: nextStatus } : item,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update company status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const Icon = statusIcons[status] || Clock3;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
          statusStyles[status] || "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon size={13} />
        {status}
      </span>
    );
  };

  // Action button
  const ActionButton = ({ company }) => {
    if (company.status === "rejected") {
      return (
        <span className="text-xs font-medium text-slate-400">
          No action available
        </span>
      );
    }

    const isSuspending = company.status === "active";

    return (
      <button
        type="button"
        onClick={() => handleStatusChange(company)}
        disabled={updatingId === company._id}
        className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
          isSuspending
            ? "bg-orange-600 hover:bg-orange-700"
            : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {updatingId === company._id ? (
          <RefreshCw size={15} className="animate-spin" />
        ) : isSuspending ? (
          <Ban size={15} />
        ) : (
          <CheckCircle2 size={15} />
        )}

        {updatingId === company._id
          ? "Updating..."
          : company.status === "pending"
            ? "Activate"
            : isSuspending
              ? "Suspend"
              : "Reactivate"}
      </button>
    );
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Company Management
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            View and manage all registered companies.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCompanies}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Company counts */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: companies.length, color: "text-blue-600" },
          {
            label: "Active",
            value: companies.filter((c) => c.status === "active").length,
            color: "text-emerald-600",
          },
          {
            label: "Pending",
            value: companies.filter((c) => c.status === "pending").length,
            color: "text-amber-600",
          },
          {
            label: "Suspended",
            value: companies.filter((c) => c.status === "suspended").length,
            color: "text-orange-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${item.color}`}>
              {loading ? "—" : item.value}
            </p>
          </div>
        ))}
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

      {/* Search and filter */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, owner or email..."
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative sm:w-52">
          <Filter
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      {/* Company list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Registered Companies</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage company access and registration status.
            </p>
          </div>

          <span className="text-sm font-medium text-slate-500">
            {loading ? "Loading..." : `${filteredCompanies.length} results`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-16">
            <RefreshCw size={25} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Building2 size={35} className="mb-3 text-slate-300" />

            <h3 className="font-semibold text-slate-900">No companies found</h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile company cards */}
            <div className="space-y-3 p-4 md:hidden">
              {filteredCompanies.map((company) => (
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

                      <div className="mt-2">
                        <StatusBadge status={company.status} />
                      </div>
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
                          {company.owner?.name || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-sm">
                      <Mail
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Owner email</p>
                        <p className="mt-0.5 break-all font-medium text-slate-700">
                          {company.owner?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-sm">
                      <CalendarDays
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div>
                        <p className="text-xs text-slate-400">Registered</p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {company.createdAt
                            ? new Date(company.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ActionButton company={company} />
                </article>
              ))}
            </div>

            {/* Desktop company table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Owner</th>
                    <th className="px-6 py-4">Owner Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCompanies.map((company) => (
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
                        {company.owner?.name || "N/A"}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {company.owner?.email || "N/A"}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={company.status} />
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {company.createdAt
                          ? new Date(company.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end">
                          <ActionButton company={company} />
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
