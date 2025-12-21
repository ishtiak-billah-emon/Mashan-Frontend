import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAdminAuth } from "@/admin/hooks/AdminAuthContext";

import masanLogo from "../assets/natural_basket_logo.png";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { items } = useCart();
  const { role, logout } = useAdminAuth();

  // Check if user is logged in as admin/moderator
  const isLoggedIn = !!role || !!localStorage.getItem("admin_role");

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Shop", path: "/shop" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo + Brand */}
          <Link to="/" className="flex items-center gap-2">
            <img src={masanLogo} className="h-24 w-auto" />
            <div className="text-2xl font-bold font-libre">
              MASHAN <span className="text-green-600">NATURAL</span>{" "}
              <span className="text-amber-600">BASKET</span>
            </div>

          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  isActive(link.path) ? "text-primary" : "text-foreground/70"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Dashboard (admin logged in) */}
            {isLoggedIn && (
              <Link
                to="/admin/orders"
                className={`text-sm font-medium transition-colors hover:text-accent flex items-center gap-1 ${
                  isActive("/admin/orders")
                    ? "text-primary"
                    : "text-foreground/70"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-7 w-7" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* LOGIN / LOGOUT BUTTON */}
            {!isLoggedIn ? (
              <Link to="/login">
                <Button className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90">
                  Login
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="hidden md:inline-flex bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4 border-t border-border pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path) ? "text-primary" : "text-foreground/70"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile Dashboard */}
            {isLoggedIn && (
              <Link
                to="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}

            {/* Mobile Login / Logout */}
            {!isLoggedIn ? (
              <Link to="/login">
                <Button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-primary text-primary-foreground"
                >
                  Login
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="w-full bg-red-600 text-white"
              >
                Logout
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
