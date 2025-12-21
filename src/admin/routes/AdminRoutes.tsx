import { Routes, Route, Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/AdminAuthContext";

// Layout
import AdminLayout from "../layout/AdminLayout";

// Pages
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Orders from "../pages/Orders";
import Products from "../pages/Products";
import ManualOrder from "../pages/ManualOrder";
import Accounts from "../pages/Accounts";
import OrderDetails from "../pages/OrderDetails";
import Discounts from "../pages/Discounts";
import Staff from "../pages/Staff";
import Messages from "../pages/Messages";
import Banners from "../pages/Banners";
import Coupons from "../pages/Coupons";

// Protect Route Component
function ProtectedRoute({ children, roles }: { children: JSX.Element; roles: string[] }) {
  const { role, loading } = useAdminAuth();

  if (loading) return <div>Loading...</div>;

  // Check localStorage as fallback if context role is not yet available
  const savedRole = localStorage.getItem("admin_role");
  const currentRole = role || savedRole;

  if (!currentRole) return <Navigate to="/login" replace />;

  if (!roles.includes(currentRole)) return <Navigate to="/admin/orders" replace />;

  return children;
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        
        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="orders"
          element={
            <ProtectedRoute roles={["admin", "moderator"]}>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="products"
          element={
            <ProtectedRoute roles={["admin", "moderator"]}>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="manual-orders"
          element={
            <ProtectedRoute roles={["admin", "moderator"]}>
              <ManualOrder />
            </ProtectedRoute>
          }
        />

        <Route
          path="accounts"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Accounts />
            </ProtectedRoute>
          }
        />

        <Route
          path="order-details/:status"
          element={
            <ProtectedRoute roles={["admin"]}>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="discounts"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Discounts />
            </ProtectedRoute>
          }
        />

        <Route
          path="staff"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Staff />
            </ProtectedRoute>
          }
        />

        <Route
          path="messages"
          element={
            <ProtectedRoute roles={["admin", "moderator"]}>
              <Messages />
            </ProtectedRoute>
          }
        />

        <Route
          path="banners"
          element={
            <ProtectedRoute roles={["admin", "moderator"]}>
              <Banners />
            </ProtectedRoute>
          }
        />

        <Route
          path="coupons"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Coupons />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
