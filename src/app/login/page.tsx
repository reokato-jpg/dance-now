"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth-store";
import { useBookingStore } from "@/lib/booking-store";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  phone: z
    .string()
    .min(10, "電話番号を正しく入力してください")
    .max(11, "電話番号を正しく入力してください")
    .regex(/^0[0-9]{9,10}$/, "例: 09012345678"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setPendingPhone } = useAuthStore();
  const { lesson } = useBookingStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });
      if (!res.ok) throw new Error("SMS送信に失敗しました");
      setPendingPhone(data.phone);
      router.push("/otp");
    } catch {
      toast({ title: "エラー", description: "SMS送信に失敗しました。もう一度お試しください。", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col">
      {/* Hero */}
      <div className="brand-gradient py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-6xl tracking-widest text-white mb-2">DANCE NOW</h1>
          <p className="text-white/80 text-sm tracking-widest uppercase">
            HIPHOP · JAZZ · K-POP · BALLET · HOUSE · CONTEMPORARY
          </p>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {lesson ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">ログイン / 新規登録</h2>
              <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-xl p-3 mb-6">
                <p className="text-xs text-brand-purple font-bold mb-0.5">予約するレッスン</p>
                <p className="text-sm text-white font-bold truncate">{lesson.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">ログイン後すぐに予約確認に進みます</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">ログイン / 新規登録</h2>
              <p className="text-ink-400 text-sm mb-8">
                携帯電話番号を入力するとSMSで認証コードを送ります
              </p>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2 block">
                電話番号
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-sm font-mono">+81</span>
                <Input
                  {...register("phone")}
                  type="tel"
                  placeholder="09012345678"
                  className="pl-14 font-mono text-lg"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="text-danger text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-ink-400">
              <input type="checkbox" required className="mt-0.5 accent-brand-purple" />
              <span>
                <a href="/terms" className="text-brand-purple">利用規約</a>・
                <a href="/privacy" className="text-brand-purple">プライバシーポリシー</a>
                に同意して続ける
              </span>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "送信中..." : (
                <>SMS認証コードを送る <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-6">
            <Phone className="w-3 h-3 inline mr-1" />
            Twilioにより安全に認証します
          </p>
        </motion.div>
      </div>
    </div>
  );
}
