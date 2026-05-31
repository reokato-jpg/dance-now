"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function UserHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, clearCustomer } = useAuthStore();

  const handleLogout = () => {
    clearCustomer();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/lessons" className="font-display text-xl tracking-widest brand-gradient-text">
          STUDIO RENTAL
        </Link>
        {customer && (
          <nav className="flex items-center gap-2">
            <Link
              href="/lessons"
              className={cn(
                "p-2 rounded-lg transition-colors",
                pathname.startsWith("/lessons") ? "text-brand-purple" : "text-gray-400 hover:text-gray-900"
              )}
            >
              <Calendar className="w-5 h-5" />
            </Link>
            <Link
              href="/mypage"
              className={cn(
                "p-2 rounded-lg transition-colors",
                pathname.startsWith("/mypage") ? "text-brand-purple" : "text-gray-400 hover:text-gray-900"
              )}
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
