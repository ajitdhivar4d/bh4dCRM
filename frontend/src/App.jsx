import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Companies from "./pages/admin/Companies";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerLayout from "./layouts/OwnerLayout";
import Employees from "./pages/owner/Employees";
import InviteEmployee from "./pages/owner/InviteEmployee";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeeCompany from "./pages/employee/EmployeeCompany";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import OwnerAttendance from "./pages/owner/OwnerAttendance";
import AttendanceSettings from "./pages/owner/AttendanceSettings";
import AcceptInvitation from "./pages/auth/AcceptInvitation";
import AdminLayout from "./layouts/AdminLayout";
import Customers from "./pages/customer/Customers";
import Enquiries from "./pages/enquiries/Enquiries";
import FollowUps from "./pages/followups/FollowUps";
import MonthlyAttendanceReport from "./pages/owner/MonthlyAttendanceReport";

function App() {
  return (
    //
    <Routes>
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

      {/* Public route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Super Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="companies" element={<Companies />} />
        </Route>
      </Route>

      {/* Company Owner routes */}
      <Route element={<ProtectedRoute allowedRoles={["company_owner"]} />}>
        <Route path="/owner" element={<OwnerLayout />}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="invite-employee" element={<InviteEmployee />} />
          <Route path="attendance" element={<OwnerAttendance />} />
          <Route
            path="monthly-attendance"
            element={<MonthlyAttendanceReport />}
          />
          <Route path="settings" element={<AttendanceSettings />} />
          <Route path="customers" element={<Customers />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="follow-ups" element={<FollowUps />} />
        </Route>
      </Route>

      {/* Employee routes */}
      <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="company" element={<EmployeeCompany />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="customers" element={<Customers />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="follow-ups" element={<FollowUps />} />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
