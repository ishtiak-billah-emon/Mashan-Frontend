import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface AdminAuthContextType {
  user: any;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<any>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const savedRole = localStorage.getItem("admin_role");

    if (token && savedRole) {
      setUser({ token });
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string, remember: boolean) {
    try {
      const res = await axios.post(`${API_BASE}/api/admin/login`, {
        email,
        password,
      });

      const { token, role, user } = res.data;

      // Save token and role to localStorage (always, for session management)
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_role", role);

      setUser(user);
      setRole(role);

      return { success: true, role, user };
    } catch (err: any) {
      console.error("Login failed:", err.response?.data);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    setUser(null);
    setRole(null);
  }

  return (
    <AdminAuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)!;
}
