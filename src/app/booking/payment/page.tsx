"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, QrCode, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/layout/user-header";
import { useBookingStore } from "@/lib/booking-store";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Method = "stripe" | "paypay";

export default function PaymentMethodPage() {
  const router = useRouter();
  const { lesson, finalAmount } = useBookingStore();
  const [method, setMethod] = useState<Method>("stripe");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!lesson) router.push("/lessons"); }, []);
  if (!lesson) return null;

  const handleProceed = () => {
    if (method === "stripe") router.push("/booking/card");
    else router.push("/booking/paypay");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        {/* Step */}
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

        <h1 className="text-2xl font-bold text-gray-900 mb-1">支払い方法</h1>
        <p className="text-brand-purple font-bold text-lg mb-6">{formatPrice(finalAmount)}</p>

        <div className="space-y-3 mb-6">
          {/* PayPay */}
          <button
            onClick={() => setMethod("paypay")}
            className={cn(
              "w-full card-light p-4 flex items-center gap-4 hover:border-[#FF0033] transition-colors text-left",
              method === "paypay" ? "border-[#FF0033] bg-[#FF0033]/5" : ""
            )}
          >
            <div className="w-12 h-12 bg-[#FF0033] rounded-xl flex items-center justify-center flex-shrink-0">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">PayPay</p>
              <p className="text-xs text-gray-500">QRコードでかんたん支払い</p>
            </div>
            <div className="ml-auto">
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center",
                method === "paypay" ? "border-[#FF0033] bg-[#FF0033]" : "border-gray-300"
              )}>
                {method === "paypay" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>

          {/* Stripe */}
          <button
            onClick={() => setMethod("stripe")}
            className={cn(
              "w-full card-light p-4 flex items-center gap-4 hover:border-brand-purple transition-colors text-left",
              method === "stripe" ? "border-brand-purple bg-brand-purple/5" : ""
            )}
          >
            <div className="w-12 h-12 brand-gradient rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">クレジットカード</p>
              <p className="text-xs text-gray-500">VISA / Mastercard / JCB / AMEX</p>
            </div>
            <div className="ml-auto">
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center",
                method === "stripe" ? "border-brand-purple bg-brand-purple" : "border-gray-300"
              )}>
                {method === "stripe" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        </div>

        <Button onClick={handleProceed} className="w-full" size="lg">
          {formatPrice(finalAmount)} を支払う
        </Button>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>SSL暗号化で保護されています</span>
        </div>
      </div>
    </div>
  );
}
