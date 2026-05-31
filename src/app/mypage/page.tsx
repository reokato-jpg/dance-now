"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QrCode, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserHeader } from "@/components/layout/user-header";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function MyPage() {
  const router = useRouter();
  const { customer, _hasHydrated } = useAuthStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!customer) router.push("/login");
  }, [_hasHydrated, customer, router]);

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", customer?.id, tab],
    queryFn: async () => {
      const res = await fetch(`/api/bookings?customerId=${customer?.id}&type=${tab}`);
      if (!res.ok) throw new Error("取得失敗");
      return res.json();
    },
    enabled: !!customer?.id,
  });

  if (!_hasHydrated || !customer) return null;

  const totalSpent = bookings.reduce((s: number, b: any) => s + (b.amount - b.discountAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile */}
        <div className="card-light p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 brand-gradient rounded-full flex items-center justify-center text-xl font-bold text-white shadow-glow-purple">
              {customer?.lastName?.[0] || "?"}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{customer?.lastName} {customer?.firstName}</p>
              <p className="text-gray-500 text-sm">{customer?.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              <p className="text-xs text-gray-500">今月の予約</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-purple">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-gray-500">累計金額</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {[["upcoming", "予約中"], ["past", "過去"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                tab === key ? "bg-brand-purple text-white shadow-glow-purple" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎵</p>
            <p className="font-bold">
              {tab === "upcoming" ? "予約中のスタジオはありません" : "過去の予約はありません"}
            </p>
            {tab === "upcoming" && (
              <Link href="/lessons" className="text-brand-purple text-sm mt-2 inline-block font-bold hover:underline">
                レッスンを探す →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking: any, i: number) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/mypage/booking/${booking.id}`}>
                  <div className="card-light p-4 hover:border-brand-purple transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={booking.status === "CONFIRMED" ? "default" : "secondary"} className="text-xs">
                            {booking.status === "CONFIRMED" ? "確定" : booking.status === "ATTENDED" ? "受講済" : "キャンセル"}
                          </Badge>
                          <span className="text-xs text-gray-400 font-mono">#{booking.reservationNo?.split("-")[2]}</span>
                        </div>
                        <h3 className="font-bold text-gray-900">
                          Studio {booking.slot?.studioName ?? booking.slot?.studio?.name ?? ""}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {booking.slot?.startAt ? formatDate(booking.slot.startAt) : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tab === "upcoming" && (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-brand-purple" />
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 text-sm">
                      <span className="text-gray-500">支払い金額</span>
                      <span className="font-bold text-gray-900">{formatPrice(booking.amount - booking.discountAmount)}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
