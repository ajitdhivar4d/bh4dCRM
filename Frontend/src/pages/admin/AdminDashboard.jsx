import { Link } from "react-router-dom";
import {
  Building2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="w-full min-w-0 space-y-7 p-5 ">
      {/* Page heading */}
      <section>
        <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Manage company registrations and monitor platform activity.
        </p>
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
            Your central place to review company registrations and manage
            platform access.
          </p>

          <Link
            to="/admin/companies"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Review companies
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 hidden size-72 rounded-full border-[35px] border-white/5 sm:block" />
        <div className="pointer-events-none absolute -bottom-28 right-24 hidden size-64 rounded-full bg-blue-500/20 blur-3xl sm:block" />
      </section>

      {/* Management section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Available administration tools
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardCard
            title="Company Management"
            description="View pending registrations and manage company approvals."
            detail="Manage companies"
            icon={<Building2 size={23} />}
            link="/admin/companies"
            iconStyle="bg-blue-50 text-blue-600"
          />

          <DashboardCard
            title="Pending Approvals"
            description="Review newly registered companies waiting for approval."
            detail="Review requests"
            icon={<Clock size={23} />}
            link="/admin/companies"
            iconStyle="bg-amber-50 text-amber-600"
          />
        </div>
      </section>

      {/* Admin information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Platform access control
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Only approve companies after reviewing their registration details.
              Approved companies can proceed with platform access.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const DashboardCard = ({
  title,
  description,
  detail,
  icon,
  link,
  iconStyle,
}) => {
  return (
    <Link
      to={link}
      className="group flex min-w-0 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg sm:p-6"
    >
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          {detail}
          <ArrowUpRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
};

export default AdminDashboard;
