"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { useBookingStore } from "@/lib/booking-store";
import { useAuthStore } from "@/lib/auth-store";
import { formatPrice, formatTimeRange, formatDate } from "@/lib/utils";

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            s <= step ? "brand-gradient text-white" : "bg-ink-700 text-ink-500"
          }`}>{s}</div>
          {s < 3 && <div className={`h-px w-8 ${s < step ? "bg-brand-purple" : "bg-ink-700"}`} />}
        </div>
      ))}
      <span className="text-xs text-ink-400 ml-2">
        {step === 1 ? "確認" : step === 2 ? "お支払い" : "完了"}
      </span>
    </div>
  );
}

export default function BookingConfirmPage() {
  const router = useRouter();
  const { lesson, coupon, finalAmount } = useBookingStore();
  const { customer, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!lesson) { router.push("/lessons"); return; }
    if (!customer) { router.push("/login"); return; }
  }, [_hasHydrated, lesson, customer, router]);

  if (!_hasHydrated || !lesson || !customer) return null;

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-400 hover:text-white mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>
        <StepIndicator step={1} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Booking summary */}
          <div className="card-dark p-5">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">予約内容</p>
            <h2 className="text-xl font-bold text-white mb-3">Studio {lesson.studioName}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-400">日付</span>
                <span className="text-white font-medium">{formatDate(lesson.startAt, "M月d日(E)")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">時間</span>
                <span className="text-white font-medium">{formatTimeRange(lesson.startAt, lesson.durationMin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">お名前</span>
                <span className="text-white">
                  {customer.lastName && customer.firstName
                    ? `${customer.lastName} ${customer.firstName}`
                    : <span className="text-ink-500 text-xs">未設定</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="card-dark p-5">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">お支払い金額</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-400">利用料金</span>
                <span className="text-white">{formatPrice(lesson.price)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-success">クーポン ({coupon.code})</span>
                  <span className="text-success">-{formatPrice(coupon.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-ink-700 pt-2 flex justify-between">
                <span className="font-bold text-white">合計</span>
                <span className="font-bold text-brand-purple text-lg">{formatPrice(finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Coupon */}
          <button
            onClick={() => router.push("/booking/coupon")}
            className="w-full card-dark p-4 flex items-center justify-between hover:border-brand-purple transition-colors"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-brand-purple" />
              <span className="text-sm font-bold text-white">
                {coupon ? `${coupon.code} 適用中` : "クーポンを使う"}
              </span>
            </div>
            <span className="text-ink-400 text-sm">→</span>
          </button>
        </motion.div>

        <div className="mt-6">
          <Button onClick={() => router.push("/booking/payment")} className="w-full" size="lg">
            支払い方法を選ぶ
          </Button>
          <p className="text-center text-xs text-ink-500 mt-3">
            キャンセルポリシー: 前日18時まで全額、当日50%返金
          </p>
        </div>
      </div>
    </div>
  );
}
