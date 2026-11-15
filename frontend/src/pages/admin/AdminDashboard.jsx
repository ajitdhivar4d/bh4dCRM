import { useEffect, useState } from "react";
import {
  Building2,
  Clock3,
  CheckCircle2,
  Ban,
  XCircle,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import API from "../../api/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/superAdmin/dashboard");

      setStats(response.data.stats);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load dashboard statistics.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch statistics when dashboard opens
    fetchStats();

    // Refresh when user returns to the browser tab
    window.addEventListener("focus", fetchStats);

    return () => {
      window.removeEventListener("focus", fetchStats);
    };
  }, []);

  const statCards = [
    {
      title: "Total Companies",
      value: stats?.totalCompanies,
      icon: Building2,
      style: "bg-blue-50 text-blue-600",
      description: "All registered companies",
    },
    {
      title: "Active Companies",
      value: stats?.activeCompanies,
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-600",
      description: "Currently active",
    },
    {
      title: "Pending Companies",
      value: stats?.pendingCompanies,
      icon: Clock3,
      style: "bg-amber-50 text-amber-600",
      description: "Waiting for approval",
    },
    {
      title: "Suspended Companies",
      value: stats?.suspendedCompanies,
      icon: Ban,
      style: "bg-orange-50 text-orange-600",
      description: "Temporarily suspended",
    },
    {
      title: "Rejected Companies",
      value: stats?.rejectedCompanies,
      icon: XCircle,
      style: "bg-red-50 text-red-600",
      description: "Registration rejected",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-7 p-5">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Monitor companies and manage your BH4D MyCRM platform.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
            <ShieldCheck size={15} />
            Super Admin Portal
          </div>

          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, Admin
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Your central dashboard to monitor registered companies and manage
            platform access.
          </p>

          <Link
            to="/admin/companies"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Manage companies
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 hidden size-72 rounded-full border-[35px] border-white/5 sm:block" />
        <div className="pointer-events-none absolute -bottom-28 right-24 hidden size-64 rounded-full bg-blue-500/20 blur-3xl sm:block" />
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchStats}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Company statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Company Overview</h2>

          <p className="mt-1 text-sm text-slate-500">
            Live registration and company status statistics.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${card.style}`}
                  >
                    <Icon size={23} />
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {loading
                    ? "—"
                    : error && stats === null
                      ? "—"
                      : (card.value ?? 0)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Management section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Management</h2>

          <p className="mt-1 text-sm text-slate-500">
            Available administration tools.
          </p>
        </div>

        <Link
          to="/admin/companies"
          className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md sm:p-6"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900">Company Management</h3>

            <p className="mt-1 text-sm text-slate-500">
              Review company registrations and manage company approvals.
            </p>
          </div>

          <ArrowUpRight
            size={20}
            className="shrink-0 text-slate-400 transition group-hover:text-blue-600"
          />
        </Link>
      </section>

      {/* Platform information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Platform access control
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Monitor company registrations and approve eligible companies to
              provide access to BH4D MyCRM.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
