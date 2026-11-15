import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getDashboardPath = (role) => {
  switch (role) {
    case "super_admin":
      return "/admin/dashboard";

    case "company_owner":
      return "/owner/dashboard";

    case "employee":
      return "/employee/dashboard";

    default:
      return "/login";
  }
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User does not have permission for this route
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  // User is authenticated and has permission
  return <Outlet />;
};

export default ProtectedRoute;
