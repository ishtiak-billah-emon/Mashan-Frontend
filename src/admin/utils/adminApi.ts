// src/admin/utils/adminApi.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function adminLogin(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      return await res.json();
    } catch (err) {
      console.error("Login API Error:", err);
      return { success: false, message: "Network error" };
    }
  }
  
  export async function adminVerify(token: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      return await res.json();
    } catch (err) {
      console.error("Verify API Error:", err);
      return { success: false };
    }
  }
  