import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  UserRound,
  Building2,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  X,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EmployeeLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/employee/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Attendance",
      path: "/employee/attendance",
      icon: CalendarCheck,
    },
    {
      label: "Customers",
      path: "/employee/customers",
      icon: Users,
    },
    {
      label: "Enquiries",
      path: "/employee/enquiries",
      icon: ClipboardList,
    },
    {
      label: "Follow-ups",
      path: "/employee/follow-ups",
      icon: CalendarClock,
    },
    {
      label: "My Profile",
      path: "/employee/profile",
      icon: UserRound,
    },
    {
      label: "My Company",
      path: "/employee/company",
      icon: Building2,
    },
  ];

  const mobileMenuItems = [
    {
      label: "Home",
      path: "/employee/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Customers",
      path: "/employee/customers",
      icon: Users,
    },
    {
      label: "Enquiries",
      path: "/employee/enquiries",
      icon: ClipboardList,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-gray-700 px-6">
          <div>
            <h1 className="text-xl font-bold">BH4D CRM</h1>
            <p className="mt-1 text-xs text-gray-400">Employee Panel</p>
          </div>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-lg p-2 hover:bg-gray-800 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Employee information and logout */}
        <div className="border-t border-gray-700 p-4">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-semibold">
              {user?.name || "Employee"}
            </p>
            <p className="truncate text-xs text-gray-400">
              {user?.email || ""}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-gray-800"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
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
                      isActive ? "text-blue-600" : "text-gray-500"
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
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-gray-500 transition hover:text-blue-600"
            >
              <span className="flex h-8 w-12 items-center justify-center rounded-full">
                <Menu size={21} />
              </span>
              <span>More</span>
            </button>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
