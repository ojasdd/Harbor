"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Brain, LayoutDashboard, Briefcase, Users, BarChart3, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", show: true },
    { href: "/jobs", label: "Jobs", icon: Briefcase, show: true },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: isAuthenticated && user?.role === "candidate",
    },
    {
      href: "/recruiter",
      label: "Recruiter",
      icon: Users,
      show: isAuthenticated && (user?.role === "recruiter" || user?.role === "admin"),
    },
    {
      href: "/admin",
      label: "Analytics",
      icon: BarChart3,
      show: isAuthenticated && user?.role === "admin",
    },
  ].filter((l) => l.show);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a3a5c] bg-[#111827]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Brain className="h-7 w-7 text-[#00d4ff] group-hover:drop-shadow-[0_0_8px_#00d4ff] transition-all" />
            </div>
            <div>
              <span className="font-mono font-bold text-white text-sm tracking-wide">
                ATS
              </span>
              <span className="font-mono font-bold text-[#00d4ff] text-sm tracking-wide">
                {" "}Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  pathname === link.href
                    ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30"
                    : "text-[#94a3b8] hover:text-white hover:bg-[#1a2235]"
                )}
              >
                {link.icon && <link.icon className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-[#64748b] font-mono uppercase tracking-wider">
                    {user?.role}
                  </div>
                  <div className="text-sm text-[#e2e8f0] font-medium">
                    {user?.full_name || user?.email}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-[#94a3b8] hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    className="bg-[#00d4ff] text-[#0a0e1a] hover:bg-[#00d4ff]/90 font-semibold"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#94a3b8] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#111827] border-t border-[#2a3a5c] px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-md text-sm text-[#94a3b8] hover:text-white hover:bg-[#1a2235]"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm text-[#ef4444]"
            >
              Logout
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/register" className="flex-1">
                <Button size="sm" className="w-full bg-[#00d4ff] text-[#0a0e1a]">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
