"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  Settings,
  Menu,
  X,
  LogOut,
  Building2,
  UserCircle,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ReactNode };

const navByRole: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Overview", href: "/super-admin", icon: <LayoutDashboard size={20} /> },
    { label: "Tenants", href: "/super-admin/tenants", icon: <Building2 size={20} /> },
    { label: "Users", href: "/super-admin/users", icon: <Users size={20} /> },
    { label: "Settings", href: "/super-admin/settings", icon: <Settings size={20} /> },
  ],
  HR_ADMIN: [
    { label: "Dashboard", href: "/hr", icon: <LayoutDashboard size={20} /> },
    { label: "Jobs", href: "/hr/jobs", icon: <Briefcase size={20} /> },
    { label: "Applications", href: "/hr/applications", icon: <ClipboardList size={20} /> },
    { label: "Team", href: "/hr/team", icon: <Users size={20} /> },
    { label: "Settings", href: "/hr/settings", icon: <Settings size={20} /> },
  ],
  TEAM_MEMBER: [
    { label: "My Interviews", href: "/team", icon: <LayoutDashboard size={20} /> },
    { label: "Schedule", href: "/team/schedule", icon: <ClipboardList size={20} /> },
  ],
  CANDIDATE: [
    { label: "My Applications", href: "/candidate", icon: <LayoutDashboard size={20} /> },
    { label: "Profile", href: "/candidate/profile", icon: <UserCircle size={20} /> },
  ],
};

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = navByRole[user.role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <Link href="/" className="text-xl font-bold text-blue-600">
            HireFlow
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.role.replace("_", " ")}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">HireFlow</h1>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
