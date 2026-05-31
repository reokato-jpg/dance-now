"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserHeader } from "@/components/layout/user-header";
import { useBookingStore } from "@/lib/booking-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const SAMPLE_COUPONS = [
  { code: "DANCE10", label: "DANCE10", desc: "全ジャンル10% OFF", detail: "(3回目以降の予約)", expiry: "〜6/30", type: "PERCENT" as const, value: 10 },
  { code: "FRIEND500", label: "FRIEND500", desc: "友達紹介 ¥500 OFF", detail: "", expiry: "〜5/31", type: "FIXED" as const, value: 500 },
  { code: "BIRTHDAY1000", label: "BIRTHDAY1000", desc: "誕生日 ¥1,000 OFF", detail: "", expiry: "誕生月のみ", type: "FIXED" as const, value: 1000 },
];

export default function CouponPage() {
  const router = useRouter();
  const { lesson, coupon, setCoupon, finalAmount } = useBookingStore();
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!lesson) router.push("/lessons"); }, []);
  if (!lesson) return null;

  const applyCoupon = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, lessonPrice: lesson.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "無効なクーポンです");
      setCoupon(data.coupon);
      toast({ title: "クーポン適用", description: `${data.coupon.code} を適用しました`, variant: "success" as any });
    } catch (err) {
      toast({ title: "エラー", description: err instanceof Error ? err.message : "無効なクーポンです", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setInputCode("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">クーポンを使う</h1>
        <p className="text-gray-500 text-sm mb-6">コードを入力するか、下のクーポンを選択してください</p>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <Input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="クーポンコードを入力"
            className="uppercase tracking-widest font-mono"
          />
          <Button
            onClick={() => applyCoupon(inputCode)}
            disabled={!inputCode || loading}
            variant="outline"
            className="flex-shrink-0"
          >
            適用
          </Button>
        </div>

        {/* Applied coupon */}
        {coupon && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-success bg-success/10 rounded-lg p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <div>
                <p className="font-bold text-gray-900 font-mono">{coupon.code}</p>
                <p className="text-xs text-success">-{formatPrice(coupon.discountAmount)} 割引</p>
              </div>
            </div>
            <button onClick={removeCoupon} className="text-gray-400 hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Available coupons */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">利用可能なクーポン</p>
          <div className="space-y-3">
            {SAMPLE_COUPONS.map((c) => {
              const discountAmt = c.type === "PERCENT"
                ? Math.floor(lesson.price * c.value / 100)
                : c.value;
              const isApplied = coupon?.code === c.code;
              return (
                <div key={c.code} className={`card-light p-4 flex items-center justify-between ${isApplied ? "border-success" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900 font-mono text-sm">{c.label}</p>
                      <p className="text-xs text-gray-600">{c.desc} {c.detail}</p>
                      <p className="text-xs text-brand-pink font-bold mt-0.5">-{formatPrice(discountAmt)} OFF</p>
                      <p className="text-xs text-gray-400">{c.expiry}</p>
                    </div>
                  </div>
                  {isApplied ? (
                    <span className="text-xs font-bold text-success">適用中</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => applyCoupon(c.code)} disabled={loading}>
                      使う
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-gray-500">合計金額</span>
            <span className="font-bold text-brand-purple text-lg">{formatPrice(finalAmount)}</span>
          </div>
          <Button onClick={() => router.push("/booking/payment")} className="w-full" size="lg">
            支払いへ進む
          </Button>
        </div>
      </div>
    </div>
  );
}
