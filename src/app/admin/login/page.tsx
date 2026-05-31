"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string; password: string; totp: string }>();

  const onCredentials = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "認証情報が正しくありません");
      if (json.requireTotp) {
        setStep("totp");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      toast({ title: "ログインエラー", description: err instanceof Error ? err.message : "エラーが発生しました", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  });

  const onTotp = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totp: data.totp }),
      });
      if (!res.ok) throw new Error("認証コードが正しくありません");
      router.push("/admin");
    } catch (err) {
      toast({ title: "2FAエラー", description: err instanceof Error ? err.message : "コードが正しくありません", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-purple">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl tracking-widest brand-gradient-text">STUDIO RENTAL</h1>
          <p className="text-ink-400 text-sm mt-1">ADMIN CONSOLE</p>
        </div>

        {step === "credentials" ? (
          <form onSubmit={onCredentials} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">メールアドレス</label>
              <Input {...register("email")} type="email" placeholder="admin@dance-school.jp" autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 block">パスワード</label>
              <Input {...register("password")} type="password" placeholder="••••••••" autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "確認中..." : "ログイン →"}
            </Button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-6">
              <Shield className="w-10 h-10 text-brand-purple mx-auto mb-2" />
              <h2 className="text-lg font-bold text-white">2段階認証 (TOTP)</h2>
              <p className="text-ink-400 text-sm">認証アプリの6桁コードを入力</p>
            </div>
            <form onSubmit={onTotp} className="space-y-4">
              <Input
                {...register("totp")}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "確認中..." : "認証する"}
              </Button>
            </form>
          </motion.div>
        )}

        <p className="text-center text-xs text-ink-600 mt-6">
          © 2026 STUDIO RENTAL · Admin v1.0
        </p>
      </motion.div>
    </div>
  );
}
