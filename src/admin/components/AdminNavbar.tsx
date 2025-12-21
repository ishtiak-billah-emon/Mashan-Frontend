import { useAdminAuth } from "../hooks/AdminAuthContext";
import { Button } from "@/components/ui/button";

export default function AdminNavbar() {
  const { logout, role } = useAdminAuth();

  return (
    <header className="bg-white shadow flex justify-between items-center px-6 py-3">
      <h1 className="text-lg font-semibold">Welcome, {role}</h1>
      <Button onClick={logout}>Logout</Button>
    </header>
  );
}
