// src/admin/hooks/useAdminAuth.ts
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useAdminAuth() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore login session
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const savedRole = localStorage.getItem("admin_role");

    console.log("🔄 Restoring Admin Session →", { token, savedRole });

    if (token && savedRole) {
      setUser({ token });
      setRole(savedRole);
    }

    setLoading(false);
  }, []);

  // LOGIN
  async function login(email: string, password: string, remember: boolean) {
    console.log("📨 Sending login request →", { email, password, remember });

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      console.log("✅ Login API Response →", res.data);

      const token = res.data.token;
      const loggedUser = res.data.admin;
      const loggedRole = res.data.admin?.role || "admin";

      // Save if rememberMe is checked
      if (remember) {
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_role", loggedRole);
      }

      setUser(loggedUser);
      setRole(loggedRole);

      return {
        success: true,
        role: loggedRole,
        user: loggedUser,
        token: token,
      };
    } catch (err: any) {
      console.log("❌ Login Failed →", err.response?.data);

      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  }

  // LOGOUT
  function logout() {
    console.log("🚪 Logging out...");

    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    setUser(null);
    setRole(null);
  }

  return { user, role, loading, login, logout };
}
