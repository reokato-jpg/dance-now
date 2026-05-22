"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, BookOpen, Users, Mic2,
  Building2, Tag, BarChart3, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/admin/schedule", icon: CalendarDays, label: "スケジュール" },
  { href: "/admin/bookings", icon: BookOpen, label: "予約一覧" },
  { href: "/admin/instructors", icon: Mic2, label: "インストラクター" },
  { href: "/admin/studios", icon: Building2, label: "スタジオ" },
  { href: "/admin/coupons", icon: Tag, label: "クーポン" },
  { href: "/admin/sales", icon: BarChart3, label: "売上レポート" },
  { href: "/admin/customers", icon: Users, label: "顧客管理 (CRM)" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 bg-ink-800 border-r border-ink-700 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-ink-700">
        <span className="font-display text-xl tracking-widest brand-gradient-text">DANCE NOW</span>
        <p className="text-xs text-ink-500 mt-0.5">ADMIN CONSOLE</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                  : "text-ink-400 hover:text-white hover:bg-ink-700"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-ink-700">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-500 hover:text-white hover:bg-ink-700 transition-all">
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
