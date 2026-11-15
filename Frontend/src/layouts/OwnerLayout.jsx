import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  UserPlus,
  UserRound,
  ClipboardList,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      shortName: "Home",
      path: "/owner/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Employees",
      shortName: "Employees",
      path: "/owner/employees",
      icon: Users,
    },
    {
      name: "Customers",
      shortName: "Customers",
      path: "/owner/customers",
      icon: UserRound,
    },
    {
      name: "Enquiries",
      shortName: "Enquiries",
      path: "/owner/enquiries",
      icon: ClipboardList,
    },
    {
      name: "Attendance",
      shortName: "Attendance",
      path: "/owner/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Invite Employee",
      shortName: "Invite",
      path: "/owner/invite-employee",
      icon: UserPlus,
    },
    {
      name: "Follow-ups",
      shortName: "Follow-ups",
      path: "/owner/follow-ups",
      icon: CalendarClock,
    },
    {
      name: "Settings",
      shortName: "Settings",
      path: "/owner/settings",
      icon: Settings,
    },
  ];

  const mobileMenuItems = [
    {
      name: "Home",
      path: "/owner/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      path: "/owner/customers",
      icon: UserRound,
    },
    {
      name: "Enquiries",
      path: "/owner/enquiries",
      icon: ClipboardList,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await API.get("/company/dashboard");

        setCompany(response.data.company);
      } catch (error) {
        console.error("Failed to fetch company details:", error);
      }
    };

    fetchCompany();
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-blue-600">
            BH4D <span className="text-slate-800">CRM</span>
          </h1>
          <p className="max-w-[170px] truncate text-xs text-slate-400">
            {company?.companyName || "Company Name"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-900 text-white shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-700 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-tight">
                BH4D CRM
              </h1>
              <p className="max-w-[170px] truncate text-xs text-slate-400">
                {company?.companyName || "Company Name"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Owner information */}
        <div className="border-b border-slate-700 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
              <UserPlus size={21} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "Company Owner"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {user?.email || "Owner Account"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-700 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-slate-800 hover:text-red-300"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:ml-[280px]">
        {/* Desktop top header */}
        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur lg:flex xl:px-8">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {company?.companyName || "Company Workspace"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Manage your company workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <UserPlus size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "Company Owner"}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user?.role || "company_owner"}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 px-4 pt-5 pb-24 sm:px-6 sm:pt-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${
                    isActive ? "text-blue-600" : "text-slate-500"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-12 items-center justify-center rounded-full ${
                        isActive ? "bg-blue-100" : ""
                      }`}
                    >
                      <Icon size={21} />
                    </span>
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <span className="flex h-8 w-12 items-center justify-center rounded-full">
              <Menu size={21} />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default OwnerLayout;
