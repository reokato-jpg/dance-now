"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { useBookingStore } from "@/lib/booking-store";
import { useAuthStore } from "@/lib/auth-store";
import { getStripe } from "@/lib/stripe-client";
import { formatPrice, generateReservationNo } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

function DevCardForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { lesson, coupon, finalAmount, clearBooking } = useBookingStore();
  const { customer } = useAuthStore();

  const handleDevPay = async () => {
    if (!lesson || !customer) return;
    setLoading(true);
    try {
      const reservationNo = generateReservationNo();
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          slotId: lesson.id,
          reservationNo,
          amount: lesson.price,
          discountAmount: coupon?.discountAmount || 0,
          couponCode: coupon?.code,
          paymentMethod: "STRIPE",
          paymentIntentId: `dev_pi_${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error("予約の保存に失敗しました");
      const data = await res.json();
      clearBooking();
      router.push(`/booking/complete?id=${data.bookingId}`);
    } catch (err) {
      toast({ title: "エラー", description: err instanceof Error ? err.message : "エラーが発生しました", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-5 mb-4 border border-dashed border-yellow-500/50 bg-yellow-500/5 rounded-lg">
        <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">開発モード</p>
        <p className="text-sm text-gray-500">Stripe 未設定のためテスト支払いをシミュレートします。</p>
      </div>
      <Button onClick={handleDevPay} disabled={loading} className="w-full" size="lg">
        {loading ? "処理中..." : `${formatPrice(finalAmount)} を支払う（テスト）`}
      </Button>
    </div>
  );
}

function CardForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { lesson, coupon, finalAmount, clearBooking } = useBookingStore();
  const { customer } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !lesson || !customer) return;
    setLoading(true);
    try {
      const reservationNo = generateReservationNo();
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/complete`,
        },
        redirect: "if_required",
      });
      if (error) throw new Error(error.message);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          slotId: lesson.id,
          reservationNo,
          amount: lesson.price,
          discountAmount: coupon?.discountAmount || 0,
          couponCode: coupon?.code,
          paymentMethod: "STRIPE",
          paymentIntentId: paymentIntent?.id,
        }),
      });
      if (!res.ok) throw new Error("予約の保存に失敗しました");
      const data = await res.json();
      clearBooking();
      router.push(`/booking/complete?id=${data.bookingId}`);
    } catch (err) {
      toast({ title: "支払いエラー", description: err instanceof Error ? err.message : "支払いに失敗しました", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-light p-5 mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">カード情報</p>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Lock className="w-3.5 h-3.5" />
        <span>Stripe により PCI DSS 準拠で安全に処理されます</span>
      </div>

      <Button type="submit" disabled={!stripe || loading} className="w-full" size="lg">
        {loading ? "処理中..." : `${formatPrice(finalAmount)} を支払う`}
      </Button>
    </form>
  );
}

export default function CardPage() {
  const router = useRouter();
  const { lesson, finalAmount } = useBookingStore();
  const { customer } = useAuthStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  // Only guard on mount — lesson becomes null after clearBooking() when payment succeeds,
  // but the navigation to /booking/complete is already in flight at that point.
  useEffect(() => {
    if (!lesson) router.push("/lessons");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lesson || !customer) return;
    fetch("/api/payments/stripe/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount, customerId: customer.id }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.devMode) setDevMode(true);
        else setClientSecret(d.clientSecret);
      });
  }, [lesson, customer, finalAmount]);

  if (!lesson) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                s <= 2 ? "brand-gradient text-white" : "bg-gray-200 text-gray-400"
              }`}>{s}</div>
              {s < 3 && <div className={`h-px w-8 ${s < 2 ? "bg-brand-purple" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">クレジットカード</h1>
        <p className="text-brand-purple font-bold text-lg mb-6">{formatPrice(finalAmount)}</p>

        {devMode ? (
          <DevCardForm />
        ) : clientSecret ? (
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret,
              locale: "ja",
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#6B46C1",
                  borderRadius: "10px",
                },
              },
            }}
          >
            <CardForm />
          </Elements>
        ) : (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="card-light h-16 animate-pulse" />)}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>3Dセキュア 2.0 対応</span>
        </div>
      </div>
    </div>
  );
}
