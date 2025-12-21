import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";

export default function AdminLayout() {
  const { role, logout } = useAdminAuth();
  const navigate = useNavigate();
  const savedRole = localStorage.getItem("admin_role");
  const currentRole = role || savedRole;
  const isAdmin = currentRole === "admin";
  const isModerator = currentRole === "moderator";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - Fixed, non-scrollable */}
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col h-screen overflow-hidden">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

        <nav className="space-y-2 flex-1">
          <Link to="/" className="block hover:text-green-300 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </Link>

          {/* {isAdmin && (
            <Link to="/admin/dashboard" className="block hover:text-green-300">
              Dashboard
            </Link>
          )} */}

          {isAdmin && (
            <Link to="/admin/users" className="block hover:text-green-300">
              Users
            </Link>
          )}

          {(isAdmin || isModerator) && (
            <Link to="/admin/orders" className="block hover:text-green-300">
              Orders
            </Link>
          )}

          {(isAdmin || isModerator) && (
            <Link to="/admin/products" className="block hover:text-green-300">
              Products
            </Link>
          )}

          {(isAdmin || isModerator) && (
            <Link to="/admin/manual-orders" className="block hover:text-green-300">
              Manual Order
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin/accounts" className="block hover:text-green-300">
              Accounts
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin/discounts" className="block hover:text-green-300">
              Discounts
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin/staff" className="block hover:text-green-300">
              Staff
            </Link>
          )}

          {(isAdmin || isModerator) && (
            <Link to="/admin/messages" className="block hover:text-green-300">
              Messages
            </Link>
          )}

          {(isAdmin || isModerator) && (
            <Link to="/admin/banners" className="block hover:text-green-300">
              Banners
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin/coupons" className="block hover:text-green-300">
              Coupons
            </Link>
          )}
        </nav>

        {/* Logout Button at Bottom - Fixed position */}
        <div className="pt-4 border-t border-gray-700 flex-shrink-0">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-transparent text-white border-gray-600 hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Content - Scrollable */}
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
