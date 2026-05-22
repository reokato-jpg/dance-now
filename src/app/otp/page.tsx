"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { useBookingStore } from "@/lib/booking-store";
import { toast } from "@/components/ui/use-toast";

export default function OtpPage() {
  const router = useRouter();
  const { pendingPhone, setCustomer } = useAuthStore();
  const { lesson } = useBookingStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Only guard on initial mount — avoid redirecting when pendingPhone is cleared by setCustomer during verify
    if (!pendingPhone) { router.push("/login"); return; }
    inputs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      verify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = useCallback(async (code: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "認証に失敗しました");
      setCustomer(data.customer);
      // If a lesson was saved before login, go straight to booking
      const pendingLesson = useBookingStore.getState().lesson;
      if (data.isNew) {
        router.push("/profile/setup");
      } else if (pendingLesson) {
        router.push("/booking/confirm");
      } else {
        router.push("/lessons");
      }
    } catch (err) {
      toast({ title: "認証エラー", description: err instanceof Error ? err.message : "コードが正しくありません", variant: "destructive" });
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [loading, pendingPhone, setCustomer, router]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone }),
      });
      setResendTimer(60);
      toast({ title: "再送しました", description: "新しい認証コードを送信しました" });
    } catch {
      toast({ title: "エラー", description: "再送に失敗しました", variant: "destructive" });
    }
  };

  const formatPhone = (phone: string) =>
    phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-purple">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">認証コードを入力</h1>
          <p className="text-ink-400 text-sm">
            <span className="text-white font-mono">{pendingPhone ? formatPhone(pendingPhone) : ""}</span>
            <br />に送信された6桁のコードを入力してください
          </p>
        </div>

        {/* OTP inputs */}
        <div className="flex gap-3 justify-center mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold font-mono bg-ink-700 border-2 border-ink-600 rounded-lg text-white focus:outline-none focus:border-brand-purple transition-colors"
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          {resendTimer > 0 ? (
            <p className="text-ink-500 text-sm">
              再送まで <span className="font-mono text-white">{`0${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, "0")}`}</span>
            </p>
          ) : (
            <button onClick={handleResend} className="text-brand-purple text-sm font-bold hover:underline">
              コードを再送する
            </button>
          )}
        </div>

        <Button
          onClick={() => verify(otp.join(""))}
          disabled={otp.join("").length !== 6 || loading}
          className="w-full"
          size="lg"
        >
          {loading ? "確認中..." : "認証する"}
        </Button>

        <button onClick={() => router.push("/login")} className="w-full text-center text-ink-500 text-sm mt-4 hover:text-white">
          電話番号を変更する
        </button>
      </motion.div>
    </div>
  );
}
