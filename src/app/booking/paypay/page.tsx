"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { useBookingStore } from "@/lib/booking-store";
import { useAuthStore } from "@/lib/auth-store";
import { formatPrice, generateReservationNo } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function PayPayPage() {
  const router = useRouter();
  const { lesson, finalAmount, coupon, clearBooking } = useBookingStore();
  const { customer } = useAuthStore();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [merchantPaymentId, setMerchantPaymentId] = useState<string | null>(null);
  const [timer, setTimer] = useState(300);
  const [status, setStatus] = useState<"waiting" | "completed" | "expired">("waiting");
  const [loading, setLoading] = useState(true);
  // Use ref so polling closure always has the original reservation number
  const reservationNoRef = useRef(generateReservationNo());

  useEffect(() => {
    if (!lesson) { router.push("/lessons"); return; }
    fetch("/api/payments/paypay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: finalAmount,
        reservationNo: reservationNoRef.current,
        lessonTitle: `Studio${lesson.studioName}`,
        customerId: customer?.id,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setQrUrl(d.qrUrl);
        setDeepLink(d.deepLink);
        setMerchantPaymentId(d.merchantPaymentId);
        setLoading(false);
      })
      .catch(() => {
        toast({ title: "エラー", description: "QRコードの生成に失敗しました", variant: "destructive" });
        router.back();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timer <= 0) { setStatus("expired"); return; }
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const completeBooking = useCallback(async (mpId: string) => {
    if (!lesson || !customer) return;
    try {
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          slotId: lesson.id,
          reservationNo: reservationNoRef.current,
          amount: lesson.price,
          discountAmount: coupon?.discountAmount || 0,
          couponCode: coupon?.code,
          paymentMethod: "PAYPAY",
          merchantPaymentId: mpId,
        }),
      });
      const bookData = await bookRes.json();
      clearBooking();
      setTimeout(() => router.push(`/booking/complete?id=${bookData.bookingId}`), 1500);
    } catch {
      toast({ title: "エラー", description: "予約の保存に失敗しました", variant: "destructive" });
    }
  }, [lesson, customer, coupon, clearBooking, router]);

  useEffect(() => {
    if (!merchantPaymentId || status !== "waiting") return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/paypay/status?id=${merchantPaymentId}`);
        const data = await res.json();
        if (data.status === "COMPLETED") {
          setStatus("completed");
          clearInterval(poll);
          await completeBooking(merchantPaymentId);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [merchantPaymentId, status, completeBooking]);

  const formatTimer = () =>
    `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-ink-900">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-400 hover:text-white mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-[#FF0033] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF0033]/30">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">PayPay で支払う</h1>
          <p className="text-brand-purple font-bold text-xl mb-1">{formatPrice(finalAmount)}</p>
        </div>

        {loading ? (
          <div className="card-dark h-64 animate-pulse mt-6" />
        ) : status === "waiting" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <div className="card-dark p-6 flex flex-col items-center">
              <p className="text-xs text-ink-400 mb-4">PCの場合: QRコードをスキャン</p>
              <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-4">
                {qrUrl ? (
                  <img src={qrUrl} alt="PayPay QR" className="w-44 h-44" />
                ) : (
                  <div className="w-44 h-44 bg-ink-200 rounded-lg animate-pulse" />
                )}
              </div>
              <p className="text-sm font-mono text-ink-400">
                残り <span className="text-white font-bold">{formatTimer()}</span>
              </p>
            </div>

            {deepLink && (
              <div className="mt-4">
                <p className="text-xs text-center text-ink-400 mb-3">スマートフォンの場合</p>
                <a href={deepLink} className="block">
                  <Button variant="secondary" className="w-full gap-2">
                    <Smartphone className="w-5 h-5" />
                    PayPay アプリで開く
                  </Button>
                </a>
              </div>
            )}
          </motion.div>
        ) : status === "completed" ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-bold text-success">支払い完了</p>
            <p className="text-ink-400 text-sm mt-1">予約を確定しています...</p>
          </motion.div>
        ) : (
          <div className="mt-10 text-center">
            <p className="text-danger font-bold text-xl mb-4">QRコードの有効期限が切れました</p>
            <Button onClick={() => router.push("/booking/payment")} variant="outline">
              別の支払い方法を選ぶ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
