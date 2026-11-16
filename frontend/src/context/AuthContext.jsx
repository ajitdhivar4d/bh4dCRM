import { createContext, useContext, useState } from "react";

// Create authentication context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  // Get existing authentication data from localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isImpersonating, setIsImpersonating] = useState(() => {
    return Boolean(sessionStorage.getItem("adminToken"));
  });

  const [isEmployeeImpersonating, setIsEmployeeImpersonating] = useState(() => {
    return Boolean(sessionStorage.getItem("ownerToken"));
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // Enter a company's Owner workspace as Super Admin
  const enterCompanyWorkspace = (ownerData, accessToken) => {
    if (user?.role !== "super_admin") {
      return false;
    }

    // Preserve original Super Admin session
    sessionStorage.setItem("adminToken", token);
    sessionStorage.setItem("adminUser", JSON.stringify(user));

    // Switch to Owner session
    localStorage.setItem("user", JSON.stringify(ownerData));
    localStorage.setItem("token", accessToken);

    setUser(ownerData);
    setToken(accessToken);
    setIsImpersonating(true);

    return true;
  };

  // Return to original Super Admin session
  const exitCompanyWorkspace = () => {
    const adminToken = sessionStorage.getItem("adminToken");
    const adminUser = sessionStorage.getItem("adminUser");

    if (!adminToken || !adminUser) {
      return false;
    }

    const restoredUser = JSON.parse(adminUser);

    localStorage.setItem("token", adminToken);
    localStorage.setItem("user", JSON.stringify(restoredUser));

    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");

    setToken(adminToken);
    setUser(restoredUser);
    setIsImpersonating(false);

    return true;
  };

  // Enter an employee workspace as Super Admin
  const enterEmployeeWorkspace = (employeeData, accessToken) => {
    if (!isImpersonating || user?.role !== "company_owner") {
      return false;
    }

    sessionStorage.setItem("ownerToken", token);
    sessionStorage.setItem("ownerUser", JSON.stringify(user));

    localStorage.setItem("user", JSON.stringify(employeeData));
    localStorage.setItem("token", accessToken);

    setUser(employeeData);
    setToken(accessToken);
    setIsEmployeeImpersonating(true);

    return true;
  };

  // Return from employee workspace to company owner workspace
  const exitEmployeeWorkspace = () => {
    const ownerToken = sessionStorage.getItem("ownerToken");
    const ownerUser = sessionStorage.getItem("ownerUser");

    if (!ownerToken || !ownerUser) {
      return false;
    }

    const restoredUser = JSON.parse(ownerUser);

    localStorage.setItem("token", ownerToken);
    localStorage.setItem("user", JSON.stringify(restoredUser));

    sessionStorage.removeItem("ownerToken");
    sessionStorage.removeItem("ownerUser");

    setToken(ownerToken);
    setUser(restoredUser);
    setIsEmployeeImpersonating(false);

    return true;
  };

  // Login function
  const login = (userData, accessToken) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", accessToken);

    setUser(userData);
    setToken(accessToken);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prevUser) => {
      const newUser = {
        ...prevUser,
        ...updatedUser,
      };

      localStorage.setItem("user", JSON.stringify(newUser));

      return newUser;
    });
  };

  // Check authentication status
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated,
        isImpersonating,
        enterCompanyWorkspace,
        exitCompanyWorkspace,
        isEmployeeImpersonating,
        enterEmployeeWorkspace,
        exitEmployeeWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication
export const useAuth = () => {
  return useContext(AuthContext);
};
