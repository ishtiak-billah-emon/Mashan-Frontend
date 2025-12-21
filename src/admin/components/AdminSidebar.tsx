import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg p-4 hidden md:block">
      <h2 className="text-xl font-semibold mb-6">Admin Panel</h2>

      <nav className="flex flex-col space-y-3">
        {/* <Link to="/admin/dashboard" className="hover:text-green-700">
          Dashboard
        </Link> */}

        <Link to="/admin/orders" className="hover:text-green-700">
          Orders
        </Link>

        <Link to="/admin/users" className="hover:text-green-700">
          Users
        </Link>

        <Link to="/admin/accounts" className="hover:text-green-700">
          Accounts
        </Link>

        <Link to="/admin/manual-order" className="hover:text-green-700">
          Manual Order
        </Link>
      </nav>
    </aside>
  );
}
